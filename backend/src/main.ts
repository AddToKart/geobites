// Trigger compilation reload after schema type change
import * as dotenv from 'dotenv';
dotenv.config();

import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ensureDatabaseExists } from './database/create-db';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as express from 'express';
import { join } from 'path';
import { networkInterfaces } from 'os';

function getLocalIpAddress(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] ?? []) {
      if (
        (net.family === 'IPv4' || (net.family as any) === 4) &&
        !net.internal
      ) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

const detectedLanIp = getLocalIpAddress();
const lanIp = process.env.LAN_IP || detectedLanIp;

/**
 * Dynamic CORS origin resolver — allows:
 *  - Any localhost origin (any port) — covers Flutter Web random port + Vite + Expo
 *  - Any 10.0.2.2 origin (Android emulator host)
 *  - The configured LAN IP (physical device testing)
 *  - Any additional origins listed in CORS_ORIGIN env var
 */
function allowOrigin(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) {
  // Allow requests with no origin (mobile native, curl, Postman, etc.)
  if (!origin) return callback(null, true);

  const extraOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
    origin,
  );
  const isEmulator = /^https?:\/\/10\.0\.2\.2(:\d+)?$/.test(origin);
  const isLanIp =
    origin.startsWith(`http://${lanIp}`) ||
    origin.startsWith(`https://${lanIp}`);
  const isExtraAllowed = extraOrigins.includes(origin);

  if (isLocalhost || isEmulator || isLanIp || isExtraAllowed) {
    return callback(null, true);
  }

  return callback(new Error(`CORS: origin '${origin}' not allowed`));
}

async function bootstrap() {
  // Ensure the database exists before initializing TypeORM and Auth
  await ensureDatabaseExists();

  // Dynamically import modules so they only initialize AFTER DB creation
  const { AppModule } = await import('./app.module.js');
  const { auth } = await import('./auth/auth.js');
  const { toNodeHandler } = await import('better-auth/node');

  const app = await NestFactory.create(AppModule);

  // Attach Socket.IO to the same HTTP server as the REST API
  app.useWebSocketAdapter(new IoAdapter(app));

  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(cookieParser());
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  app.use((req: any, res: any, next: any) => {
    if (req.headers.cookie) {
      req.headers.cookie = req.headers.cookie
        .split(';')
        .map((c: string) => c.trim())
        .filter((c: string) => {
          const name = c.split('=')[0].trim();
          return (
            !name.endsWith('session_data') && !name.endsWith('account_data')
          );
        })
        .join('; ');
    }
    next();
  });
  app.enableCors({
    origin: allowOrigin,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Better Auth validates the Origin header against its trustedOrigins list.
  // Unlike NestJS CORS (which uses our dynamic allowOrigin callback),
  // Better Auth only accepts a static string[]. Flutter Web uses a random
  // ephemeral port on every run, so we intercept /api/auth requests and
  // rewrite any localhost / emulator / LAN origin to a single known-trusted
  // value before Better Auth's handler sees it.
  app.use('/api/auth', (req: any, _res: any, next: any) => {
    const origin: string | undefined = req.headers['origin'];
    if (!origin) return next();

    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
      origin,
    );
    const isEmulator = /^https?:\/\/10\.0\.2\.2(:\d+)?$/.test(origin);
    const isLanIp =
      origin.startsWith(`http://${lanIp}`) ||
      origin.startsWith(`https://${lanIp}`);

    if (isLocalhost || isEmulator || isLanIp) {
      // Rewrite to a canonical trusted origin so Better Auth's check passes
      req.headers['origin'] = 'http://localhost:3000';
    }
    next();
  });

  app.use('/api/auth', toNodeHandler(auth));

  const port = Number(process.env.PORT ?? 3000);
  const server = await app.listen(port, '0.0.0.0');
  console.log(`Backend server running on http://localhost:${port}/api`);
  console.log(`Local network access: http://${lanIp}:${port}/api`);

  // Seed demo data
  const { DataSource } = await import('typeorm');
  const { seedDemoData } = await import('./database/seed-demo.js');
  const dataSource = app.get(DataSource);
  await seedDemoData(dataSource);

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

void bootstrap();
