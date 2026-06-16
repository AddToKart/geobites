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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureDatabaseExists = ensureDatabaseExists;
const pg_1 = require("pg");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
async function ensureDatabaseExists() {
    const useSqlite = process.env.DB_TYPE === 'sqlite';
    if (useSqlite) {
        const dbPath = process.env.SQLITE_PATH || 'geobites.db';
        console.log(`[SQLite] Checking database at: ${dbPath}`);
        const db = new better_sqlite3_1.default(dbPath);
        try {
            db.exec(`
        CREATE TABLE IF NOT EXISTS "_migrations" (
          "name" TEXT NOT NULL PRIMARY KEY,
          "runAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);
            const tableCheck = db
                .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user'")
                .get();
            const migrationCountRes = db
                .prepare('SELECT count(*) as count FROM _migrations')
                .get();
            const migrationDir = path.join(process.cwd(), 'better-auth_migrations');
            if (fs.existsSync(migrationDir)) {
                const files = fs
                    .readdirSync(migrationDir)
                    .filter((f) => f.endsWith('.sql'))
                    .sort();
                if (tableCheck && migrationCountRes.count === 0 && files.length > 0) {
                    console.log('[SQLite] User table already exists, marking initial migration as applied.');
                    db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(files[0]);
                }
                for (const file of files) {
                    const isApplied = db
                        .prepare('SELECT name FROM _migrations WHERE name = ?')
                        .get(file);
                    if (!isApplied) {
                        console.log(`[SQLite] Running migration: ${file}`);
                        const sqlPath = path.join(migrationDir, file);
                        const sql = fs.readFileSync(sqlPath, 'utf8');
                        const runMigrationTx = db.transaction(() => {
                            db.exec(sql);
                            db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
                        });
                        runMigrationTx();
                        console.log(`[SQLite] Migration ${file} completed successfully`);
                    }
                    else {
                        console.log(`[SQLite] Migration ${file} is already applied.`);
                    }
                }
            }
            else {
                console.warn('[SQLite] better-auth_migrations directory not found.');
            }
        }
        catch (err) {
            console.error('[SQLite] Error ensuring database tables exist:', err);
            throw err;
        }
        finally {
            db.close();
        }
        return;
    }
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
            console.log(`Database "${dbName}" created successfully`);
        }
        else {
            console.log(`Database "${dbName}" already exists`);
        }
        const appClient = new pg_1.Client({
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT || 5432),
            user: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: dbName,
        });
        await appClient.connect();
        await appClient.query(`
      CREATE TABLE IF NOT EXISTS "_migrations" (
        "name" VARCHAR(255) NOT NULL PRIMARY KEY,
        "runAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
        const tableRes = await appClient.query(`SELECT tablename FROM pg_catalog.pg_tables WHERE tablename = 'user'`);
        const migrationCountRes = await appClient.query(`SELECT count(*) as count FROM _migrations`);
        const migrationCount = parseInt(migrationCountRes.rows[0].count, 10);
        const migrationDir = path.join(process.cwd(), 'better-auth_migrations');
        if (fs.existsSync(migrationDir)) {
            const files = fs
                .readdirSync(migrationDir)
                .filter((f) => f.endsWith('.sql'))
                .sort();
            if ((tableRes.rowCount ?? 0) > 0 &&
                migrationCount === 0 &&
                files.length > 0) {
                console.log('User table already exists, marking initial migration as applied.');
                await appClient.query('INSERT INTO _migrations (name) VALUES ($1)', [
                    files[0],
                ]);
            }
            for (const file of files) {
                const isAppliedRes = await appClient.query('SELECT name FROM _migrations WHERE name = $1', [file]);
                if (isAppliedRes.rowCount === 0) {
                    console.log(`Running migration: ${file}`);
                    const sqlPath = path.join(migrationDir, file);
                    const sql = fs.readFileSync(sqlPath, 'utf8');
                    await appClient.query('BEGIN');
                    try {
                        await appClient.query(sql);
                        await appClient.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
                        await appClient.query('COMMIT');
                        console.log(`Migration ${file} completed successfully`);
                    }
                    catch (migrationError) {
                        await appClient.query('ROLLBACK');
                        console.error(`Migration ${file} failed:`, migrationError);
                        throw migrationError;
                    }
                }
                else {
                    console.log(`Migration ${file} is already applied.`);
                }
            }
        }
        else {
            console.warn('better-auth_migrations directory not found. Tables may not be created.');
        }
        await appClient.end();
    }
    catch (err) {
        console.error('Error ensuring database and tables exist:', err);
        throw err;
    }
    finally {
        await client.end();
    }
}
//# sourceMappingURL=create-db.js.map