# Geobites — Mobile Architecture (React Native)

## Overview

The mobile application is built with **React Native** using **Expo** for cross-platform deployment (iOS and Android), written entirely in **TypeScript**. It shares the same backend API as the web frontend and focuses on the **Customer** and **Rider** experiences, which are the primary mobile use cases.

---

## Tech Stack

| Library | Purpose |
|---------|---------|
| React Native | Cross-platform mobile framework |
| TypeScript 5+ | Static typing across all screens and components |
| Expo SDK 50+ | Managed workflow, build tooling |
| React Navigation v6 | Screen navigation (stack + bottom tabs) |
| Axios | HTTP client |
| AsyncStorage | Local storage (auth tokens, preferences) |
| Expo Location | GPS/location services |
| Expo Notifications | Push notifications (future) |
| React Native Maps | Map display for tracking (future) |

---

## Folder Structure

```
native/
├── assets/                  # App icons, splash screen, images
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Button, Input, Card, Spinner, Badge
│   │   └── ui/              # VendorCard, MenuItemCard, OrderCard
│   ├── context/
│   │   ├── AuthContext.tsx  # Auth state (mirrors web)
│   │   └── CartContext.tsx  # Shopping cart state
│   ├── navigation/
│   │   ├── AppNavigator.tsx      # Root navigator (auth vs main)
│   │   ├── AuthNavigator.tsx     # Login/Register stack
│   │   ├── CustomerNavigator.tsx # Customer tab navigator
│   │   └── RiderNavigator.tsx    # Rider tab navigator
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── customer/
│   │   │   ├── BrowseScreen.tsx         # Vendor list
│   │   │   ├── VendorDetailScreen.tsx   # Menu + add to cart
│   │   │   ├── CartScreen.tsx           # Cart & checkout
│   │   │   ├── OrdersScreen.tsx         # Order history
│   │   │   └── OrderDetailScreen.tsx    # Track specific order
│   │   ├── rider/
│   │   │   ├── DeliveriesScreen.tsx     # Available + active
│   │   │   └── DeliveryDetailScreen.tsx # Active delivery
│   │   └── common/
│   │       ├── ProfileScreen.tsx        # User profile/settings
│   │       └── NotificationsScreen.tsx  # Notifications list
│   ├── services/
│   │   ├── api.ts            # Axios instance with token interceptor
│   │   ├── authService.ts
│   │   ├── vendorService.ts
│   │   ├── orderService.ts
│   │   └── riderService.ts
│   ├── types/
│   │   └── index.ts          # Shared TypeScript interfaces & enums
│   ├── utils/
│   │   ├── constants.ts      # API URL, config
│   │   ├── colors.ts         # Color palette
│   │   └── helpers.ts        # Formatters, validators
│   └── App.tsx               # Root component
├── app.json                  # Expo config
├── babel.config.js
├── tsconfig.json
└── package.json
```

---

## TypeScript Types (`types/index.ts`)

The mobile app shares the same type definitions as the web frontend. These are duplicated or shared via a shared package in a monorepo setup:

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
  vendor?: Pick<Vendor, 'id' | 'name'>;
  rider?: Pick<User, 'id' | 'name'>;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}
```

---

## Navigation Structure

### Auth Flow (unauthenticated)
```
AuthNavigator (Stack)
├── LoginScreen
└── RegisterScreen
```

### Customer Flow (role: customer)
```
CustomerNavigator (Bottom Tabs)
├── Browse (Stack)
│   ├── BrowseScreen
│   ├── VendorDetailScreen
│   └── CartScreen
├── Orders (Stack)
│   ├── OrdersScreen
│   └── OrderDetailScreen
├── Notifications
│   └── NotificationsScreen
└── Profile
    └── ProfileScreen
```

### Rider Flow (role: rider)
```
RiderNavigator (Bottom Tabs)
├── Deliveries (Stack)
│   ├── DeliveriesScreen
│   └── DeliveryDetailScreen
├── Notifications
│   └── NotificationsScreen
└── Profile
    └── ProfileScreen
```

---

## Authentication Flow

Better Auth provides a universal client (`better-auth/client`) that works in React Native. It communicates with the backend via HTTP and uses a custom storage adapter (AsyncStorage) for persisting the session token.

```
App Launch
    │
    ├── authClient.getSession() → calls GET /api/auth/get-session
    │   ├── Valid session → Navigate to role-based main screen
    │   └── No/invalid session → AuthNavigator (Login)
    │
    ├── signUp / signIn → session cookie stored via AsyncStorage adapter
    │   └── Navigate to role-based main screen
    │
    └── signOut → session cleared server-side → AuthNavigator
```

---

## API Service Layer

```typescript
// lib/auth-client.ts  (shared client for Better Auth)
import { createAuthClient } from 'better-auth/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/constants';

export const authClient = createAuthClient({
  baseURL: API_URL.replace('/api', ''),  // Better Auth base (no /api prefix)
  storage: AsyncStorage,                 // persist session in AsyncStorage
});

// Usage:
// const session = await authClient.getSession();
// await authClient.signIn.email({ email, password });
// await authClient.signUp.email({ email, password, name, role });
// await authClient.signOut();
```

```typescript
// services/api.ts  (Axios for non-auth API calls)
import axios, { AxiosInstance } from 'axios';
import { API_URL } from '../utils/constants';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,  // sends session cookie automatically
});

export default api;
```

---

## Screen Descriptions

### Customer Screens

| Screen | Description |
|--------|-------------|
| **BrowseScreen** | Scrollable list of vendor cards with search bar at top. Pull-to-refresh. Each card shows vendor name, rating, and distance. Tap → VendorDetail |
| **VendorDetailScreen** | Vendor header (name, rating, address). Scrollable menu grouped by category. Each item has "+"/"-" buttons. Floating cart summary bar at bottom |
| **CartScreen** | List of cart items with quantity controls. Delivery address input. Total price. "Place Order" button |
| **OrdersScreen** | Tab view: Active / Past. List of order cards with status badge. Tap → OrderDetail |
| **OrderDetailScreen** | Order status stepper (vertical timeline). Item list. Rider info section when assigned. Pull-to-refresh for status updates |

### Rider Screens

| Screen | Description |
|--------|-------------|
| **DeliveriesScreen** | Two sections: "Available" (can accept) and "My Active" deliveries. Cards show pickup/dropoff addresses, order total. Accept button on available items |
| **DeliveryDetailScreen** | Full order details. Pickup & delivery addresses. Status update buttons: "Pick Up" → "Delivering" → "Delivered" |

### Common Screens

| Screen | Description |
|--------|-------------|
| **ProfileScreen** | User info display. Edit name/phone/address. Logout button |
| **NotificationsScreen** | Chronological list. Unread indicator. Tap to mark as read |

---

## Shared Code with Web

The mobile app shares the same **API contract** as the web frontend. The service layer (`services/`) uses identical endpoint URLs and request/response patterns. Key differences:

| Aspect | Web (ReactJS) | Mobile (React Native) |
|--------|--------------|----------------------|
| Language | TypeScript (.tsx) | TypeScript (.tsx) |
| Storage | `localStorage` | `AsyncStorage` |
| Navigation | React Router | React Navigation |
| Styling | CSS/CSS Variables | `StyleSheet.create()` |
| Maps | Leaflet (future) | React Native Maps (future) |
| Notifications | Web notifications | Expo Notifications (future) |

---

## Design Guidelines

### Color Palette (`utils/colors.ts`)

```typescript
export const Colors = {
  primary: '#FF6B35',
  primaryDark: '#E85D2C',
  primaryLight: '#FF8F66',
  secondary: '#1A1A2E',
  accent: '#16213E',
  success: '#00C853',
  warning: '#FFB300',
  danger: '#FF1744',
  bgPrimary: '#F8F9FA',
  bgCard: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#6C757D',
  borderColor: '#E9ECEF',
} as const;
```

### Typography
- Headers: Bold, 18–24pt
- Body: Regular, 14–16pt
- Captions: Regular, 12pt, secondary color

### Component Patterns
- **Cards**: Rounded corners (12px), subtle shadow, white background
- **Buttons**: Full-width primary action buttons, pill-shaped secondary
- **Status Badges**: Color-coded with status text
- **Loading**: Skeleton screens for lists, spinner for actions
- **Empty States**: Illustrated empty states with action prompts
