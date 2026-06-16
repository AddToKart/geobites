// Trigger compilation reload after schema type change
import * as dotenv from 'dotenv';
dotenv.config();

import * as path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ensureDatabaseExists } from './database/create-db';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:8081',
  'http://localhost:19006',
  'http://10.0.2.2:3000',
  'http://10.0.2.2:8081',
  'http://10.0.2.2:19006',
  'http://10.0.2.2:5173',
  'http://10.0.2.2',
];

function parseCorsOrigins(): string[] {
  const rawOrigins = process.env.CORS_ORIGIN;
  if (!rawOrigins) {
    return defaultOrigins;
  }

  const parsedOrigins = rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...parsedOrigins, ...defaultOrigins])];
}

async function bootstrap() {
  // Ensure the database exists before initializing TypeORM and Auth
  await ensureDatabaseExists();

  // Dynamically import modules so they only initialize AFTER DB creation
  const { AppModule } = await import('./app.module.js');
  const { auth } = await import('./auth/auth.js');
  const { toNodeHandler } = await import('better-auth/node');

  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(cookieParser());
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

  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.use('/api/auth', toNodeHandler(auth));

  const port = Number(process.env.PORT ?? 3000);
  const server = await app.listen(port, '0.0.0.0');
  console.log(`Backend server running on http://localhost:${port}/api`);
  console.log(`Local network access: http://192.168.100.116:${port}/api`);

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
