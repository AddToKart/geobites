import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins';
import { Pool } from 'pg';
// @ts-expect-error - missing type definitions for better-sqlite3
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

type Role = 'customer' | 'seller' | 'rider';

function getLocalIpAddresses(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }
  return ips;
}

function parseTrustedOrigins(): string[] {
  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:8081',
    'http://localhost:19006',
    'http://192.168.100.116:5173',
    'http://192.168.100.116:3000',
    'http://10.0.2.2:3000',
    'http://10.0.2.2:8081',
    'http://10.0.2.2:5173',
  ];

  // Dynamically resolve and add all local IP addresses on relevant ports
  const localIps = getLocalIpAddresses();
  const localIPOrigins: string[] = [];
  for (const ip of localIps) {
    localIPOrigins.push(`http://${ip}:3000`);
    localIPOrigins.push(`http://${ip}:5173`);
    localIPOrigins.push(`http://${ip}:8081`);
    localIPOrigins.push(`http://${ip}:19006`);
  }

  const configuredOrigins = process.env.CORS_ORIGIN;
  const parsedOrigins = configuredOrigins
    ? configuredOrigins.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [];

  // Add the dynamic local IP origins to the trusted list automatically
  return [...new Set([...parsedOrigins, ...defaultOrigins, ...localIPOrigins])];
}

const useMemoryDb = process.env.USE_MEMORY_DB === 'true';

let databaseConfig: any;
if (useMemoryDb) {
  console.log('[Memory DB] Using Better Auth fallback in-memory database adapter...');
  databaseConfig = undefined;
} else {
  databaseConfig = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'geobites',
  });
}

let dbInstance: any = null;
if (process.env.USE_MEMORY_DB === 'true') {
  dbInstance = new Database('geobites-dev.db');
  try {
    const tableExists = dbInstance.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='user'").get();
    if (!tableExists) {
      const migrationFile = path.join(process.cwd(), 'better-auth_migrations', '2026-03-18T13-18-02.895Z.sql');
      if (fs.existsSync(migrationFile)) {
        let sql = fs.readFileSync(migrationFile, 'utf8');
        sql = sql.replace(/timestamptz/g, 'datetime');
        const statements = sql.split(';').map((s: string) => s.trim()).filter(Boolean);
        for (const statement of statements) {
          dbInstance.exec(statement);
        }
        console.log('Successfully initialized Better Auth tables in persistent SQLite database.');
      } else {
        console.warn('better-auth migration SQL file not found!');
      }
    } else {
      console.log('Better Auth tables already exist in persistent SQLite database.');
    }

    // Pre-seed default demo users for instant developer login
    const demoUsers = [
      {
        id: 'demo-user-ciel',
        name: 'Ciel',
        email: 'ciel@gmail.com',
        role: 'customer',
        password: 'password123',
      },
      {
        id: 'demo-user-customer',
        name: 'Demo Customer',
        email: 'customer@geobites.com',
        role: 'customer',
        password: 'password123',
      },
      {
        id: 'demo-seller-kape-baryo',
        name: 'Kape at Almusal Baryo Owner',
        email: 'seller-kape@geobites.com',
        role: 'seller',
        password: 'password123',
      },
      {
        id: 'demo-seller-ihaw-central',
        name: 'Bulacan Ihaw Central Owner',
        email: 'seller-ihaw@geobites.com',
        role: 'seller',
        password: 'password123',
      },
      {
        id: 'demo-seller-pancit-palengke',
        name: 'Palengke Pancit Corner Owner',
        email: 'seller-pancit@geobites.com',
        role: 'seller',
        password: 'password123',
      },
      {
        id: 'demo-seller-garden-sweets',
        name: 'Garden Halo & Sweets Owner',
        email: 'seller-garden@geobites.com',
        role: 'seller',
        password: 'password123',
      },
      {
        id: 'demo-user-seller',
        name: 'Demo Seller',
        email: 'seller@geobites.com',
        role: 'seller',
        password: 'password123',
      },
      {
        id: 'demo-user-rider',
        name: 'Demo Rider',
        email: 'rider@geobites.com',
        role: 'rider',
        password: 'password123',
      },
    ];

    const bcrypt = require('bcryptjs');
    for (const u of demoUsers) {
      const userExists = dbInstance.prepare("SELECT id FROM user WHERE email = ?").get(u.email);
      if (!userExists) {
        console.log(`Seeding demo user: ${u.email} (${u.role})`);
        
        // Insert into user table
        dbInstance.prepare(
          `INSERT INTO user (id, name, email, emailVerified, role, createdAt, updatedAt) 
           VALUES (?, ?, ?, 1, ?, datetime('now'), datetime('now'))`
        ).run(u.id, u.name, u.email, u.role);

        // Insert into account table
        const hashedPassword = bcrypt.hashSync(u.password, 10);
        dbInstance.prepare(
          `INSERT INTO account (id, accountId, providerId, userId, password, createdAt, updatedAt) 
           VALUES (?, ?, 'credential', ?, ?, datetime('now'), datetime('now'))`
        ).run(`account-${u.id}`, u.email, u.id, hashedPassword);
      }
    }
  } catch (err) {
    console.error('Failed to initialize or seed Better Auth persistent SQLite database:', err);
  }
}

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('FATAL: BETTER_AUTH_SECRET environment variable is required');
}

export const auth = betterAuth({
  appName: 'Geobites',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  trustHost: true,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: parseTrustedOrigins(),
  database: process.env.USE_MEMORY_DB === 'true' ? dbInstance : databaseConfig,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    password: {
      hash: async (password: string) => {
        const bcrypt = require('bcryptjs');
        return bcrypt.hashSync(password, 10);
      },
      verify: async ({ hash, password }) => {
        const bcrypt = require('bcryptjs');
        return bcrypt.compareSync(password, hash);
      },
    },
  },
  // Disable advanced cookie features for local development to avoid SameSite issues over HTTP
  advancedCookie: {
    useSecureCookies: false,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: 'customer' satisfies Role,
      },
      phone: {
        type: 'string',
        required: false,
      },
    },
  },
  plugins: [bearer()],
});
