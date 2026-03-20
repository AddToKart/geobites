# Geobites — System Features & How It Works

## Overview

Geobites is a **food delivery platform** that connects three types of users: **Customers** who want to order food, **Sellers** who run food businesses, and **Riders** who deliver orders. This document describes every feature of the system and walks through how each workflow operates end to end.

---

## User Roles

| Role | Who They Are | What They Can Do |
|------|-------------|-----------------|
| **Customer** | Anyone who wants to order food | Browse vendors, place orders, track deliveries, rate orders |
| **Seller** | Food business owners | Manage menu, accept/reject orders, update preparation status |
| **Rider** | Delivery personnel | View available deliveries, accept jobs, update delivery status |

---

## 1. Authentication & Account Management

### How It Works

All users — whether Customer, Seller, or Rider — use the **same registration and login flow**, with a role selected at signup.

```
Registration Flow:
  1. User fills in name, email, password, phone number
  2. User selects their role: Customer / Seller / Rider
  3. System creates account with bcrypt-hashed password
  4. JWT access token is returned and stored locally
  5. User is redirected to their role-specific dashboard

Login Flow:
  1. User enters email and password
  2. System validates credentials against the database
  3. JWT token is returned (valid for 7 days)
  4. User is redirected to their role-based dashboard

Session Persistence:
  - Web: Token stored in localStorage
  - Mobile: Token stored in AsyncStorage
  - On app/page reload, token is checked & profile fetched to restore session
```

### Features
- **Role-based dashboards** — Each role sees a completely different UI
- **Secure passwords** — All passwords are hashed with bcrypt before storage
- **Stateless authentication** — JWT tokens work identically on web and mobile
- **Auto-logout** — Expired or invalid tokens automatically redirect to login

---

## 2. Vendor Browsing (Customer Feature)

### How It Works

When a customer opens the app, they see a **list of food vendors** ranked by rating.

```
Browse Flow:
  1. Customer opens the Browse screen
  2. System fetches vendors from the API (sorted by rating by default)
  3. Customer can search by name or sort by distance/rating
  4. Customer taps a vendor card to view its menu
```

### Features
- **Vendor cards** show name, average star rating, total number of ratings, and open/closed status
- **Search** — Filter vendors by name in real time
- **Sorting** — Sort by rating (default), distance (using GPS coordinates), or name
- **Ranking algorithm** — Vendors are sorted by a weighted score of: average rating, number of ratings, and activity level (based on recent orders)
- **Availability indicator** — Vendors marked as inactive/closed are shown separately

---

## 3. Menu Browsing & Cart (Customer Feature)

### How It Works

After tapping on a vendor, the customer sees the full menu and can add items to their cart.

```
Menu & Cart Flow:
  1. Customer views vendor's menu, grouped by category (e.g., Main, Drinks, Desserts)
  2. Each item shows name, description, price, and availability
  3. Customer taps "+" to add an item to their cart
  4. Cart is vendor-specific — if customer switches vendors, they are prompted to clear cart
  5. A cart summary bar shows item count and total at the bottom
  6. Customer taps "Go to Cart" to review their order
```

### Features
- **Category grouping** — Menu items are organized by category for easy browsing
- **Availability filtering** — Unavailable items are shown as greyed out and unselectable
- **Quantity controls** — "+" and "−" buttons to adjust quantity inline
- **Vendor-locked cart** — The cart can only hold items from one vendor at a time
- **Cart persistence** — Cart is saved in localStorage/AsyncStorage and survives app restarts

---

## 4. Placing an Order (Customer Feature)

### How It Works

From the Cart screen, the customer reviews their items and submits the order.

```
Order Placement Flow:
  1. Customer reviews cart items, quantities, and total amount
  2. Customer enters (or confirms) their delivery address
  3. Customer adds optional notes (e.g., "No onions please")
  4. Customer taps "Place Order"
  5. System creates the order with status: pending
  6. Customer is redirected to the Order Tracking screen
  7. Seller receives a notification about the new order
```

### What Happens Behind the Scenes
- The system **snapshots** the name and price of each item at the time of order — so price changes by the seller don't affect existing orders
- Total amount is calculated server-side to prevent client-side manipulation
- A **notification** is immediately created for the Seller

---

## 5. Order Management (Seller Feature)

### How It Works

After receiving an order, the seller acts as the gatekeeper of the order lifecycle.

```
Seller Order Flow:
  1. Seller sees new order appear in their "Pending" tab with a notification
  2. Seller reviews order details (items, quantities, delivery address, notes)
  3. Seller accepts or rejects the order:
     - Accepted → Customer notified, status moves to "Accepted"
     - Rejected → Customer notified, order closes
  4. When food preparation starts, seller updates status to "Preparing"
  5. When food is ready, seller updates status to "Ready for Pickup"
  6. Rider is notified that a delivery is available
```

### Order Status Transitions (Seller)

| Action | Status Before | Status After |
|--------|-------------|-------------|
| Accept order | `pending` | `accepted` |
| Reject order | `pending` | `rejected` |
| Start preparing | `accepted` | `preparing` |
| Mark ready | `preparing` | `ready_for_pickup` |

### Features
- **Pending tab** — New orders appear here with an alert badge
- **Active tab** — Orders currently being prepared
- **Completed tab** — Historical orders (accepted + delivered)
- **Order details** — Full item breakdown, customer notes, delivery address

---

## 6. Menu Management (Seller Feature)

### How It Works

Sellers can manage their food menu at any time through the Menu Management page.

```
Menu Management Flow:
  - Add new item: Fill in name, description, price, category → Save
  - Edit item: Tap item → Modify any field → Save
  - Toggle availability: Switch to mark item as available/unavailable without deleting
  - Delete item: Remove item permanently (with confirmation prompt)
```

### Features
- **Real-time availability toggle** — Turn items on/off without deleting them (e.g., for sold-out items)
- **Category management** — Assign items to categories which group them on the menu
- **Instant reflection** — Menu changes are immediately visible to browsing customers

---

## 7. Delivery Management (Rider Feature)

### How It Works

Riders operate independently — they can browse available deliveries and choose which ones to accept.

```
Rider Delivery Flow:
  1. When a seller marks an order "Ready for Pickup", it becomes visible to riders
  2. Rider sees the available delivery in their dashboard (vendor address, delivery address, order value)
  3. Rider taps "Accept" — order is assigned to them, no other rider can accept it
  4. Rider goes to the vendor location and picks up the food
  5. Rider taps "Picked Up" → status updates to "Picked Up", customer is notified
  6. Rider delivers food to the customer's address
  7. Rider taps "Delivered" → order is marked as complete
  8. Customer receives a delivery confirmation notification
```

### Delivery Status Transitions (Rider)

| Action | Status Before | Status After |
|--------|-------------|-------------|
| Accept delivery | `ready_for_pickup` | `ready_for_pickup` (rider assigned) |
| Pick up food | `ready_for_pickup` | `picked_up` |
| En route | `picked_up` | `delivering` |
| Deliver food | `delivering` | `delivered` |

### Features
- **Available deliveries list** — Shows all unclaimed orders ready for pickup
- **Active delivery view** — Shows the currently accepted delivery with full details
- **First-come, first-served** — The first rider to accept gets the order
- **Clear location info** — Pickup address (vendor) and drop-off address (customer) shown clearly

---

## 8. Order Tracking (Customer Feature)

### How It Works

After placing an order, the customer can follow its progress in real time.

```
Tracking Flow:
  1. Customer navigates to "My Orders" and taps an active order
  2. Status timeline shows the current progress visually
  3. When a rider is assigned, the rider's name appears on screen
  4. Customer refreshes to get the latest status
  5. Order is marked complete once the rider confirms delivery
```

### Order Status Timeline (Customer View)

```
● Order Placed       (pending)
● Order Accepted     (accepted)
● Being Prepared     (preparing)
● Ready for Pickup   (ready_for_pickup)
● Picked Up          (picked_up)
● On the Way         (delivering)
● Delivered ✓        (delivered)
```

### Features
- **Status stepper** — Visual vertical timeline showing past, current, and upcoming steps
- **Rider information** — After a rider accepts, name is visible to the customer
- **Order history** — All past orders are stored and viewable
- **Cancellation** — Customer can cancel an order while it's still in `pending` status

---

## 9. Ratings & Feedback (Customer Feature)

### How It Works

After a successful delivery, customers can leave a star rating and written feedback.

```
Rating Flow:
  1. Order moves to "Delivered" status
  2. "Rate this Order" button appears on the order history page
  3. Customer selects 1–5 stars and optionally writes text feedback
  4. Rating is submitted and linked to the order and vendor
  5. Vendor's average rating is automatically recalculated
```

### Rules
- Only **one rating per order** — cannot be changed after submission
- Only available on orders with `delivered` status
- Only the customer who placed the order can rate it

### Features
- **Star ratings (1–5)** — Simple and intuitive
- **Written feedback** — Optional text review viewable on the vendor's profile
- **Impact on ranking** — New ratings immediately update the vendor's average and affect their ranking in browse results

---

## 10. Notifications

### How It Works

The system automatically creates notifications for relevant users when key events occur.

| Event | Who Gets Notified | Message |
|-------|-----------------|---------|
| New order placed | Seller | "You have a new order!" |
| Order accepted | Customer | "Your order has been accepted" |
| Order rejected | Customer | "Your order was rejected" |
| Order ready for pickup | Rider(s) | "New delivery available nearby" |
| Rider picked up order | Customer | "Your order has been picked up" |
| Order delivered | Customer | "Your order has been delivered!" |

### Features
- **Unread badge** — Bell icon shows unread notification count
- **Notification list** — Chronological list with read/unread state
- **Tap to navigate** — Tapping a notification navigates to the relevant order

---

## Complete Order Lifecycle

Here is the full journey of an order from placement to delivery:

```
CUSTOMER places order
        │
        ▼
[pending] ──────────────────────────────────► SELLER sees new order
        │                                              │
        │                                       Accept or Reject
        │                                              │
        ▼                                              ▼
[accepted] ◄────────────────────────── SELLER accepts
        │
        ▼
[preparing] ◄──────────────────────── SELLER starts cooking
        │
        ▼
[ready_for_pickup] ◄─────────────────── SELLER marks food ready
        │                                     RIDER sees available delivery
        │                                              │
        │                                       RIDER accepts
        ▼                                              │
[picked_up] ◄──────────────────────────────── RIDER picks up food
        │
        ▼
[delivering] ◄─────────────────────────────── RIDER en route
        │
        ▼
[delivered] ◄──────────────────────────────── RIDER confirms delivery
        │
        ▼
CUSTOMER rates the order ──────────────────► Vendor rating updated
```

---

## Non-Functional System Behaviors

| Behavior | Description |
|---------|-------------|
| **Security** | All passwords hashed with bcrypt. JWT tokens expire after 7 days. Role guards prevent unauthorized API access |
| **Validation** | All API inputs are validated server-side using class-validator (NestJS). Client-side validation provides early feedback |
| **Error handling** | Consistent error response format across all endpoints. Friendly error messages shown to users |
| **Data integrity** | Order item prices are snapshotted at order creation time. Orders are never deleted — only their status changes |
| **Scalability** | Stateless API design allows horizontal scaling. PostgreSQL connection pooling via TypeORM |
| **Compatibility** | Web app is responsive and works on desktop, tablet, and mobile browsers. Mobile app runs on iOS and Android |
