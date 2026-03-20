// Read from environment variable (EXPO_PUBLIC_API_URL from .env)
// Falls back to localhost for simulator/emulator development
export const API_URL = 
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export const AUTH_BASE_URL = API_URL.replace(/\/api$/, '');
