# LogiTrack / DevFusion — Backend

This folder contains the Express + MongoDB backend that powers the LogiTrack/DevFusion application. It provides authentication, product and order management, delivery tracking, analytics, and supporting utilities used by the Next.js frontend.

**Quick summary**
- **Stack**: Node.js, Express, MongoDB (Mongoose)
- **Main entry**: [src/server.js](src/server.js)
- **DB config**: [src/config/db.js](src/config/db.js)
- **Install / run**: See **Quick start** below

**Status**: Development — contains APIs for customers, owners and delivery agents.

**Table of contents**
- **Quick start**
- **Environment**
- **Architecture & flow**
- **Models** (summary)
- **Key routes / endpoints**
- **Auth & security**
- **Middleware & error handling**
- **Dev scripts & testing**

**Quick start**
- Install deps:

```bash
cd backend
npm install
```

- Run in development (nodemon):

```bash
npm run dev
```

- Start production:

```bash
npm start
```

See [package.json](package.json) for scripts and dependencies.

**Environment**
- Copy or create a `.env` file in `backend/` with at least:
   - `MONGO_URI` or `MONGODB_URI` — MongoDB connection string
   - `JWT_SECRET` — signing secret for JSON Web Tokens
   - `PORT` — optional, defaults to `5000`
   - `FRONTEND_URL` — optional, used for CORS (defaults to `http://localhost:3000`)

**Architecture & flow**
- `src/server.js` bootstraps the Express app, attaches global middleware (CORS, JSON parsing, request logger), connects to MongoDB using [src/config/db.js](src/config/db.js) and registers route groups mounted under `/api/*`.
- Route groups are divided between customer-facing APIs (under `/api/customer/*`, `/api/tracking`) and admin/delivery APIs (`/api/products`, `/api/orders`, `/api/deliveries`, `/api/analytics`, etc.).
- Controllers implement the business logic and interact with Mongoose models in `src/models/`.

**Models (summary)**
All models are Mongoose schemas in `src/models/`. Key models and a short description of important fields:

- **User** (`src/models/User.js`): `fullName`, `email` (unique), `password` (hashed), `role` (enum: Business Owner, Delivery Agent, Customer), business metadata.
- **Product** (`src/models/product.js`): owner reference (`ownerId` → `User`), `name`, `description`, `price`, `images`, `stock`, `sku`, `category`, `isActive`.
- **CustomerProduct** (`src/models/CustomerProduct.js`): simplified product model exposed to customers (name, description, image, price, stock, rating, deliveryTime).
- **Order / CustomerOrder** (`src/models/Order.js`, `src/models/CustomerOrder.js`): orders contain `orderId`, customer, `items` (product refs + qty + price), `status`, `totalPrice` / `amount`, shipping address, timestamps. `CustomerOrder` includes JSON transforms to expose `id` and `customer` keys.
- **OrderTracking** (`src/models/OrderTracking.js`): per-order tracking `steps` with `title`, `description`, `status`, `timestamp`.
- **Delivery / DeliveryTracking** (`src/models/Delivery.js`, `src/models/DeliveryTracking.js`): deliveries include `id`, `customer`, `address`, `eta`, `status`, `priority`, `location` and `tracking` fields. `DeliveryTracking` stores origin/destination/currentPosition + waypoints and estimated delivery.
- **DeliveryAgent** (`src/models/DeliveryAgent.js`): agent `name`, `contact`, `isAvailable`, `vehicle`.
- **LocationUpdate** (`src/models/LocationUpdate.js`): single delivery location ping with `deliveryId`, `latitude`, `longitude`, `displayName`, `formattedAddress`, `city/state/country`, `timestamp`.
- **DashboardStats** (`src/models/DashboardStats.js`): cached dashboard metrics (totalOrders, items, pending, revenue).
- **CustomerAnalytics** (`src/models/CustomerAnalytics.js`): aggregates like `totalRevenue`, `revenueTrend`, `ordersTrend`, `categoryDistribution`.

**Key routes / endpoints**
Routes are defined in `src/routes/`. Representative endpoints:

- Authentication: `POST /api/auth/register`, `POST /api/auth/login` ([src/routes/authRoutes.js](src/routes/authRoutes.js)).
- Products (admin): `GET/POST/PUT/DELETE /api/products` ([src/routes/productRoutes.js](src/routes/productRoutes.js)).
- Customer products: `GET/POST /api/customer/products` ([src/routes/customerProductRoutes.js](src/routes/customerProductRoutes.js)).
- Orders:
   - Customer orders: `GET/POST/PUT/DELETE /api/customer/orders` ([src/routes/customerOrderRoutes.js](src/routes/customerOrderRoutes.js)).
   - Admin orders: `GET/POST/PUT/DELETE /api/orders` ([src/routes/orderRoutes.js](src/routes/orderRoutes.js)).
- Tracking:
   - Order tracking: `/api/tracking` ([src/routes/orderTrackingRoutes.js](src/routes/orderTrackingRoutes.js)).
   - Delivery tracking: `/api/delivery` ([src/routes/deliveryTrackingRoutes.js](src/routes/deliveryTrackingRoutes.js)).
- Deliveries & dashboard: `/api/deliveries` group includes `GET /`, `POST /`, `PUT /:id`, `PATCH /:id/status`, `GET /dashboard`, `GET /earnings` ([src/routes/deliveries.js](src/routes/deliveries.js)).
- Location updates: `POST /api/location-updates`, `GET /api/location-updates/latest` ([src/routes/locations.js](src/routes/locations.js)).

Controllers validate input, query models and return JSON responses with standard HTTP codes (200, 201, 400, 404, 500).

**Authentication & security**
- JWT-based auth: `src/controllers/authController.js` issues JWTs signed with `JWT_SECRET` for login/register flows. Token verification middleware is `src/middleware/authenticateToken.js` and is applied to protected routes (see `src/routes/productRoutes.js` which uses `authenticateToken`).
- Passwords hashed with `bcryptjs` and simple password rules enforced at registration.

**Middleware & error handling**
- Request logging: `src/middleware/requestLogger.js` logs incoming requests.
- CORS config: `src/middleware/corsConfig.js` and CORS enabled in `src/server.js` (reads `FRONTEND_URL`).
- Input validation helpers: `src/middleware/validateRequest.js` uses Joi where controllers choose to validate.
- Error handling: global error handler is `src/middleware/errorHandler.js` and is mounted at the end of the middleware stack to convert thrown errors into JSON responses.

**Database**
- `src/config/db.js` connects to MongoDB using Mongoose. Defaults to `mongodb://localhost:27017/devfusion` when no env var is present. Mongoose models use `timestamps` in schemas where appropriate.

**Development & testing**
- Dev server: `npm run dev` uses `nodemon` to reload on changes.
- Tests: `npm test` (Jest is installed; add tests under a `__tests__` folder to exercise controllers and helpers).

**Notes & next steps**
- Consider adding OpenAPI/Swagger docs and request/response examples for each route.
- Add rate-limiting and stricter validation for production deployments.
- Add migrations / seed scripts for initial data (delivery agents, sample products) if needed.

**Where to look in code**
- App bootstrap: [src/server.js](src/server.js)
- DB connection: [src/config/db.js](src/config/db.js)
- Auth: [src/controllers/authController.js](src/controllers/authController.js)
- Delivery flows: [src/controllers/deliveryController.js](src/controllers/deliveryController.js)
- Models: [src/models](src/models)

If you'd like, I can:
- add a simple Postman collection / OpenAPI spec for these endpoints,
- or run quick tests against the dev server (if you want me to start it here).

