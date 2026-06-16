import { betterAuth } from 'better-auth';
import Database from 'better-sqlite3';
import { Pool } from 'pg';

type Role = 'customer' | 'seller' | 'rider';

function buildTrustedOrigins(): string[] {
  const lanIp = process.env.LAN_IP || '192.168.100.116';

  // Enumerate common Flutter Web / Vite / Expo / DevTools ports so Better Auth
  // accepts requests from any of them. Flutter Web randomises its port on every run.
  const commonPorts = [
    3000, 5173, 8080, 8081, 8082, 8083, 8084, 8085,
    19000, 19001, 19002, 19006,
    // Flutter Web range — covers the most common random dev ports
    ...Array.from({ length: 200 }, (_, i) => 49152 + i * 50),
    // Additional common Flutter Web ports observed in practice
    56000, 57000, 58000, 59000, 60000, 61000, 62000,
    63000, 63856, 64000, 65000,
  ];

  const localhostOrigins = commonPorts.flatMap((p) => [
    `http://localhost:${p}`,
    `http://127.0.0.1:${p}`,
  ]);

  const baseOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    // Android emulator
    'http://10.0.2.2:3000',
    'http://10.0.2.2:5173',
    // LAN IP for physical device testing
    `http://${lanIp}:3000`,
    `http://${lanIp}:5173`,
    `http://${lanIp}:8081`,
  ];

  // Merge any additional origins from .env
  const extraOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return [...new Set([...baseOrigins, ...localhostOrigins, ...extraOrigins])];
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
  trustedOrigins: buildTrustedOrigins(),
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
