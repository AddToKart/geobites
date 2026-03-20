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
          .filter((f) => f.endsWith('.sql'));
        if (files.length > 0) {
          // Sort to get latest if multiple, but here we just take the first
          const sqlPath = path.join(migrationDir, files[0]);
          const sql = fs.readFileSync(sqlPath, 'utf8');
          await appClient.query(sql);
          console.log(
            'Better Auth tables created successfully via SQL migration.',
          );
        }
      }
    }

    await appClient.end();
  } catch (err) {
    console.error('Error ensuring database and tables exist:', err);
  } finally {
    await client.end();
  }
}
