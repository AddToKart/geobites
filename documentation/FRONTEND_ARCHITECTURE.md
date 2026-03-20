# Geobites — Frontend Architecture (ReactJS Web)

## Overview

The web frontend is a **single-page application** built with ReactJS and Vite, written entirely in **TypeScript**. It serves all three user roles (Customer, Seller, Rider) through role-based routing and dashboards.

---

## Tech Stack

| Library | Purpose |
|---------|---------|
| ReactJS 18+ | UI framework |
| TypeScript 5+ | Static typing across all components |
| Vite | Build tool & dev server |
| React Router v6 | Client-side routing |
| Axios | HTTP client for API calls |
| React Context API | Global state (auth, cart) |
| Tailwind CSS v4 | Utility-first CSS framework |
| shadcn/ui | Accessible, unstyled component library built on Radix UI |

---

## Folder Structure

```
frontend/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/              # Static assets (images, icons)
│   ├── components/
│   │   ├── ui/              # shadcn/ui generated components (Button, Card, Input, Badge, etc.)
│   │   ├── layout/          # Header, Sidebar, Footer, PageLayout
│   │   └── custom/          # App-specific composite components (VendorCard, OrderCard, etc.)
│   ├── context/
│   │   ├── AuthContext.tsx  # Auth state, login/logout, token management
│   │   └── CartContext.tsx  # Shopping cart state
│   ├── hooks/
│   │   ├── useAuth.ts       # Auth context consumer hook
│   │   ├── useCart.ts       # Cart context consumer hook
│   │   └── useApi.ts        # API call wrapper with loading/error states
│   ├── lib/
│   │   └── utils.ts         # shadcn/ui utility (cn helper for class merging)
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── customer/
│   │   │   ├── BrowseVendorsPage.tsx    # Vendor grid with search/filter
│   │   │   ├── VendorMenuPage.tsx       # Vendor detail + menu items
│   │   │   ├── CartPage.tsx             # Cart review & checkout
│   │   │   ├── OrderTrackingPage.tsx    # Live order status
│   │   │   └── OrderHistoryPage.tsx     # Past orders + ratings
│   │   ├── seller/
│   │   │   ├── SellerDashboard.tsx      # Overview stats
│   │   │   ├── MenuManagementPage.tsx   # CRUD menu items
│   │   │   └── OrderManagementPage.tsx  # Accept/reject, status updates
│   │   └── rider/
│   │       ├── RiderDashboard.tsx       # Available & active deliveries
│   │       └── ActiveDeliveryPage.tsx   # Current delivery details
│   ├── services/
│   │   ├── api.ts                # Axios instance with interceptors
│   │   ├── authService.ts        # Auth API calls
│   │   ├── vendorService.ts      # Vendor API calls
│   │   ├── menuService.ts        # Menu API calls
│   │   ├── orderService.ts       # Order API calls
│   │   ├── ratingService.ts      # Rating API calls
│   │   ├── riderService.ts       # Rider API calls
│   │   └── notificationService.ts
│   ├── types/
│   │   └── index.ts              # Shared TypeScript interfaces & enums
│   ├── utils/
│   │   ├── constants.ts          # API URL, status labels, etc.
│   │   └── helpers.ts            # Formatting, validation helpers
│   ├── App.tsx               # Root component with Router
│   └── main.tsx              # Entry point
├── index.html
├── tailwind.config.ts        # Tailwind v4 configuration
├── vite.config.ts
├── tsconfig.json
├── components.json           # shadcn/ui configuration
└── package.json
```

---

## TypeScript Types (`types/index.ts`)

```typescript
export type UserRole = 'customer' | 'seller' | 'rider';

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'delivering'
  | 'delivered'
  | 'rejected'
  | 'cancelled';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
}

export interface Vendor {
  id: string;
  name: string;
  description?: string;
  address: string;
  rating: number;
  totalRatings: number;
  imageUrl?: string;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryAddress: string;
  notes?: string;
  customer?: Pick<User, 'id' | 'name'>;
  vendor?: Pick<Vendor, 'id' | 'name'>;
  rider?: Pick<User, 'id' | 'name'>;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Rating {
  id: string;
  score: number;
  feedback?: string;
  customerName: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order_update' | 'delivery_request' | 'rating' | 'system';
  isRead: boolean;
  referenceId?: string;
  createdAt: string;
}
```

---

## Routing Structure

```
/                       → Redirect based on role or to login
/login                  → LoginPage
/register               → RegisterPage

# Customer Routes (role: customer)
/browse                 → BrowseVendorsPage
/vendor/:id             → VendorMenuPage
/cart                   → CartPage
/orders                 → OrderHistoryPage
/orders/:id             → OrderTrackingPage

# Seller Routes (role: seller)
/seller                 → SellerDashboard
/seller/menu            → MenuManagementPage
/seller/orders          → OrderManagementPage

# Rider Routes (role: rider)
/rider                  → RiderDashboard
/rider/delivery/:id     → ActiveDeliveryPage
```

### Route Protection

```typescript
// ProtectedRoute component wraps role-specific routes
<Route element={<ProtectedRoute allowedRoles={['customer']} />}>
  <Route path="/browse" element={<BrowseVendorsPage />} />
  ...
</Route>
```

---

## State Management

### AuthContext

With Better Auth, authentication state is managed via the **`@better-auth/react`** client. No manual token storage or JWT parsing — Better Auth handles session cookies automatically.

```typescript
// lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

// Exports: authClient.useSession(), authClient.signIn, authClient.signOut, etc.
```

Usage in components:

```typescript
import { authClient } from '@/lib/auth-client';

// Get the current session (reactive)
const { data: session, isPending } = authClient.useSession();

// Sign in
await authClient.signIn.email({ email, password });

// Sign up
await authClient.signUp.email({ email, password, name, role });

// Sign out
await authClient.signOut();
```

A thin `AuthContext` wraps this for role-based redirect logic:

```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpDto) => Promise<void>;
  signOut: () => Promise<void>;
}
```

### CartContext

Manages the shopping cart for customers.

```typescript
interface CartContextType {
  items: CartItem[];
  vendorId: string | null;
  total: number;
  addItem: (menuItem: MenuItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
}

// Rules:
// - Cart is vendor-specific (switching vendor clears cart with confirmation)
// - Persisted in localStorage
```

---

## API Service Layer

All non-auth API calls (vendors, orders, menu, etc.) are centralized in `services/` using Axios. Since Better Auth manages the session cookie automatically, Axios just needs to send cookies with each request:

```typescript
// services/api.ts
import axios, { AxiosInstance } from 'axios';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  withCredentials: true,  // ← send session cookie automatically
});

// Response interceptor: handle 401 → redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
```

> No manual `Authorization` header or token management needed — the session cookie is attached by the browser automatically on every request.

---

## UI Design System

### Styling Approach

Geobites uses **Tailwind CSS v4** for utility-first styling with **shadcn/ui** for accessible, pre-built component primitives. This combination gives us:
- Full design control via Tailwind utilities
- Accessible, unstyled primitives from Radix UI (via shadcn)
- Consistent component APIs with the `cn()` helper for conditional classes

### shadcn/ui Components Used

| Component | Used For |
|-----------|----------|
| `Button` | All CTA and action buttons |
| `Card`, `CardHeader`, `CardContent` | Vendor cards, order cards, stat panels |
| `Input`, `Label` | All form fields |
| `Badge` | Order status labels, rating stars |
| `Dialog` | Add/edit menu item modals, confirmation dialogs |
| `Tabs` | Order management (Pending/Active/Completed) |
| `Table` | Menu item list in Seller dashboard |
| `Avatar` | User/rider profile pictures |
| `Separator` | Section dividers |
| `Skeleton` | Loading placeholders |
| `Toast` | Success/error notifications |
| `Select` | Dropdown for sorting vendors, status updates |

### Tailwind v4 Theme (`tailwind.config.ts`)

Tailwind v4 uses CSS-first configuration. Custom brand tokens are defined in `index.css`:

```css
@import "tailwindcss";

@theme {
  --color-primary: #FF6B35;      /* Warm orange — food/appetite color */
  --color-primary-dark: #E85D2C;
  --color-primary-light: #FF8F66;
  --color-secondary: #1A1A2E;    /* Deep navy */
  --color-accent: #16213E;
  --color-success: #00C853;
  --color-warning: #FFB300;
  --color-danger: #FF1744;
  --radius-card: 0.75rem;
}
```

### `cn()` Utility

All components use the shadcn `cn()` helper for merging Tailwind classes:

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

### Component Design Principles

1. **shadcn primitives first** — Use shadcn components before writing custom ones
2. **Card-based layouts** — Vendor, menu, and order data uses `<Card>` with Tailwind spacing
3. **Status badges** — `<Badge>` component with `variant` prop + Tailwind color overrides
4. **Responsive grid** — `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` patterns
5. **Smooth transitions** — `transition-all duration-200` on interactive elements
6. **Mobile-first** — All layouts start mobile and use `md:` / `lg:` breakpoints

---

## Page Descriptions

### Customer Pages

| Page | Key Features |
|------|-------------|
| **Browse Vendors** | Search bar, filter by category, vendor cards with rating stars, "hot/nearby" badges |
| **Vendor Menu** | Vendor header with info, menu grouped by category, add-to-cart buttons with quantity controls |
| **Cart** | Item list with quantity adjusters, subtotal calculation, delivery address input, place order button |
| **Order Tracking** | Status timeline (vertical stepper), order details, rider info (when assigned) |
| **Order History** | List of past orders, status badges, "Rate" button for delivered orders, expandable details |

### Seller Pages

| Page | Key Features |
|------|-------------|
| **Dashboard** | Stats cards (today's orders, revenue, rating), recent orders list |
| **Menu Management** | Table/grid of items, add/edit modal, toggle availability, delete confirmation |
| **Order Management** | Tabs (Pending/Active/Completed), accept/reject buttons, status update dropdown |

### Rider Pages

| Page | Key Features |
|------|-------------|
| **Dashboard** | Available deliveries list (with accept button), active deliveries section |
| **Active Delivery** | Order details, pickup/drop locations, status progression buttons |
