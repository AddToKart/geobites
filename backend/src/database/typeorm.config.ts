import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function getTypeOrmConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const dbType = configService.get<string>('DB_TYPE', 'postgres');

  if (dbType === 'sqlite') {
    return {
      type: 'better-sqlite3',
      database: configService.get<string>('SQLITE_PATH', 'geobites.db'),
      synchronize: true,
      autoLoadEntities: true,
    };
  }

  const host = configService.get<string>('DB_HOST', 'localhost');
  const port = Number(configService.get<string>('DB_PORT', '5432'));
  const username = configService.get<string>('DB_USERNAME', 'postgres');
  const password = configService.get<string>('DB_PASSWORD', 'postgres');
  const database = configService.get<string>('DB_DATABASE', 'geobites');

  return {
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    synchronize: true, // Re-enabled for local development to auto-create new columns
    autoLoadEntities: true,
    logging: false,
  };
}
