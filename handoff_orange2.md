# LogiTrack Technical Handoff Document: Branch `orange2`

**Repository**: `Kamalesh-tech31/LogiTrack`  
**Current Production Branch**: `orange2`  
**Date**: August 2026  
**Build Status**: Passing (`npm run build` — 37/37 static and dynamic routes compiled with 0 errors)

---

## 1. Branch Lineage & Merged History

The `orange2` branch is the unified, production-ready branch containing all architectural redesigns, authentication workflows, fleet delivery OTP systems, and customer geocoding capabilities.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     kamalesh    │       │     orange      │       │     my-copy     │
│ (Admin KYC,     │──────▶│ (Charcoal/Orange│──────▶│ (Geoapify,      │──────▶ [ orange2 ]
│  Document Upload,       │  Theme, 3-Stage │       │  Animations,    │
│  In-App Alerts) │       │  Delivery OTP)  │       │  Address Form)  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Source Branch Contributions:

1. **`kamalesh` (Admin Portal & Role Architecture)**:
   * Document upload pipeline with Cloudinary (`multer` + `cloudinary` storage).
   * Password-gated Admin portal (`/admin`) with pending, approved, and rejected user management.
   * In-app notification engine with database persistence (`Notification.js`) and unread badges.
   * Customer Profile & Security dashboard with live password updates.

2. **`orange` (Design System & Simplified Delivery OTP Workflow)**:
   * Complete end-to-end Charcoal (`#111214` / `#1A1B1E`) and Brand Orange (`#F97316`) UI/UX across all 4 portals.
   * Delivery flow simplification: Stripped out complex multi-step acceptance gates, data masking, and unreliable phone number fields.
   * Streamlined 3-stage delivery system: **Available to Claim** $\rightarrow$ **Request Doorstep OTP** $\rightarrow$ **Verify & Deliver**.
   * Relationship-based query scoping for Customers, Business Owners, and Delivery Agents.

3. **`my-copy` (Geocoding, Structured Addresses, Animations, & Recovery)**:
   * Structured customer delivery address schema (House No., Street, Area, City, State, PIN).
   * Geoapify geocoding engine with autonomous OpenStreetMap Nominatim fallback.
   * Interactive order completion animation pill (Loading spinner $\rightarrow$ yellow delivery truck on road $\rightarrow$ emerald "ORDER PLACED").
   * Dedicated post-checkout summary dialog (`OrderSuccessModal`) and stock-restoring cancellation modal (`CancelOrderModal`).
   * Webpack dynamic import error auto-recovery (`ChunkErrorRecovery.tsx`).
   * Dynamic multi-port local and LAN IP CORS configuration.

---

## 2. Feature-by-Feature Breakdown

---

### A. Charcoal + Brand Orange Design System
* **Concept**: Replaced all disparate light/crimson themes with a unified dark charcoal design language.
* **Palette**:
  * Core Background: `#111214`
  * Card / Surface Layer: `#1A1B1E`
  * Borders / Dividers: `#2A2B30`
  * Accent Primary: `#F97316` (Brand Orange), `#EA580C` (Hover State), `#FDBA74` (Muted Accent)
  * Text: `#FFFFFF` (Primary Header), `#F4F4F5` (Body), `#A1A1AA` (Muted Subtext)
* **Application**: Applied across the Homepage (`/`), Authentication (`/login`, `/register`), Admin Portal (`/admin/*`), Business Owner Portal (`/owner/*`), Delivery Courier Portal (`/delivery/*`), and Customer Marketplace (`/customer/*`).

---

### B. Admin Dashboard, Security Gate, & KYC Verification
* **What it does**: Restricts access to platform administration through an authentication barrier and allows admins to review and approve/reject Business Owner and Delivery Courier registrations.
* **Why it works**:
  1. During registration, Business Owners must upload their GST Certificate and Shop License; Delivery Agents must upload their Aadhaar card and Driving License.
  2. Documents are uploaded via `multer` to Cloudinary.
  3. Non-customer users are placed in `status: "pending"` upon email OTP verification.
  4. Admins access `/admin` by entering the system master key (`ADMIN_PASSWORD`).
  5. The backend validates this via `authenticateAdmin.js`, allowing admins to review uploaded document URLs and toggle status to `approved` or `rejected`.
* **Key Files**:
  * Backend: [`adminController.js`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/backend/src/controllers/adminController.js), [`authenticateAdmin.js`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/backend/src/middleware/authenticateAdmin.js), [`adminRoutes.js`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/backend/src/routes/adminRoutes.js)
  * Frontend: [`frontend/app/admin/page.tsx`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/frontend/app/admin/page.tsx), [`ApprovedUserCard.tsx`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/frontend/components/admin/ApprovedUserCard.tsx), [`PendingUserCard.tsx`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/frontend/components/admin/PendingUserCard.tsx), [`RejectedUserCard.tsx`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/frontend/components/admin/RejectedUserCard.tsx)

---

### C. Simplified 3-Stage Delivery OTP System
* **What it does**: Manages the life-cycle of shipments from fleet claiming to doorstep verification.
* **The 3-Stage Flow**:
  1. **Available to Claim**: Couriers browse unassigned orders. The full destination address and map coordinates are displayed immediately so couriers know the exact destination before deciding to claim.
  2. **Active Trip (Claiming = Assignment)**: Clicking *"Claim Delivery"* assigns the order to the courier and moves it into *"My Deliveries"*.
  3. **Doorstep OTP Verification**: Upon arriving at the delivery location, the courier clicks *"Request Customer OTP"*. The backend generates a cryptographically random 6-digit OTP and emails it directly to the customer (withheld from the courier's API response). The customer verbally provides the OTP at the door. Entering the OTP verifies the single-use hash with bcrypt, decrements attempt counters, marks the order as `delivered`, and sets timestamps.
* **What was Removed & Rationale**:
  * *Removed Address Masking*: Masking added friction and prevented couriers from evaluating delivery feasibility.
  * *Removed Separate "Accept" Step*: Merged claiming and acceptance into a single action.
  * *Removed Customer Phone Display*: Customer accounts do not require phone numbers during registration, leading to null values. Phone fields were eliminated from the delivery card to prevent broken layouts.
* **Key Files**:
  * Backend: [`deliveryController.js`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/backend/src/controllers/deliveryController.js), [`deliveryOtpService.js`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/backend/src/services/deliveryOtpService.js)
  * Frontend: [`DeliveryCard.tsx`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/frontend/components/delivery/DeliveryCard.tsx), [`frontend/app/delivery/deliveries/page.tsx`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/frontend/app/delivery/deliveries/page.tsx)

---

### D. Relationship-Based Authorization Scoping
* **What it does**: Ensures strict data isolation across different user roles while using unified endpoints.
* **How it works**:
  * In `orderController.js`, queries automatically scope by the decoded JWT `req.user.role`:
    * **Customer**: `{ customerId: req.user._id }`
    * **Business Owner**: `{ ownerId: req.user._id }` (only orders containing their products)
    * **Delivery Agent**: `{ $or: [{ assignedAgent: req.user._id }, { assignedAgent: null }] }`
* **Key Files**:
  * Backend: [`orderController.js`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/backend/src/controllers/orderController.js), [`authenticateToken.js`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/backend/src/middleware/authenticateToken.js)

---

### E. Structured Addresses & Autonomous Geocoding
* **What it does**: Replaced free-form text input with structured inputs (House No., Street, Area, City, State, PIN) and persists presets (Home, Work, Friend, Custom).
* **How it works**:
  * Form inputs are validated and compiled into a unified string.
  * **Location Detection**: The GPS button queries browser coordinates and runs reverse geocoding via OpenStreetMap Nominatim.
  * **Backend Geocoding**: The backend uses Geoapify Geocoding API (`GEOAPIFY_API_KEY`) to resolve exact latitude/longitude. If the key is not set, it falls back to OpenStreetMap Nominatim.
  * **Saved Addresses**: Stored locally in `localStorage` under `logitrack_saved_addresses_${userId}`. Selecting a preset restores all fields, coordinates, and recipient data.
* **Key Files**:
  * Backend: [`geocodingService.js`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/backend/src/services/geocodingService.js), [`Order.js`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/backend/src/models/Order.js)
  * Frontend: [`addressStorage.ts`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/frontend/lib/addressStorage.ts), [`delivery-address-section.tsx`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/frontend/components/customer/delivery-address-section.tsx)

---

### F. Cart Management & Checkout Routing
* **Features**:
  * **Bug Fix**: Fixed *"Continue to Checkout"* routing directly to `/customer/cart/checkout` instead of looping back to `/customer/products`.
  * **Single-Item vs. Full-Cart Checkout**:
    * Individual cart items feature a *"Checkout Single Item"* button (`/customer/cart/checkout?itemId=...`).
    * Full checkout processes all cart items.
  * **Cart Link in Navigation**: Direct link to `/customer/cart` with item count awareness.
* **Key Files**:
  * Frontend: [`frontend/app/customer/cart/page.tsx`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/frontend/app/customer/cart/page.tsx), [`cart.ts`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/frontend/lib/cart.ts)

---

### G. Order Placement Animations, Confirmation, & Cancellation
* **Features**:
  * **Order Completion Pill**: Interactive button state progression:
    $$\text{Idle} \longrightarrow \text{Loading Spinner} \longrightarrow \text{Yellow Truck on Road} \longrightarrow \text{Emerald "ORDER PLACED"}$$
  * **Order Confirmation Modal**: Post-order dialog summarizing order ID, items count, total, and full delivery address.
  * **Cancel Order Modal**: Pending/processing orders can be cancelled. Backend restores inventory stock (`$inc: { stock: +quantity }`).
* **Key Files**:
  * Frontend: [`order-completion-pill.tsx`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/frontend/components/customer/order-completion-pill.tsx), [`order-success-modal.tsx`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/frontend/components/customer/order-success-modal.tsx), [`cancel-order-modal.tsx`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/frontend/components/customer/cancel-order-modal.tsx)

---

### H. Client Stability & Chunk Recovery
* **What it does**: Listens for Webpack dynamic import failures (`ChunkLoadError`) during development or hot-reloading and initiates a throttled, silent refresh (max once per 10s) to prevent white-screen crashes.
* **Key Files**:
  * Frontend: [`ChunkErrorRecovery.tsx`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/frontend/components/common/ChunkErrorRecovery.tsx), [`layout.tsx`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/frontend/app/layout.tsx)

---

## 3. Key Files by Area

```
LogiTrack/
├── backend/src/
│   ├── config/
│   │   ├── cloudinary.js                  # Cloudinary SDK initialization
│   │   ├── db.js                          # MongoDB Mongoose connection
│   │   └── multer.js                      # Multer temporary file storage configuration
│   ├── controllers/
│   │   ├── adminController.js             # Admin approval/rejection of users
│   │   ├── authController.js              # Registration OTP and JWT session management
│   │   ├── deliveryController.js          # Courier claiming and status updates
│   │   ├── deliveryTrackingController.js  # Live delivery coordinates & route synthesis
│   │   ├── orderController.js             # Order creation, geocoding, scoped fetching
│   │   └── orderTrackingController.js     # 4-stage tracking steps resolution
│   ├── middleware/
│   │   ├── authenticateAdmin.js           # Password-gated admin verification
│   │   ├── authenticateToken.js           # JWT authentication and user payload decoding
│   │   └── corsConfig.js                  # Dynamic regex CORS matching
│   ├── models/
│   │   ├── Delivery.js                    # Legacy delivery tracking records
│   │   ├── Notification.js                # In-app alert notifications schema
│   │   ├── Order.js                       # Core production order schema
│   │   └── User.js                        # User identity schema with role & KYC docs
│   └── services/
│   │   ├── deliveryOtpService.js          # Doorstep delivery OTP generation and bcrypt check
│   │   ├── geocodingService.js            # Geoapify and OpenStreetMap Nominatim geocoding
│   │   ├── notificationService.js         # Automated order event notification generator
│   │   └── registrationOtpService.js      # Email OTP dispatch via Nodemailer/Brevo
│   └── server.js                          # Express application entrypoint (17 route modules)
│
└── frontend/
    ├── app/
    │   ├── admin/                         # Admin portal (approved, pending, rejected)
    │   ├── customer/
    │   │   ├── cart/checkout/page.tsx     # Animated checkout with structured address form
    │   │   ├── cart/page.tsx              # Cart manager (single-item & full checkout)
    │   │   ├── orders/page.tsx            # Order history with cancellation action
    │   │   ├── products/page.tsx          # Marketplace catalog with instant order routing
    │   │   ├── profile/page.tsx           # Customer profile and password management
    │   │   └── tracking/page.tsx          # Live visual delivery map tracking
    │   ├── delivery/
    │   │   └── deliveries/page.tsx        # Available to claim vs My Deliveries with OTP box
    │   ├── layout.tsx                     # Root layout with fonts, toaster, ChunkErrorRecovery
    │   └── globals.css                    # Design tokens for Charcoal + Brand Orange
    ├── components/
    │   ├── admin/                         # User review and status cards
    │   ├── common/
    │   │   └── ChunkErrorRecovery.tsx     # Webpack chunk reload handler
    │   ├── customer/
    │   │   ├── cancel-order-modal.tsx     # Order cancellation modal
    │   │   ├── delivery-address-section.tsx # Structured address form & preset manager
    │   │   ├── header.tsx                 # Header with in-app notification drawer
    │   │   ├── order-completion-pill.tsx  # Animated yellow delivery truck button
    │   │   ├── order-success-modal.tsx    # Post-order confirmation dialog
    │   │   └── sidebar.tsx                # Customer navigation sidebar with Cart link
    │   └── delivery/
    │       └── DeliveryCard.tsx           # Clean delivery card with doorstep OTP verification
    └── lib/
        ├── addressStorage.ts              # LocalStorage parser and builder for saved addresses
        ├── api.ts                         # Frontend API client library
        └── cart.ts                        # LocalStorage cart management
```

---

## 4. Required Environment Setup

Create `backend/.env` in the `backend/` directory:

```ini
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/logitrack?appName=Cluster0

# Authentication & Security
JWT_SECRET=your_super_secret_jwt_key_here
ADMIN_PASSWORD=admin12345

# Email Dispatch (Brevo / SMTP / Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password_or_smtp_key

# Geocoding (Geoapify)
# Sign up at https://www.geoapify.com to get a free API key.
# If omitted or left empty, the system automatically falls back to OpenStreetMap Nominatim.
GEOAPIFY_API_KEY=your_geoapify_api_key_here

# Document Storage (Cloudinary)
# Sign up at https://cloudinary.com
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Delivery OTP Configuration
DELIVERY_OTP_EXPIRY_MINUTES=10
```

Create `frontend/.env.local` in the `frontend/` directory:

```ini
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Local Upload Directory:
Ensure the `backend/uploads/` directory exists for temporary Multer disk caching:
```bash
mkdir backend/uploads
```

---

## 5. Known Considerations & Technical Notes

1. **Dual Schema Migration Awareness**:
   * The codebase historically contained prototype models (`CustomerOrder.js`, `DeliveryTracking.js`).
   * Production orders run through [`Order.js`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/backend/src/models/Order.js).
   * Tracking controllers ([`deliveryTrackingController.js`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/backend/src/controllers/deliveryTrackingController.js) and [`orderTrackingController.js`](file:///c:/Users/ashwin/Desktop/LogicTrack/LogiTrack/backend/src/controllers/orderTrackingController.js)) have been updated to resolve both `Order` and `CustomerOrder`, synthesizing dynamic routes if explicit tracking documents are not yet present.
2. **Email Provider Configuration**:
   * If `EMAIL_USER` / `EMAIL_PASS` are invalid, registration and delivery OTP dispatch will log to console without crashing the application.
3. **No Masking / No Phone Field on Delivery Card**:
   * Couriers intentionally see full structured addresses (`Flat 402, 18th Avenue, Chennai...`). Customer phone numbers are withheld from the `DeliveryCard` UI since they are optional during registration.

---

## 6. How to Run Locally

### Prerequisites:
* Node.js (v18+)
* MongoDB database (Atlas or local instance)

### 1. Clone & Switch to `orange2`:
```bash
git clone https://github.com/Kamalesh-tech31/LogiTrack.git
cd LogiTrack
git checkout orange2
```

### 2. Backend Setup:
```bash
cd backend
npm install
# Ensure backend/.env is populated with MongoDB URI and JWT_SECRET
mkdir uploads
npm run dev
# Backend starts at http://localhost:5000
```

### 3. Frontend Setup:
```bash
cd ../frontend
npm install
npm run dev
# Frontend starts at http://localhost:3000
```

### 4. Build Verification:
```bash
cd frontend
npm run build
```
*(Confirms all 37 pages compile with 0 errors.)*

---

*Handoff document generated for branch `orange2`.*
