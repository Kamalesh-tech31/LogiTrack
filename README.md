# LogiTrack

A full-stack logistics and supply chain management platform with separate dashboards for business owners, customers, delivery agents and admins. Business owners list products and manage stock, customers place and track orders, delivery agents pick up and deliver them with OTP confirmation, and admins approve new accounts.

## How It Works

1. **Sign up.** A user registers with a Gmail address and verifies it with a one-time password (OTP) sent by email. Customers are approved immediately. Business owners and delivery agents upload verification documents and wait for an admin to approve them.
2. **Owner lists products.** An approved business owner adds products with images, sets prices and keeps stock up to date. Every stock change is recorded in an inventory history.
3. **Customer orders.** A customer browses products, adds them to the cart and checks out. Stock is reduced at the moment the order is placed, and only if enough stock is available, so the same item cannot be sold twice.
4. **Delivery agent delivers.** An agent claims an order (or a batch of nearby orders). The app suggests a delivery sequence using real road distances, and falls back to straight-line distance if the routing service is unavailable.
5. **Confirmed with an OTP.** When the agent reaches the customer, a delivery OTP is checked before the order is marked as delivered.
6. **Everyone sees progress.** Customers follow their order on a map, owners see orders and revenue analytics, and agents see their earnings and delivery history.

## Features

- **Role-based access:** four roles, each with its own dashboard (owner, customer, delivery agent, admin)
- **Owner:** product management (add, edit), inventory and restocking with history, order management, delivery agent management, analytics and revenue charts
- **Customer:** browse products, cart and checkout, order history, order tracking on a map, profile and analytics
- **Delivery agent:** assigned deliveries, bulk and nearby deliveries, route maps, earnings, delivery history
- **Admin:** review and approve or reject new user registrations
- **Authentication:** JWT login with hashed passwords, OTP email verification on registration (Brevo SMTP), forgot-password flow, account deletion
- **Delivery OTP:** the customer's OTP is verified at hand-over before an order is marked delivered
- **Notifications:** in-app notifications for order events, automatically cleared after 24 hours
- **Maps and location:** Leaflet maps with OSRM road routing, address geocoding with Geoapify (OpenStreetMap Nominatim as a fallback)
- **Media:** product images and verification documents uploaded through Cloudinary

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Leaflet |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT, bcrypt, email OTP |
| Services | Cloudinary, Geoapify, OSRM, Brevo SMTP |
| Deployment | Vercel (frontend) |

## Project Structure

```
LogiTrack/
├── backend/
│   └── src/
│       ├── config/        # database, Cloudinary, multer (file uploads)
│       ├── controllers/   # business logic per feature
│       ├── middleware/    # auth, validation, errors, CORS, request logging
│       ├── models/        # Mongoose schemas (users, products, orders, deliveries...)
│       ├── routes/        # API route definitions
│       ├── services/      # OTP, geocoding, notifications
│       └── utils/         # distance and route helpers
└── frontend/
    ├── app/               # Next.js routes: admin, owner, customer, delivery
    ├── components/        # UI components grouped by role
    └── lib/               # API client, cart, helpers
```

## API Overview

The backend exposes a REST API under `/api`, grouped by feature. Protected routes expect a JWT in the `Authorization: Bearer <token>` header.

| Area | What it covers |
|---|---|
| Auth | registration with OTP, login, password reset, profile, account deletion |
| Products and inventory | product catalogue, stock changes, inventory history |
| Orders | placing orders, status updates, customer order history |
| Deliveries | claiming orders, batches, delivery status, delivery OTP, agent earnings |
| Tracking and locations | order tracking, delivery agent location updates |
| Analytics | owner and customer dashboards and statistics |
| Notifications | in-app notifications |
| Admin | approving or rejecting registrations |

A health check is available at `GET /health`.

## Getting Started

### Prerequisites

- Node.js 20.19 or newer
- A MongoDB database (local, or a free MongoDB Atlas cluster)
- Optional services, depending on what you want to try:
  - **Brevo SMTP credentials:** needed for the registration OTP email
  - **Cloudinary account:** needed for product images and the documents owners and agents upload
  - **Geoapify API key:** optional, address search falls back to OpenStreetMap without it

### 1. Clone the repository

```bash
git clone https://github.com/Kamalesh-tech31/LogiTrack.git
cd LogiTrack
```

### 2. Backend

Create a file named `backend/.env` (never commit it) with your own values:

```env
# Database
MONGO_URI=mongodb://127.0.0.1:27017/logitrack_local

# Auth: use a long random string
JWT_SECRET=replace-with-a-long-random-secret

# Server
PORT=5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# Registration OTP email (Brevo SMTP)
BREVO_USER=your-brevo-smtp-login
BREVO_PASS=your-brevo-smtp-key

# Image and document uploads (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional: address search (falls back to OpenStreetMap if empty)
GEOAPIFY_API_KEY=
```

Then install and start the server:

```bash
cd backend
npm install
npm run dev
```

The backend runs on http://localhost:5000. Open http://localhost:5000/health to confirm it is up.

### 3. Frontend

Create `frontend/.env.local` so the frontend knows where the backend is:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Then install and start it in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

### 4. Try it out

1. Register as a **Customer** with a Gmail address and verify the OTP. Customers can log in straight away.
2. Registering as a **Business Owner** or **Delivery Agent** also needs the verification documents, and an admin must approve the account before it can log in.
3. Once an owner has added products, a customer can order them and a delivery agent can claim and deliver the order.
4. In development mode (`NODE_ENV=development`) the delivery OTP is also returned in the API response, so you can test hand-over without email.

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Signs login tokens |
| `PORT` | No | Backend port, default 5000 |
| `FRONTEND_URL` | No | Frontend address used for CORS and email links, default http://localhost:3000 |
| `NODE_ENV` | No | `development` locally, `production` when deployed |
| `BREVO_USER`, `BREVO_PASS` | For signup | SMTP login for the registration OTP email |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | For uploads | Product images and verification documents |
| `GEOAPIFY_API_KEY` | No | Address search; OpenStreetMap is used without it |
| `NEXT_PUBLIC_API_URL` | Yes (frontend) | Backend address used by the frontend |

## Roadmap

- Automated tests and a CI pipeline
- Live location streaming for delivery tracking
- A formal order status workflow with a full event history
- Transactions for multi-item orders and batch assignments
- Further security hardening: stricter route-level authorization, rate limiting, upload limits
- Docker setup and API documentation
