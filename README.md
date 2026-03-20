# Geobites Monorepo

Scaffolded full-stack project based on the documentation requirements:

- `backend/` - NestJS API + Better Auth + TypeORM + PostgreSQL-ready configuration
- `frontend/` - React + Vite + TypeScript web app with role-based routing and app scaffolding
- `native/` - Expo + React Native + TypeScript mobile app with role-aware navigation scaffolding
- `documentation/` - source planning and architecture documents

## Quick Start

### 1) Backend

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

Backend runs on `http://localhost:3000` with API prefix `/api`.

### 2) Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

### 3) Native

```bash
cd native
npm install
npx expo start
```

## Notes

- Better Auth is mounted at `/api/auth`.
- TypeORM is configured for PostgreSQL by default using `.env` values.
- To run backend without PostgreSQL while scaffolding, set `USE_MEMORY_DB=true` in `backend/.env`.
