"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const pg_1 = require("pg");
function parseTrustedOrigins() {
    const defaultOrigins = [
        'http://localhost:5173',
        'http://localhost:8081',
        'http://localhost:19006',
        'http://192.168.100.116:5173',
        'http://192.168.100.116:3000',
    ];
    const configuredOrigins = process.env.CORS_ORIGIN;
    if (!configuredOrigins) {
        return defaultOrigins;
    }
    const parsedOrigins = configuredOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    return [...new Set([...parsedOrigins, ...defaultOrigins])];
}
const useSqlite = process.env.DB_TYPE === 'sqlite';
let databaseConfig;
if (useSqlite) {
    const dbPath = process.env.SQLITE_PATH || 'geobites.db';
    console.log(`[SQLite] Using Better Auth with persistent database: ${dbPath}`);
    databaseConfig = new better_sqlite3_1.default(dbPath);
}
else {
    databaseConfig = new pg_1.Pool({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || '5432'),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'geobites',
    });
}
if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error('FATAL: BETTER_AUTH_SECRET environment variable is required');
}
exports.auth = (0, better_auth_1.betterAuth)({
    appName: 'Geobites',
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: parseTrustedOrigins(),
    database: databaseConfig,
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
    },
    advancedCookie: {
        useSecureCookies: false,
    },
    user: {
        additionalFields: {
            role: {
                type: 'string',
                required: true,
                defaultValue: 'customer',
            },
            phone: {
                type: 'string',
                required: false,
            },
            storeName: {
                type: 'string',
                required: false,
            },
            businessPermit: {
                type: 'string',
                required: false,
            },
            vehicleType: {
                type: 'string',
                required: false,
            },
            licenseNumber: {
                type: 'string',
                required: false,
            },
            street: {
                type: 'string',
                required: false,
            },
            barangay: {
                type: 'string',
                required: false,
            },
            landmark: {
                type: 'string',
                required: false,
            },
            deliveryLat: {
                type: 'string',
                required: false,
            },
            deliveryLng: {
                type: 'string',
                required: false,
            },
        },
    },
});
//# sourceMappingURL=auth.js.map