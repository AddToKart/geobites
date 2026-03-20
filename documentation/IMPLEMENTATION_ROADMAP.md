# Geobites — Implementation Roadmap

## Overview

This roadmap breaks the Geobites project into **6 phases**, ordered by dependency. Each phase includes estimated effort and acceptance criteria.

---

## Phase 1: Project Setup & Backend Foundation
**Estimated Effort: 3–5 days**

### Tasks
1. **Initialize NestJS project** in `backend/`
   - Install dependencies: TypeORM, pg, Passport, JWT, bcrypt, class-validator
   - Configure environment variables (`.env`)
   - Set up PostgreSQL connection

2. **Create database entities**
   - User, Vendor, MenuItem, Order, OrderItem, Rating, Notification
   - Configure relationships and indexes
   - Verify auto-sync creates tables correctly

3. **Auth module**
   - Registration with bcrypt password hashing
   - Login with JWT token generation
   - JWT strategy for Passport
   - Role guard decorator (`@Roles('seller')`)
   - GET /auth/profile endpoint

### Acceptance Criteria
- [ ] `npm run start:dev` starts the NestJS server
- [ ] PostgreSQL tables are created automatically
- [ ] Can register, login, and access protected endpoints via curl/Postman

---

## Phase 2: Backend API Modules
**Estimated Effort: 5–7 days**

### Tasks
1. **Vendors module** — CRUD for sellers, list with pagination/search for customers
2. **Menu module** — CRUD for menu items, linked to vendor
3. **Orders module** — Create order with items, status transitions, role-filtered listing
4. **Ratings module** — Submit rating for delivered orders, compute vendor average
5. **Riders module** — List available deliveries, accept delivery, update status
6. **Notifications module** — CRUD notifications, triggered on order status changes

### Acceptance Criteria
- [ ] Full order lifecycle testable via API: create vendor → add menu → place order → accept → prepare → pickup → deliver → rate
- [ ] Role-based access enforced on all endpoints
- [ ] Proper error responses with validation messages

---

## Phase 3: Web Frontend — Core
**Estimated Effort: 5–7 days**

### Tasks
1. **Initialize React + Vite** project in `frontend/`
2. **Auth pages** — Login and Register with role selection
3. **API service layer** — Axios instance with JWT interceptor
4. **Auth & Cart contexts** — Global state management
5. **Customer pages** — Browse vendors, view menu, cart & checkout
6. **Route protection** — Role-based route guards

### Acceptance Criteria
- [ ] Users can register, login, and be routed to their role-specific dashboard
- [ ] Customers can browse vendors, add items to cart, and place orders
- [ ] Cart persists across page navigation

---

## Phase 4: Web Frontend — Seller & Rider Dashboards
**Estimated Effort: 4–5 days**

### Tasks
1. **Seller dashboard** — Order stats, recent orders
2. **Menu management** — Add/edit/delete menu items, toggle availability
3. **Order management** — Accept/reject orders, update status through preparation
4. **Rider dashboard** — View available deliveries, accept
5. **Active delivery page** — Status progression buttons
6. **Order history & ratings** — Customer order history with rating forms

### Acceptance Criteria
- [ ] Full order flow works from customer order → seller accept/prepare → rider pickup/deliver → customer rate
- [ ] Menu changes by seller reflect immediately for customers
- [ ] Responsive design works on tablet and desktop

---

## Phase 5: Mobile App (React Native)
**Estimated Effort: 5–7 days**

### Tasks
1. **Initialize Expo project** in `native/`
2. **Auth screens** — Login, Register
3. **Navigation setup** — Role-based navigators (customer tabs, rider tabs)
4. **Customer screens** — Browse, vendor detail/menu, cart, orders
5. **Rider screens** — Delivery list, delivery detail with status updates
6. **Profile & notifications** — Shared screens

### Acceptance Criteria
- [ ] App builds and runs on iOS simulator and Android emulator
- [ ] Customer can browse, order, and view order history
- [ ] Rider can view and accept deliveries, update status
- [ ] Same API works for both web and mobile

---

## Phase 6: Polish & Production Readiness
**Estimated Effort: 3–5 days**

### Tasks
1. **UI polish** — Animations, loading skeletons, empty states, error handling
2. **Testing** — Unit tests for backend services, integration tests for API
3. **Environment configuration** — Production `.env`, CORS settings
4. **Docker setup** — Dockerfile for backend, docker-compose for full stack
5. **Documentation updates** — Final review of all docs

### Acceptance Criteria
- [ ] All core user flows work end-to-end without errors
- [ ] Backend passes unit test suite
- [ ] `docker-compose up` starts the full stack

---

## Future Enhancements (Post-MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Real-time tracking** | WebSocket connection for live order status and rider location | High |
| **Push notifications** | Expo Push / Firebase for mobile alerts | High |
| **Payment integration** | GCash, PayMaya, or card payment processing | High |
| **Image uploads** | Vendor logos and menu item photos via S3/Cloudinary | Medium |
| **Map integration** | Interactive maps for delivery tracking (Leaflet web, RN Maps mobile) | Medium |
| **Seller analytics** | Revenue charts, popular items, peak hours | Medium |
| **Search & filters** | Category filtering, cuisine type, price range | Medium |
| **Promo codes** | Discount system for customers | Low |
| **Admin panel** | Platform admin for managing users, vendors, disputes | Low |
| **Multi-language** | i18n support for Filipino, English | Low |

---

## Dependency Graph

```
Phase 1 (Backend Foundation)
    │
    ▼
Phase 2 (Backend API Modules)
    │
    ├──────────────┐
    ▼              ▼
Phase 3         Phase 5
(Web Core)      (Mobile App)
    │
    ▼
Phase 4
(Web Dashboards)
    │
    └──────────────┐
                   ▼
              Phase 6 (Polish)
```

> **Note**: Phase 3 (Web) and Phase 5 (Mobile) can be developed in parallel since they share the same backend API.
