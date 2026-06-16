# Geobites Monorepo

Three packages under one root: `backend/` (NestJS 11), `frontend/` (React 19 + Vite 8), `native/` (Expo 54).

## Quick start

```powershell
Copy-Item backend/.env.example backend/.env     # already committed; skip if exists
Copy-Item frontend/.env.example frontend/.env
# Set USE_MEMORY_DB=true in backend/.env to skip PostgreSQL
npm install && npm run dev:full
```

Backend at `http://localhost:3000/api`, frontend at `http://localhost:5173`.

## Key commands

| Context | Command | What it does |
|---|---|---|
| root | `npm run dev:full` | starts both backend (`start:dev`) + frontend (`dev`) via `concurrently` |
| `backend/` | `npm run start:dev` | Nest watch mode |
| `backend/` | `npm run test` | Jest unit tests (`*.spec.ts`) |
| `backend/` | `npm run test:e2e` | Jest e2e tests (`*.e2e-spec.ts` in `test/`) |
| `backend/` | `npm run lint` | ESLint + Prettier fix |
| `backend/` | `npm run format` | Prettier only |
| `frontend/` | `npm run dev` | Vite dev server |
| `frontend/` | `npm run build` | `tsc -b` (typecheck) then `vite build` |
| `frontend/` | `npm run lint` | ESLint |

## Architecture

### Backend (`backend/`)
- **NestJS 11** with TypeORM, Better Auth, PostgreSQL or SQLite
- `src/main.ts` boot sequence: create DB → dynamically import modules → start Nest → seed demo data
- Better Auth runs on its own handler at `POST /api/auth/*` (not a Nest controller)
- CORS allows `localhost:5173`, `localhost:8081`, `localhost:19006`
- Vite proxy forwards `/api/*` to `http://127.0.0.1:3000`
- Backend `.env.example` is tracked; copy it to `.env` and set `USE_MEMORY_DB=true` to skip PostgreSQL

### Frontend (`frontend/`)
- React 19 with Vite 8, Tailwind CSS v4, shadcn/ui (Radix Nova style)
- Path alias `@/` → `./src/*`
- Components: `@/components/ui/*` (shadcn/ui), `@/lib/utils` (cn helper)
- No test framework installed

### Native (`native/`)
- Expo 54, React Native 0.81
- `EXPO_PUBLIC_API_URL` env var points to backend (use machine LAN IP for device testing)

## Design System

All tokens live in `src/styles/globals.css` under `@theme inline` and `:root` / `.dark`. Never hardcode hex values.

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-primary` | `#ff5a00` | `#ff6600` | CTAs, active nav, accent fills |
| `--color-background` | `#f3f4f6` | `#000000` | Page bg |
| `--color-card` | `rgba(255,255,255,0.7)` | `rgba(20,20,20,0.7)` | Card/sheet backgrounds |
| `--color-surface` | `rgba(255,255,255,0.6)` | `rgba(30,30,30,0.6)` | Secondary surfaces |
| `--radius` | `1.75rem` (28px) | same | Base radius (cards, buttons) |
| `--color-text` | `#09090b` | `#fafafa` | Body text |

### Component patterns
- **Cards**: `rounded-[24px] bg-card backdrop-blur-xl border border-white/50 dark:border-white/10` with `shadow-card`. Use shadcn/ui `Card` component from `@/components/ui/card`.
- **Buttons**: Use shadcn/ui `Button` from `@/components/ui/button`. Rounded-2xl by default. Variants: `default` (primary), `secondary`, `ghost`, `destructive`, `outline`, `link`.
- **Badges**: Use `Badge` from `@/components/ui/badge`. Variants: `default`, `success`, `warning`, `danger` (maps to semantic color tokens).
- **Inputs**: Rounded-2xl, focus ring uses `ring-primary/20`.
- **Icons**: lucide-react throughout.
- **Typography**: "Plus Jakarta Sans" for display + body. Headings: `font-bold tracking-tighter`, 800 weight. Eyebrow labels: `text-xs font-bold uppercase tracking-widest`.
- **Glass aesthetic**: `bg-card backdrop-blur-xl border border-white/50` pattern is ubiquitous.
- **Maps**: MapLibre GL via `@/components/maps/` (lazy-loaded).
- **Layout utilities**: `.page-stack` (spaced sections), `.bento-grid` / `.bento-card`, `.panel-card`, `.eyebrow`, `.subtle-copy`, `.glass` in `globals.css`.
- **Animations**: framer-motion with `LazyMotion` + `domAnimation` (tree-shaken), page transitions use compositor-only properties (`opacity`, `y`).
- **Theme**: `next-themes` with `attribute="class"`, storage key `"geobites-theme"`. Dark mode via `.dark` class.

### Styling approach
- Use Tailwind utility classes with CSS variable references: `text-[color:var(--color-text-soft)]` or shorthand tokens like `bg-card`, `text-text-soft`, `border-border`.
- Import `cn` from `@/lib/utils` for class merging.
- `src/index.css` is intentionally empty — all imports go through `src/styles/globals.css`.

## Conventions
- Backend: Prettier singleQuote + trailingComma:all. Lint runs eslint-plugin-prettier.
- ESLint rules relaxed on `no-explicit-any`, `no-unsafe-*`, `require-await` in backend
- Frontend: `react-refresh/only-export-components` is **off**
- TypeScript 6.x across the board
- `backend/.gitignore` is *not* committed (root `.gitignore` covers `node_modules/`, `.env`, `dist/` for all subdirs)
