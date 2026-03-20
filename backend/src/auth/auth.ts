import { betterAuth } from 'better-auth';
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

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'geobites',
});

export const auth = betterAuth({
  appName: 'Geobites',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  secret:
    process.env.BETTER_AUTH_SECRET ??
    'geobites-dev-secret-change-in-production',
  trustedOrigins: parseTrustedOrigins(),
  database: pool,
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
    },
  },
});
