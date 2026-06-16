import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
export declare function getTypeOrmConfig(configService: ConfigService): TypeOrmModuleOptions;
