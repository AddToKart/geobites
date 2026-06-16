"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypeOrmConfig = getTypeOrmConfig;
function getTypeOrmConfig(configService) {
    const dbType = configService.get('DB_TYPE', 'postgres');
    if (dbType === 'sqlite') {
        return {
            type: 'better-sqlite3',
            database: configService.get('SQLITE_PATH', 'geobites.db'),
            synchronize: true,
            autoLoadEntities: true,
        };
    }
    const host = configService.get('DB_HOST', 'localhost');
    const port = Number(configService.get('DB_PORT', '5432'));
    const username = configService.get('DB_USERNAME', 'postgres');
    const password = configService.get('DB_PASSWORD', 'postgres');
    const database = configService.get('DB_DATABASE', 'geobites');
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
//# sourceMappingURL=typeorm.config.js.map