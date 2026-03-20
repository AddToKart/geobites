# Geobites — Project Setup Guide

## Prerequisites

Ensure the following are installed on your development machine:

| Software | Version | Download |
|----------|---------|----------|
| **Node.js** | v18+ (LTS recommended) | [nodejs.org](https://nodejs.org) |
| **npm** | v9+ (bundled with Node) | — |
| **TypeScript** | v5+ (installed per project) | via npm |
| **PostgreSQL** | v15+ | [postgresql.org](https://postgresql.org/download) |
| **Git** | Latest | [git-scm.com](https://git-scm.com) |
| **Expo CLI** | Latest (for mobile) | `npm install -g expo-cli` |

> **Note**: All three layers (backend, frontend, mobile) are written in **TypeScript**. TypeScript is installed as a project dependency — no global install required.

---

## 1. Database Setup

### Install & Start PostgreSQL

**Windows (via installer):**
- Download and install from [postgresql.org](https://postgresql.org/download/windows/)
- PostgreSQL service starts automatically

**macOS (via Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Create the Database

```bash
# Connect to PostgreSQL
psql -U postgres

# In psql shell:
CREATE DATABASE geobites;
CREATE USER geobites_user WITH PASSWORD 'geobites_password';
GRANT ALL PRIVILEGES ON DATABASE geobites TO geobites_user;
\q
```

> **Note**: Update credentials in `backend/.env` if using different values.

---

## 2. Backend Setup (NestJS + Better Auth)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Core dependencies that will be installed:
# - @nestjs/typeorm, typeorm, pg      → database ORM
# - better-auth                       → authentication
# - class-validator, class-transformer → request validation

# Create environment file
cp .env.example .env
```

### Environment Variables (`backend/.env`)

```env
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=geobites

# Better Auth
BETTER_AUTH_SECRET=your-super-secret-key-change-in-production
BETTER_AUTH_URL=http://localhost:3000

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Better Auth Backend Setup

Better Auth is configured as a standalone auth handler that mounts alongside NestJS:

```typescript
// src/auth/auth.ts
import { betterAuth } from 'better-auth';
import { typeormAdapter } from 'better-auth/adapters/typeorm';
import { getDataSource } from '../database/datasource';

export const auth = betterAuth({
  database: typeormAdapter(getDataSource()),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      role: { type: 'string', required: true, defaultValue: 'customer' },
      phone: { type: 'string', required: false },
    },
  },
  trustedOrigins: [process.env.CORS_ORIGIN ?? 'http://localhost:5173'],
});
```

> Better Auth automatically creates its required tables (`users`, `sessions`, `accounts`, `verifications`) via its adapter — no manual migration needed for auth tables.

### Run the Backend

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api`

### Verify Backend

```bash
# Register a test customer
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@test.com","password":"password123","name":"Test","role":"customer"}'

# Get current session (uses saved cookie)
curl http://localhost:3000/api/auth/get-session -b cookies.txt
```


---

## 3. Frontend Setup (ReactJS + Tailwind v4 + shadcn/ui)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The web app will be available at `http://localhost:5173`

### Environment Variables (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000/api
```

### Installing Tailwind CSS v4

```bash
# Install Tailwind v4 and the Vite plugin
npm install tailwindcss @tailwindcss/vite

# In vite.config.ts, add the Tailwind plugin:
# import tailwindcss from '@tailwindcss/vite'
# plugins: [react(), tailwindcss()]

# In your main CSS file (src/index.css), add:
# @import "tailwindcss";
```

> **Note**: Tailwind v4 has **no `tailwind.config.js`**. All theme customization is done via `@theme {}` blocks in your CSS file.

### Installing shadcn/ui

```bash
# Initialize shadcn/ui (run inside frontend/)
npx shadcn@latest init

# Answer the prompts:
# ✔ Which style would you like to use? › Default
# ✔ Which color would you like to use as base color? › Slate
# ✔ Would you like to use CSS variables for colors? › yes

# Add individual components as needed, e.g.:
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add badge
npx shadcn@latest add dialog
npx shadcn@latest add tabs
npx shadcn@latest add table
npx shadcn@latest add select
npx shadcn@latest add skeleton
npx shadcn@latest add toast
npx shadcn@latest add avatar
```

Components are placed in `src/components/ui/` and are fully customizable TypeScript files.

### Build for Production

```bash
npm run build
# Output in frontend/dist/
```


---

## 4. Mobile Setup (React Native / Expo)

```bash
# Navigate to native directory
cd native

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

### Running on Devices

```bash
# iOS Simulator (macOS only)
npx expo start --ios

# Android Emulator
npx expo start --android

# Physical device
# Scan the QR code with Expo Go app
npx expo start
```

### API URL Configuration

Update the API URL in `native/src/utils/constants.ts`:

```typescript
// For physical devices, use your machine's local IP
// (not localhost, as the device can't resolve it)
export const API_URL = 'http://192.168.x.x:3000/api' as const;

// For simulators/emulators
// iOS Simulator: http://localhost:3000/api
// Android Emulator: http://10.0.2.2:3000/api
```

---

## 5. Running the Full Stack

### Option A: Manual (3 terminals)

```bash
# Terminal 1 — Backend
cd backend && npm run start:dev

# Terminal 2 — Frontend
cd frontend && npm run dev

# Terminal 3 — Mobile
cd native && npx expo start
```

### Option B: Docker Compose (Future)

```yaml
# docker-compose.yml (to be created in Phase 6)
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: geobites
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
```

---

## 6. Common Issues & Troubleshooting

| Issue | Solution |
|-------|---------|
| `ECONNREFUSED :5432` | PostgreSQL is not running. Start the service |
| `relation does not exist` | Database not synced. Restart the backend (TypeORM auto-syncs in dev) |
| `401 Unauthorized` | JWT token expired or missing. Re-login |
| `CORS error in browser` | Check `CORS_ORIGIN` in backend `.env` matches frontend URL |
| `Network request failed (mobile)` | Use machine IP instead of `localhost` for mobile API URL |
| `Expo build fails` | Run `npx expo doctor` to check for issues |

---

## 7. Development Tools (Recommended)

| Tool | Purpose |
|------|---------|
| **VS Code** | Code editor (with ESLint + Prettier + TypeScript plugins) |
| **Postman** or **Insomnia** | API testing |
| **pgAdmin** or **DBeaver** | Database GUI |
| **React Developer Tools** | Browser extension for debugging React |
| **Expo Go** | Mobile app for testing React Native |

### Recommended VS Code Extensions
- **ESLint** — Linting for TypeScript
- **Prettier** — Code formatting
- **TypeScript Importer** — Auto-import TypeScript modules
- **REST Client** — Test API endpoints directly from `.http` files
