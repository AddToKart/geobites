import type { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function getTypeOrmConfig(
  configService: ConfigService,
): TypeOrmModuleOptions {
  const host = configService.get<string>('DB_HOST', 'localhost');
  const port = Number(configService.get<string>('DB_PORT', '5432'));
  const username = configService.get<string>('DB_USERNAME', 'postgres');
  const password = configService.get<string>('DB_PASSWORD', 'postgres');
  const database = configService.get<string>('DB_DATABASE', 'geobites');
  const useMemoryDb =
    configService.get<string>('USE_MEMORY_DB', 'false') === 'true';

  if (useMemoryDb) {
    return {
      type: 'sqljs',
      autoSave: false,
      synchronize: true,
      logging: false,
      autoLoadEntities: true,
    };
  }

  return {
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    synchronize: true,
    autoLoadEntities: true,
    logging: false,
  };
}
