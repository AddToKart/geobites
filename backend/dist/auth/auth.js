"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const better_auth_1 = require("better-auth");
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
const pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'geobites',
});
if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error('FATAL: BETTER_AUTH_SECRET environment variable is required');
}
exports.auth = (0, better_auth_1.betterAuth)({
    appName: 'Geobites',
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: parseTrustedOrigins(),
    database: pool,
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
        },
    },
});
//# sourceMappingURL=auth.js.map