# Geobites — Tech Stack & Architecture

## Overview

Geobites is a food delivery platform connecting **Customers**, **Sellers** (food vendors), and **Riders** (delivery personnel). The system is built as a modern full-stack application with separate web, mobile, and API layers.

---

## Tech Stack Summary

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Web Frontend** | ReactJS (Vite) | React 18+ | Customer, Seller, and Rider web dashboards |
| **Mobile App** | React Native (Expo) | SDK 50+ | Cross-platform mobile app (iOS & Android) |
| **Backend API** | NestJS | v10+ | RESTful API server |
| **Database** | PostgreSQL | v15+ | Primary relational data store |
| **ORM** | TypeORM | v0.3+ | Database schema management & queries |
| **Authentication** | **Better Auth** | Latest | Framework-agnostic auth library (TypeScript-first) |
| **UI Styling (Web)** | **Tailwind CSS v4** | v4+ | Utility-first CSS framework |
| **UI Components (Web)** | **shadcn/ui** | Latest | Accessible component library (Radix UI primitives) |
| **Language** | **TypeScript 5+** | v5+ | Used across **all layers** — backend, frontend, and mobile |

> **TypeScript is mandatory across the entire project.** There are no `.js` or `.jsx` files — every source file uses `.ts` or `.tsx`.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTS                          │
│  ┌──────────────┐  ┌──────────────┐                │
│  │  ReactJS Web │  │ React Native │                │
│  │   (Vite)     │  │   (Expo)     │                │
│  │  Port: 5173  │  │  iOS/Android │                │
│  └──────┬───────┘  └──────┬───────┘                │
│         │                 │                         │
│         └────────┬────────┘                         │
│                  │ HTTP / REST                      │
│                  ▼                                  │
│  ┌──────────────────────────────┐                   │
│  │        NestJS API            │                   │
│  │       Port: 3000             │                   │
│  │                              │                   │
│  │  ┌────────┐  ┌────────────┐  │                   │
│  │  │  Auth  │  │  Vendors   │  │                   │
│  │  │ Module │  │  Module    │  │                   │
│  │  ├────────┤  ├────────────┤  │                   │
│  │  │ Orders │  │   Menu     │  │                   │
│  │  │ Module │  │  Module    │  │                   │
│  │  ├────────┤  ├────────────┤  │                   │
│  │  │ Riders │  │  Ratings   │  │                   │
│  │  │ Module │  │  Module    │  │                   │
│  │  ├────────┤  ├────────────┤  │                   │
│  │  │ Notif. │  │            │  │                   │
│  │  │ Module │  │            │  │                   │
│  │  └────────┘  └────────────┘  │                   │
│  └──────────────┬───────────────┘                   │
│                 │ TypeORM                           │
│                 ▼                                   │
│  ┌──────────────────────────────┐                   │
│  │       PostgreSQL             │                   │
│  │       Port: 5432             │                   │
│  │       Database: geobites     │                   │
│  └──────────────────────────────┘                   │
└─────────────────────────────────────────────────────┘
```

---

## Project Structure

```
geobites/
├── backend/                    # NestJS API server
│   ├── src/
│   │   ├── auth/               # Authentication module
│   │   ├── vendors/            # Vendor management
│   │   ├── menu/               # Menu item management
│   │   ├── orders/             # Order processing
│   │   ├── riders/             # Rider/delivery management
│   │   ├── ratings/            # Ratings & feedback
│   │   ├── notifications/      # Notification records
│   │   ├── entities/           # TypeORM database entities
│   │   ├── common/             # Shared guards, decorators, DTOs
│   │   └── app.module.ts       # Root module
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # ReactJS web application (TypeScript)
│   ├── src/
│   │   ├── components/         # Reusable UI components (.tsx)
│   │   ├── pages/              # Route-level page components (.tsx)
│   │   │   ├── auth/           # Login, Register
│   │   │   ├── customer/       # Browse, Menu, Cart, Orders
│   │   │   ├── seller/         # Dashboard, Menu Mgmt, Orders
│   │   │   └── rider/          # Delivery dashboard
│   │   ├── context/            # React Context (Auth, Cart) (.tsx)
│   │   ├── services/           # API service layer (Axios) (.ts)
│   │   ├── hooks/              # Custom React hooks (.ts)
│   │   ├── types/              # Shared TypeScript interfaces (.ts)
│   │   └── App.tsx             # Root component with routing
│   ├── public/
│   ├── index.html
│   ├── tsconfig.json
│   └── package.json
│
├── native/                     # React Native mobile app (TypeScript)
│   ├── src/
│   │   ├── screens/            # Screen components (.tsx)
│   │   ├── navigation/         # React Navigation setup (.tsx)
│   │   ├── services/           # API service layer (.ts)
│   │   ├── context/            # Auth & Cart context (.tsx)
│   │   ├── types/              # Shared TypeScript interfaces (.ts)
│   │   └── components/         # Shared mobile components (.tsx)
│   ├── app.json
│   ├── tsconfig.json
│   └── package.json
│
└── documentation/              # Project documentation
    ├── Functional Requirements.docx
    ├── Geobites.pdf
    ├── TECH_STACK.md
    ├── DATABASE_DESIGN.md
    ├── API_SPECIFICATION.md
    ├── FRONTEND_ARCHITECTURE.md
    ├── MOBILE_ARCHITECTURE.md
    ├── IMPLEMENTATION_ROADMAP.md
    └── PROJECT_SETUP.md
```

---

## Key Design Decisions

### Why ReactJS + Vite (over Next.js)?
- Geobites is a **single-page application** (SPA) — no SSR or SEO needs for the dashboard
- Vite provides extremely fast HMR and build times
- Simpler deployment model (static files + API)

### Why Tailwind CSS v4?
- **v4 is CSS-first** — theme configuration lives in `index.css` using `@theme {}`, no JS config file needed
- Utility-first approach lets us style components inline without switching files
- First-class support for dark mode, responsive design, and arbitrary values
- Ships significantly faster build times and a smaller default bundle than v3

### Why shadcn/ui?
- **Not a typical component library** — shadcn/ui copies component source code directly into your project (`components/ui/`), giving full ownership and customizability
- Built on **Radix UI** primitives for accessibility (ARIA, keyboard navigation) out of the box
- Components are already styled with Tailwind classes — perfectly compatible with Tailwind v4
- No runtime CSS-in-JS, no external dependency to update — components are yours to modify

### Why Better Auth (over Passport + JWT)?
- **TypeScript-first** — designed from the ground up for TypeScript with full type inference
- **Framework-agnostic** — works with NestJS, Express, Hono, and more via an adapter pattern
- **Batteries included** — built-in session management, email/password auth, and role-based access control out of the box
- **Secure sessions** — uses server-managed sessions (stored in the database) rather than stateless JWTs, making token revocation trivial
- **Client libraries** — `@better-auth/react` for the web, and a universal client for React Native
- **Free & open-source** — no usage limits, no vendor lock-in, self-hosted
- **OAuth ready** — Google, GitHub, and other providers can be added later with minimal config

### Why React Native with Expo?
- Expo simplifies cross-platform development (iOS + Android from one codebase)
- Built-in support for location services, push notifications, and maps
- Managed workflow reduces native toolchain complexity

### Why NestJS (over Express)?
- Built-in module system provides clean separation of concerns
- First-class TypeScript support with decorators
- Built-in validation, guards, and interceptor patterns
- Integrates seamlessly with TypeORM and Passport

### Why PostgreSQL + TypeORM?
- PostgreSQL handles complex relational queries (joins for orders, vendor rankings)
- PostGIS extension available for future geospatial queries (nearby vendors)
- TypeORM provides migration support and entity-based schema management

### Why JWT Authentication?
- Stateless — no server session storage needed
- Works identically across web and mobile clients
- Role-based access control via token payload
