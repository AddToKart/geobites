import { betterAuth } from 'better-auth';
import Database from 'better-sqlite3';
import { Pool } from 'pg';

type Role = 'customer' | 'seller' | 'rider';

function parseTrustedOrigins(): string[] {
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

  // Add the current machine IP to trusted origins automatically
  return [...new Set([...parsedOrigins, ...defaultOrigins])];
}

const useSqlite = process.env.DB_TYPE === 'sqlite';

let databaseConfig: any;
if (useSqlite) {
  const dbPath = process.env.SQLITE_PATH || 'geobites.db';
  console.log(`[SQLite] Using Better Auth with persistent database: ${dbPath}`);
  databaseConfig = new Database(dbPath);
} else {
  databaseConfig = new Pool({
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

export const auth = betterAuth({
  appName: 'Geobites',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: parseTrustedOrigins(),
  database: databaseConfig,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
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
        type: 'number',
        required: false,
      },
      deliveryLng: {
        type: 'number',
        required: false,
      },
    },
  },
});
