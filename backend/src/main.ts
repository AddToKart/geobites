import * as dotenv from 'dotenv';
dotenv.config();

import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ensureDatabaseExists } from './database/create-db';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import * as os from 'os';

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:8081',
  'http://localhost:19006',
];

function getLocalIpAddresses(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips;
}

function parseCorsOrigins(): string[] {
  const rawOrigins = process.env.CORS_ORIGIN;
  const parsedOrigins = rawOrigins
    ? rawOrigins.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [];

  const baseOrigins = parsedOrigins.length > 0 ? parsedOrigins : defaultOrigins;

  // Dynamically resolve and add all local IP addresses on relevant ports to CORS
  const localIps = getLocalIpAddresses();
  const localIPOrigins: string[] = [];
  for (const ip of localIps) {
    localIPOrigins.push(`http://${ip}:3000`);
    localIPOrigins.push(`http://${ip}:5173`);
    localIPOrigins.push(`http://${ip}:8081`);
    localIPOrigins.push(`http://${ip}:19006`);
  }

  return [...new Set([...baseOrigins, ...localIPOrigins])];
}

async function bootstrap() {
  // Ensure the database exists before initializing TypeORM and Auth
  if (process.env.USE_MEMORY_DB !== 'true') {
    await ensureDatabaseExists();
  }

  // Dynamically import modules so they only initialize AFTER DB creation
  const { AppModule } = await import('./app.module.js');
  const { auth } = await import('./auth/auth.js');
  const { toNodeHandler } = await import('better-auth/node');

  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(cookieParser());
  app.enableCors({
    origin: parseCorsOrigins(),
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

  app.use('/api', (req: any, res: any, next: any) => {
    console.log(`[Incoming Request] ${req.method} ${req.originalUrl}`);
    console.log(`[Headers] Authorization: ${req.headers.authorization}`);
    console.log(`[Headers] Cookie: ${req.headers.cookie}`);
    next();
  });

  app.use('/api/auth', toNodeHandler(auth));

  const port = Number(process.env.PORT ?? 3000);
  const server = await app.listen(port, '0.0.0.0');
  console.log(`Backend server running on http://localhost:${port}/api`);
  console.log(`Local network access: http://192.168.100.116:${port}/api`);

  // Seed demo data
  const { DataSource } = await import('typeorm');
  const { seedDemoData } = await import('./database/seed-demo.js');
  const dataSource = app.get(DataSource);
  await seedDemoData(dataSource);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(async () => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    server.close(async () => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

void bootstrap();
