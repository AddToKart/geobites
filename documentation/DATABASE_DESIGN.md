# Geobites — Database Design

## Overview

PostgreSQL relational database with TypeORM entities. The schema has two categories of tables:

1. **Better Auth managed tables** — Created and maintained automatically by Better Auth (`user`, `session`, `account`, `verification`). Do not modify these manually.
2. **Application tables** — Custom TypeORM entities for the Geobites business logic (Vendor, MenuItem, Order, OrderItem, Rating, Notification).

---

## Better Auth Tables (Auto-Managed)

These tables are created automatically by the Better Auth TypeORM adapter. You never write migrations for them.

| Table | Purpose |
|-------|---------|
| `user` | Core user record (id, email, name, emailVerified, image, createdAt, updatedAt) + custom fields: `role`, `phone` |
| `session` | Active sessions (id, userId, token, expiresAt, ipAddress, userAgent) |
| `account` | Auth providers (id, userId, accountId, password hash, providerId) |
| `verification` | Email verification tokens |

> The `user` table from Better Auth replaces the custom `User` entity. Application tables reference `user.id` as their foreign key for `customerId`, `riderId`, and `sellerId`.


## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    User      │       │     Vendor       │       │   MenuItem   │
│──────────────│       │──────────────────│       │──────────────│
│ id (PK)      │◄──┐   │ id (PK)          │◄──┐   │ id (PK)      │
│ email        │   │   │ name             │   │   │ name         │
│ password     │   │   │ description      │   │   │ description  │
│ name         │   └───│ userId (FK)      │   │   │ price        │
│ role (enum)  │       │ address          │   └───│ vendorId(FK) │
│ phone        │       │ latitude         │       │ category     │
│ address      │       │ longitude        │       │ isAvailable  │
│ latitude     │       │ rating           │       │ imageUrl     │
│ longitude    │       │ isActive         │       │ createdAt    │
│ createdAt    │       │ createdAt        │       │ updatedAt    │
│ updatedAt    │       │ updatedAt        │       └──────────────┘
└──────┬───────┘       └──────────────────┘
       │
       │  ┌──────────────────┐       ┌──────────────┐
       │  │     Order        │       │  OrderItem   │
       │  │──────────────────│       │──────────────│
       │  │ id (PK)          │◄──┐   │ id (PK)      │
       ├──│ customerId (FK)  │   │   │ orderId (FK) │───┐
       ├──│ riderId (FK)     │   │   │ menuItemId   │   │
       │  │ vendorId (FK)    │   └───│ quantity     │   │
       │  │ status (enum)    │       │ price        │   │
       │  │ totalAmount      │       └──────────────┘   │
       │  │ deliveryAddress  │                           │
       │  │ deliveryLat      │       ┌──────────────┐   │
       │  │ deliveryLng      │       │   Rating     │   │
       │  │ notes            │       │──────────────│   │
       │  │ createdAt        │       │ id (PK)      │   │
       │  │ updatedAt        │       │ orderId (FK) │───┘
       │  └──────────────────┘       │ customerId   │
       │                             │ vendorId     │
       │  ┌──────────────────┐       │ score (1-5)  │
       │  │  Notification    │       │ feedback     │
       │  │──────────────────│       │ createdAt    │
       │  │ id (PK)          │       └──────────────┘
       └──│ userId (FK)      │
          │ title            │
          │ message          │
          │ type (enum)      │
          │ isRead           │
          │ referenceId      │
          │ createdAt        │
          └──────────────────┘
```

---

## Entity Definitions

### 1. User

The central entity. A single `role` field determines the user's access type.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, auto-generated | Unique identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| `password` | VARCHAR(255) | NOT NULL | Bcrypt-hashed password |
| `name` | VARCHAR(255) | NOT NULL | Display name |
| `role` | ENUM | NOT NULL | `customer`, `seller`, `rider` |
| `phone` | VARCHAR(20) | NULLABLE | Contact number |
| `address` | TEXT | NULLABLE | Default address |
| `latitude` | DECIMAL(10,8) | NULLABLE | User location lat |
| `longitude` | DECIMAL(11,8) | NULLABLE | User location lng |
| `isActive` | BOOLEAN | DEFAULT true | Account status |
| `createdAt` | TIMESTAMP | auto | Account creation time |
| `updatedAt` | TIMESTAMP | auto | Last update time |

**Indexes**: `email` (unique), `role`

---

### 2. Vendor

A seller's food business profile. One seller can own one vendor.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `userId` | UUID | FK → User, UNIQUE | Owner (seller) |
| `name` | VARCHAR(255) | NOT NULL | Business name |
| `description` | TEXT | NULLABLE | Business description |
| `address` | TEXT | NOT NULL | Physical address |
| `latitude` | DECIMAL(10,8) | NOT NULL | Location lat |
| `longitude` | DECIMAL(11,8) | NOT NULL | Location lng |
| `rating` | DECIMAL(3,2) | DEFAULT 0.00 | Average rating (computed) |
| `totalRatings` | INTEGER | DEFAULT 0 | Rating count |
| `imageUrl` | VARCHAR(500) | NULLABLE | Vendor image |
| `isActive` | BOOLEAN | DEFAULT true | Open/closed |
| `createdAt` | TIMESTAMP | auto | Creation time |
| `updatedAt` | TIMESTAMP | auto | Last update |

**Indexes**: `userId` (unique), `latitude/longitude` (for geo queries), `rating` (for ranking)

---

### 3. MenuItem

Food items belonging to a vendor's menu.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `vendorId` | UUID | FK → Vendor | Parent vendor |
| `name` | VARCHAR(255) | NOT NULL | Item name |
| `description` | TEXT | NULLABLE | Item description |
| `price` | DECIMAL(10,2) | NOT NULL | Price in local currency |
| `category` | VARCHAR(100) | NULLABLE | Category (e.g., "Main", "Drinks") |
| `imageUrl` | VARCHAR(500) | NULLABLE | Item image |
| `isAvailable` | BOOLEAN | DEFAULT true | Currently orderable |
| `createdAt` | TIMESTAMP | auto | Creation time |
| `updatedAt` | TIMESTAMP | auto | Last update |

**Indexes**: `vendorId`, `category`, `isAvailable`

---

### 4. Order

Represents a customer order placed with a vendor.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `customerId` | UUID | FK → User | Customer who placed the order |
| `vendorId` | UUID | FK → Vendor | Vendor receiving the order |
| `riderId` | UUID | FK → User, NULLABLE | Assigned delivery rider |
| `status` | ENUM | NOT NULL, DEFAULT 'pending' | Order lifecycle status |
| `totalAmount` | DECIMAL(10,2) | NOT NULL | Total order cost |
| `deliveryAddress` | TEXT | NOT NULL | Delivery location text |
| `deliveryLat` | DECIMAL(10,8) | NULLABLE | Delivery lat |
| `deliveryLng` | DECIMAL(11,8) | NULLABLE | Delivery lng |
| `notes` | TEXT | NULLABLE | Customer notes |
| `createdAt` | TIMESTAMP | auto | Order time |
| `updatedAt` | TIMESTAMP | auto | Last status change |

**Status Enum Values**:
```
pending → accepted → preparing → ready_for_pickup → picked_up → delivering → delivered
                  → rejected
                  → cancelled
```

**Indexes**: `customerId`, `vendorId`, `riderId`, `status`, `createdAt`

---

### 5. OrderItem

Individual items within an order (join between Order and MenuItem).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `orderId` | UUID | FK → Order | Parent order |
| `menuItemId` | UUID | FK → MenuItem | Referenced menu item |
| `name` | VARCHAR(255) | NOT NULL | Snapshot of item name at order time |
| `quantity` | INTEGER | NOT NULL, MIN 1 | Number of items |
| `price` | DECIMAL(10,2) | NOT NULL | Snapshot of price at order time |

**Indexes**: `orderId`

---

### 6. Rating

Customer feedback on completed orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `orderId` | UUID | FK → Order, UNIQUE | One rating per order |
| `customerId` | UUID | FK → User | Rating author |
| `vendorId` | UUID | FK → Vendor | Rated vendor |
| `score` | INTEGER | NOT NULL, 1–5 | Star rating |
| `feedback` | TEXT | NULLABLE | Written review |
| `createdAt` | TIMESTAMP | auto | Rating time |

**Indexes**: `vendorId`, `customerId`, `orderId` (unique)

---

### 7. Notification

System notifications for all user types.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `userId` | UUID | FK → User | Notification recipient |
| `title` | VARCHAR(255) | NOT NULL | Short title |
| `message` | TEXT | NOT NULL | Notification body |
| `type` | ENUM | NOT NULL | `order_update`, `delivery_request`, `rating`, `system` |
| `referenceId` | UUID | NULLABLE | Related order/entity ID |
| `isRead` | BOOLEAN | DEFAULT false | Read status |
| `createdAt` | TIMESTAMP | auto | Created time |

**Indexes**: `userId`, `isRead`, `createdAt`

---

## Relationships Summary

| Relationship | Type | Description |
|-------------|------|-------------|
| User → Vendor | One-to-One | A seller owns one vendor |
| Vendor → MenuItem | One-to-Many | A vendor has many menu items |
| User → Order (customer) | One-to-Many | A customer places many orders |
| Vendor → Order | One-to-Many | A vendor receives many orders |
| User → Order (rider) | One-to-Many | A rider handles many deliveries |
| Order → OrderItem | One-to-Many | An order contains many items |
| Order → Rating | One-to-One | Each order can have one rating |
| User → Notification | One-to-Many | A user receives many notifications |

---

## Migration Strategy

TypeORM will be configured with `synchronize: true` in development to auto-sync schema. For production:

1. Generate migrations: `npx typeorm migration:generate -n MigrationName`
2. Run migrations: `npx typeorm migration:run`
3. Revert if needed: `npx typeorm migration:revert`
