"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypeOrmConfig = getTypeOrmConfig;
function getTypeOrmConfig(configService) {
    const host = configService.get('DB_HOST', 'localhost');
    const port = Number(configService.get('DB_PORT', '5432'));
    const username = configService.get('DB_USERNAME', 'postgres');
    const password = configService.get('DB_PASSWORD', 'postgres');
    const database = configService.get('DB_DATABASE', 'geobites');
    const useMemoryDb = configService.get('USE_MEMORY_DB', 'false') === 'true';
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
//# sourceMappingURL=typeorm.config.js.map