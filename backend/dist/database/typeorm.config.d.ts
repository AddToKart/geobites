import type { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
export declare function getTypeOrmConfig(configService: ConfigService): TypeOrmModuleOptions;
