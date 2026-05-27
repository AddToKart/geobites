import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export async function ensureDatabaseExists() {
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

    // Check if "user" table exists (Better Auth managed)
    const tableRes = await appClient.query(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE tablename = 'user'`,
    );

    if (tableRes.rowCount === 0) {
      console.log('Better Auth tables missing. Running auto-initialization...');

      const migrationDir = path.join(process.cwd(), 'better-auth_migrations');
      if (fs.existsSync(migrationDir)) {
        const files = fs
          .readdirSync(migrationDir)
          .filter((f) => f.endsWith('.sql'))
          .sort();

        for (const file of files) {
          console.log(`Running migration: ${file}`);
          const sqlPath = path.join(migrationDir, file);
          const sql = fs.readFileSync(sqlPath, 'utf8');
          try {
            await appClient.query(sql);
            console.log(`Migration ${file} completed successfully`);
          } catch (migrationError) {
            console.error(`Migration ${file} failed:`, migrationError);
          }
        }
      } else {
        console.warn(
          'better-auth_migrations directory not found. Tables may not be created.',
        );
      }
    } else {
      console.log('Better Auth tables already exist');
    }

    await appClient.end();
  } catch (err) {
    console.error('Error ensuring database and tables exist:', err);
    throw err;
  } finally {
    await client.end();
  }
}
