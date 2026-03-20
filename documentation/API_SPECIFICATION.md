# Geobites — API Specification

## Base URL

```
Development: http://localhost:3000/api
Production:  https://api.geobites.com/api
```

## Authentication

Geobites uses **Better Auth** for authentication. Better Auth uses **server-managed sessions** stored in the database. After login, a session cookie is automatically set — no manual token management needed.

All protected endpoints validate the session from the cookie automatically via Better Auth's NestJS middleware.

```
# Session cookie is set automatically after login
Cookie: better-auth.session_token=<session_token>
```

### Role Guards

Better Auth stores the user's role in the session. Role-based guards on the backend (`@Roles('seller')` guard) check the session's attached user role.

Roles: `customer`, `seller`, `rider`

---

## 1. Auth Module

> **Note**: Better Auth exposes auth endpoints at `/api/auth`. The endpoints below follow Better Auth's built-in route conventions, with custom fields (`role`, `phone`) passed via the `metadata` field.

### POST `/api/auth/sign-up/email`
Register a new user with email and password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "customer",
  "phone": "+1234567890"
}
```

**Response (200):**
```json
{
  "token": null,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "customer",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```
A session cookie is automatically set in the response headers.

**Validation:**
- `email`: valid email, unique
- `password`: min 8 characters
- `name`: required, min 2 characters
- `role`: must be `customer`, `seller`, or `rider`

---

### POST `/api/auth/sign-in/email`
Sign in with email and password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "token": null,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "customer"
  }
}
```
A session cookie is set automatically. The session is stored in the `sessions` table in the database.

---

### GET `/api/auth/get-session`
Get the current authenticated user's session. 🔒 **Requires Auth**

**Response (200):**
```json
{
  "session": {
    "id": "session_uuid",
    "userId": "user_uuid",
    "expiresAt": "2026-04-01T00:00:00.000Z"
  },
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "customer",
    "phone": "+1234567890",
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

### POST `/api/auth/sign-out`
Sign out and invalidate the current session. 🔒 **Requires Auth**

**Response (200):** `{ "success": true }`

The session is deleted from the database and the cookie is cleared.

---



---

## 2. Vendors Module

### GET `/vendors`
List vendors with optional filters. **Public**

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by name |
| `lat` | number | Latitude for nearby sorting |
| `lng` | number | Longitude for nearby sorting |
| `sortBy` | string | `rating`, `distance`, `name` (default: `rating`) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "burger joint",
      "description": "Best burgers in town",
      "address": "456 Food St",
      "rating": 4.5,
      "totalRatings": 128,
      "imageUrl": "https://...",
      "isActive": true
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

---

### GET `/vendors/:id`
Get vendor details. **Public**

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Burger Joint",
  "description": "Best burgers in town",
  "address": "456 Food St",
  "latitude": 14.5995,
  "longitude": 120.9842,
  "rating": 4.5,
  "totalRatings": 128,
  "imageUrl": "https://...",
  "isActive": true,
  "menuItems": [
    {
      "id": "uuid",
      "name": "Classic Burger",
      "price": 199.00,
      "category": "Main",
      "isAvailable": true
    }
  ]
}
```

---

### POST `/vendors`
Create a vendor profile. 🔒 **Seller only**

**Body:**
```json
{
  "name": "Burger Joint",
  "description": "Best burgers in town",
  "address": "456 Food St",
  "latitude": 14.5995,
  "longitude": 120.9842
}
```

**Response (201):** Created vendor object

---

### PUT `/vendors/:id`
Update vendor details. 🔒 **Seller (owner) only**

**Body:** Same as POST (partial update)

**Response (200):** Updated vendor object

---

## 3. Menu Module

### GET `/vendors/:vendorId/menu`
Get all menu items for a vendor. **Public**

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Classic Burger",
    "description": "Juicy beef patty with all the fixings",
    "price": 199.00,
    "category": "Main",
    "imageUrl": "https://...",
    "isAvailable": true
  }
]
```

---

### POST `/menu`
Add a menu item. 🔒 **Seller only**

**Body:**
```json
{
  "vendorId": "uuid",
  "name": "Classic Burger",
  "description": "Juicy beef patty with all the fixings",
  "price": 199.00,
  "category": "Main",
  "isAvailable": true
}
```

**Validation:**
- `name`: required
- `price`: required, positive number
- `vendorId`: must belong to the authenticated seller

---

### PUT `/menu/:id`
Update a menu item. 🔒 **Seller (owner) only**

### DELETE `/menu/:id`
Remove a menu item. 🔒 **Seller (owner) only**

---

## 4. Orders Module

### POST `/orders`
Place a new order. 🔒 **Customer only**

**Body:**
```json
{
  "vendorId": "uuid",
  "deliveryAddress": "789 Customer Ave",
  "deliveryLat": 14.6010,
  "deliveryLng": 120.9850,
  "notes": "Please add extra sauce",
  "items": [
    { "menuItemId": "uuid", "quantity": 2 },
    { "menuItemId": "uuid", "quantity": 1 }
  ]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "status": "pending",
  "totalAmount": 597.00,
  "items": [...],
  "createdAt": "2026-01-01T12:00:00.000Z"
}
```

---

### GET `/orders`
Get orders for the authenticated user. 🔒 **Requires Auth**

Returns orders based on role:
- **Customer**: orders they placed
- **Seller**: orders for their vendor
- **Rider**: orders assigned to them

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status |
| `page` | number | Page (default: 1) |
| `limit` | number | Per page (default: 20) |

---

### GET `/orders/:id`
Get single order details. 🔒 **Requires Auth** (must be involved in the order)

**Response (200):**
```json
{
  "id": "uuid",
  "status": "preparing",
  "totalAmount": 597.00,
  "deliveryAddress": "789 Customer Ave",
  "notes": "Please add extra sauce",
  "customer": { "id": "uuid", "name": "John" },
  "vendor": { "id": "uuid", "name": "Burger Joint" },
  "rider": { "id": "uuid", "name": "Mike" },
  "items": [
    { "name": "Classic Burger", "quantity": 2, "price": 199.00 },
    { "name": "Fries", "quantity": 1, "price": 99.00 }
  ],
  "createdAt": "2026-01-01T12:00:00.000Z",
  "updatedAt": "2026-01-01T12:05:00.000Z"
}
```

---

### PATCH `/orders/:id/status`
Update order status. 🔒 **Seller or Rider** (based on status transition)

**Body:**
```json
{
  "status": "accepted"
}
```

**Allowed Transitions:**

| Current Status | Allowed Next | Who Can |
|---------------|-------------|---------|
| `pending` | `accepted`, `rejected` | Seller |
| `accepted` | `preparing` | Seller |
| `preparing` | `ready_for_pickup` | Seller |
| `ready_for_pickup` | `picked_up` | Rider |
| `picked_up` | `delivering` | Rider |
| `delivering` | `delivered` | Rider |
| `pending` | `cancelled` | Customer |

---

## 5. Ratings Module

### POST `/ratings`
Submit a rating for a completed order. 🔒 **Customer only**

**Body:**
```json
{
  "orderId": "uuid",
  "score": 5,
  "feedback": "Amazing food, quick delivery!"
}
```

**Validation:**
- Order must have status `delivered`
- Order must belong to the authenticated customer
- One rating per order

---

### GET `/vendors/:id/ratings`
Get ratings for a vendor. **Public**

**Response (200):**
```json
{
  "averageScore": 4.5,
  "totalRatings": 128,
  "ratings": [
    {
      "id": "uuid",
      "score": 5,
      "feedback": "Amazing food!",
      "customerName": "John D.",
      "createdAt": "2026-01-01T12:00:00.000Z"
    }
  ]
}
```

---

## 6. Riders Module

### GET `/riders/deliveries`
Get available and assigned deliveries. 🔒 **Rider only**

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `type` | string | `available` (ready_for_pickup, no rider) or `active` (assigned to me) |

---

### PATCH `/riders/deliveries/:orderId/accept`
Accept a delivery request. 🔒 **Rider only**

Assigns the rider to the order. Only works if order status is `ready_for_pickup` and has no rider.

---

### PATCH `/riders/deliveries/:orderId/status`
Update delivery status. 🔒 **Rider (assigned) only**

**Body:**
```json
{
  "status": "picked_up"
}
```

---

## 7. Notifications Module

### GET `/notifications`
Get notifications for the authenticated user. 🔒 **Requires Auth**

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `unreadOnly` | boolean | Filter to unread only |
| `page` | number | Page (default: 1) |
| `limit` | number | Per page (default: 50) |

---

### PATCH `/notifications/:id/read`
Mark a notification as read. 🔒 **Requires Auth**

---

## Error Responses

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Validation error message",
  "error": "Bad Request"
}
```

| Status Code | Usage |
|-------------|-------|
| 400 | Validation error, bad input |
| 401 | Missing or invalid JWT token |
| 403 | Insufficient role/permissions |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate email, already rated) |
| 500 | Internal server error |
