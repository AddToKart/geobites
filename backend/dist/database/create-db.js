"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDatabaseExists = ensureDatabaseExists;
const pg_1 = require("pg");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function ensureDatabaseExists() {
    const dbName = process.env.DB_DATABASE || 'geobites';
    const client = new pg_1.Client({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: 'postgres',
    });
    try {
        await client.connect();
        const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = $1`, [dbName]);
        if (res.rowCount === 0) {
            console.log(`Database "${dbName}" does not exist. Creating...`);
            await client.query(`CREATE DATABASE "${dbName}"`);
        }
        const appClient = new pg_1.Client({
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT || 5432),
            user: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: dbName,
        });
        await appClient.connect();
        const tableRes = await appClient.query(`SELECT tablename FROM pg_catalog.pg_tables WHERE tablename = 'user'`);
        if (tableRes.rowCount === 0) {
            console.log('Better Auth tables missing. Running auto-initialization...');
            const migrationDir = path.join(process.cwd(), 'better-auth_migrations');
            if (fs.existsSync(migrationDir)) {
                const files = fs
                    .readdirSync(migrationDir)
                    .filter((f) => f.endsWith('.sql'));
                if (files.length > 0) {
                    const sqlPath = path.join(migrationDir, files[0]);
                    const sql = fs.readFileSync(sqlPath, 'utf8');
                    await appClient.query(sql);
                    console.log('Better Auth tables created successfully via SQL migration.');
                }
            }
        }
        await appClient.end();
    }
    catch (err) {
        console.error('Error ensuring database and tables exist:', err);
    }
    finally {
        await client.end();
    }
}
//# sourceMappingURL=create-db.js.map