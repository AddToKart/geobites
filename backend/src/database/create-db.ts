import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

export async function ensureDatabaseExists() {
  const useSqlite = process.env.DB_TYPE === 'sqlite';
  if (useSqlite) {
    const dbPath = process.env.SQLITE_PATH || 'geobites.db';
    console.log(`[SQLite] Checking database at: ${dbPath}`);
    const db = new Database(dbPath);
    try {
      // Create migration tracking table if not exists
      db.exec(`
        CREATE TABLE IF NOT EXISTS "_migrations" (
          "name" TEXT NOT NULL PRIMARY KEY,
          "runAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `);

      const tableCheck = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='user'",
        )
        .get();

      const migrationCountRes = db
        .prepare('SELECT count(*) as count FROM _migrations')
        .get() as { count: number };

      const migrationDir = path.join(process.cwd(), 'better-auth_migrations');
      if (fs.existsSync(migrationDir)) {
        const files = fs
          .readdirSync(migrationDir)
          .filter((f) => f.endsWith('.sql'))
          .sort();

        // Backward compatibility: If the 'user' table already exists, but tracking is empty,
        // it means the initial migration was run before tracking was added.
        // We mark the first migration file as applied to avoid trying to recreate tables.
        if (tableCheck && migrationCountRes.count === 0 && files.length > 0) {
          console.log(
            '[SQLite] User table already exists, marking initial migration as applied.',
          );
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
          } else {
            console.log(`[SQLite] Migration ${file} is already applied.`);
          }
        }
      } else {
        console.warn('[SQLite] better-auth_migrations directory not found.');
      }
    } catch (err) {
      console.error('[SQLite] Error ensuring database tables exist:', err);
      throw err;
    } finally {
      db.close();
    }
    return;
  }

  const dbName = process.env.DB_DATABASE || 'geobites';
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres',
  });

  try {
    await client.connect();
    const res = await client.query(
      `SELECT datname FROM pg_catalog.pg_database WHERE datname = $1`,
      [dbName],
    );
    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating...`);
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully`);
    } else {
      console.log(`Database "${dbName}" already exists`);
    }

    // Now connect to the geobites database to check for tables
    const appClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: dbName,
    });

    await appClient.connect();

    // Create migration tracking table if not exists
    await appClient.query(`
      CREATE TABLE IF NOT EXISTS "_migrations" (
        "name" VARCHAR(255) NOT NULL PRIMARY KEY,
        "runAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // Check if "user" table exists
    const tableRes = await appClient.query(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE tablename = 'user'`,
    );

    const migrationCountRes = await appClient.query(
      `SELECT count(*) as count FROM _migrations`,
    );
    const migrationCount = parseInt(
      migrationCountRes.rows[0].count as string,
      10,
    );

    const migrationDir = path.join(process.cwd(), 'better-auth_migrations');
    if (fs.existsSync(migrationDir)) {
      const files = fs
        .readdirSync(migrationDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

      // Backward compatibility for Postgres
      if (
        (tableRes.rowCount ?? 0) > 0 &&
        migrationCount === 0 &&
        files.length > 0
      ) {
        console.log(
          'User table already exists, marking initial migration as applied.',
        );
        await appClient.query('INSERT INTO _migrations (name) VALUES ($1)', [
          files[0],
        ]);
      }

      for (const file of files) {
        const isAppliedRes = await appClient.query(
          'SELECT name FROM _migrations WHERE name = $1',
          [file],
        );

        if (isAppliedRes.rowCount === 0) {
          console.log(`Running migration: ${file}`);
          const sqlPath = path.join(migrationDir, file);
          const sql = fs.readFileSync(sqlPath, 'utf8');

          await appClient.query('BEGIN');
          try {
            await appClient.query(sql);
            await appClient.query(
              'INSERT INTO _migrations (name) VALUES ($1)',
              [file],
            );
            await appClient.query('COMMIT');
            console.log(`Migration ${file} completed successfully`);
          } catch (migrationError) {
            await appClient.query('ROLLBACK');
            console.error(`Migration ${file} failed:`, migrationError);
            throw migrationError;
          }
        } else {
          console.log(`Migration ${file} is already applied.`);
        }
      }
    } else {
      console.warn(
        'better-auth_migrations directory not found. Tables may not be created.',
      );
    }

    await appClient.end();
  } catch (err) {
    console.error('Error ensuring database and tables exist:', err);
    throw err;
  } finally {
    await client.end();
  }
}
