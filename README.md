# LogiTrack

A full-stack logistics and supply chain management platform with separate dashboards for business owners, customers, delivery agents and admins.

## Features

- **Role-based access:** four roles, each with its own dashboard (owner, customer, delivery agent, admin)
- **Owner:** product management (add, edit), inventory and restocking, order management, delivery agent management, analytics and revenue charts
- **Customer:** browse products, cart and checkout, order history, order tracking on a map, profile and analytics
- **Delivery agent:** assigned deliveries, bulk and nearby deliveries, route maps, earnings, delivery history
- **Admin:** review and approve or reject new user registrations
- **Authentication:** OTP email verification on registration (Brevo SMTP), forgot-password flow, account deletion
- **Maps and location:** Leaflet maps with OSRM routing, address geocoding with Geoapify
- **Media:** product image uploads through Cloudinary

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Leaflet |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Services | Cloudinary, Geoapify, Brevo SMTP |
| Deployment | Vercel (frontend) |

## Project Structure

```
LogiTrack/
├── backend/
│   └── src/
│       ├── config/        # database, Cloudinary, multer
│       ├── controllers/   # business logic per feature
│       ├── middleware/    # auth, validation, errors, CORS
│       ├── models/        # Mongoose schemas
│       ├── routes/        # API route definitions
│       ├── services/      # OTP, geocoding, notifications
│       └── utils/
└── frontend/
    ├── app/               # Next.js routes: admin, owner, customer, delivery
    ├── components/        # UI components grouped by role
    └── lib/               # API client, cart, helpers
```

## Getting Started

### Prerequisites
- Node.js 19+
- A MongoDB database (local or MongoDB Atlas)

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
