# FinanceOS — Finance Dashboard System

A full-stack finance dashboard built with the **MERN stack** (MongoDB, Express, React, Node.js).
Clean architecture, role-based access control, rich analytics, and a polished dark UI.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Setup & Installation](#setup--installation)
- [API Reference](#api-reference)
- [Role & Permissions](#role--permissions)
- [Design Decisions](#design-decisions)
- [Assumptions & Tradeoffs](#assumptions--tradeoffs)

---

## Features

### Backend
- JWT authentication (login, token refresh, role-encoded claims)
- Three-tier RBAC — Viewer / Analyst / Admin
- Financial records CRUD with **soft delete** (data is never hard-deleted)
- Filtering by type, category, date range; sorting; pagination
- MongoDB Aggregation pipelines for dashboard analytics
  - Total income / expense / net balance
  - Category-wise breakdown
  - Monthly trends (last 12 months)
  - Weekly trends (last 7 weeks)
  - Recent activity feed
- Global error handler with Mongoose-aware messages
- Input validation via `express-validator`
- Rate limiting (100 req / 15 min per IP)
- Database seeder with realistic 12-month sample data

### Frontend
- Login page with quick demo credentials
- Dashboard with area charts, pie chart, bar chart (Recharts)
- Records page — full table with filters, sort, pagination, inline CRUD modals
- Users page — admin-only user management with card grid + permissions table
- Collapsible sidebar with role-aware navigation
- Toast notifications for all actions
- Responsive design

---

## Tech Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Runtime    | Node.js 18+                                 |
| Framework  | Express 4                                   |
| Database   | MongoDB (Mongoose ODM)                      |
| Auth       | JSON Web Tokens (bcryptjs for hashing)      |
| Validation | express-validator                           |
| Rate limit | express-rate-limit                          |
| Frontend   | React 18, React Router v6                   |
| Charts     | Recharts                                    |
| HTTP client| Axios (with interceptors)                   |
| Toasts     | react-hot-toast                             |
| Fonts      | Syne (display), DM Mono, Inter              |

---

## Architecture

```
finance-dashboard/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/               # HTTP layer — thin, delegates to services
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── recordController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   ├── auth.js                # JWT protect + authorize + requirePermission
│   │   ├── errorHandler.js        # Global error handler
│   │   └── validators.js          # express-validator rules
│   ├── models/
│   │   ├── User.js                # Role, status, JWT methods, permissions map
│   │   └── Record.js              # Soft-delete, indexes, category enum
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── recordRoutes.js
│   │   └── dashboardRoutes.js
│   ├── services/                  # Business logic layer
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── recordService.js
│   │   └── dashboardService.js    # All aggregation pipelines
│   ├── utils/
│   │   ├── helpers.js             # AppError, asyncHandler, pagination helpers
│   │   └── seeder.js              # Realistic sample data generator
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── api/
        │   └── index.js           # Axios instance + all API functions
        ├── context/
        │   └── AuthContext.js     # Global auth state + permission helper
        ├── components/
        │   ├── Layout.js          # Sidebar + main wrapper
        │   └── Layout.css
        ├── pages/
        │   ├── LoginPage.js/css
        │   ├── DashboardPage.js/css
        │   ├── RecordsPage.js/css
        │   └── UsersPage.js/css
        ├── App.js                 # Routes + guards
        ├── index.js
        └── index.css              # Design system tokens + global styles
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- MongoDB running locally on `mongodb://localhost:27017` (or Atlas URI)

### 1. Clone & install backend
```bash
cd finance-dashboard/backend
cp .env.example .env
# Edit .env — set MONGO_URI and JWT_SECRET
npm install
```

### 2. Seed the database
```bash
npm run seed
```
This creates 3 users and ~12 months of realistic transaction data.

**Demo credentials:**
| Role    | Email                   | Password    |
|---------|-------------------------|-------------|
| Admin   | admin@finance.com       | admin123    |
| Analyst | analyst@finance.com     | analyst123  |
| Viewer  | viewer@finance.com      | viewer123   |

### 3. Start the backend
```bash
npm run dev      # development (nodemon)
npm start        # production
```
Backend runs on `http://localhost:5000`

### 4. Install & start frontend
```bash
cd ../frontend
npm install
npm start
```
Frontend runs on `http://localhost:3000` (proxies API calls to port 5000)

---

## API Reference

All protected routes require `Authorization: Bearer <token>` header.

### Auth
| Method | Endpoint             | Access  | Description          |
|--------|----------------------|---------|----------------------|
| POST   | /api/auth/register   | Public  | Register a new user  |
| POST   | /api/auth/login      | Public  | Login, returns JWT   |
| GET    | /api/auth/me         | Private | Get current user     |
| POST   | /api/auth/logout     | Private | Logout (client-side) |

### Records
| Method | Endpoint              | Access  | Description                          |
|--------|-----------------------|---------|--------------------------------------|
| GET    | /api/records          | All     | List records (filters + pagination)  |
| GET    | /api/records/:id      | All     | Get single record                    |
| POST   | /api/records          | Admin   | Create record                        |
| PUT    | /api/records/:id      | Admin   | Update record                        |
| DELETE | /api/records/:id      | Admin   | Soft-delete record                   |
| GET    | /api/records/categories | All   | Get valid category list              |

**Query params for GET /api/records:**
```
?type=expense&category=food&startDate=2026-01-01&endDate=2026-03-31
&page=1&limit=10&sortBy=date&order=desc&search=dinner
```

### Dashboard
| Method | Endpoint                       | Access           | Description              |
|--------|--------------------------------|------------------|--------------------------|
| GET    | /api/dashboard                 | All roles        | Full dashboard (one call)|
| GET    | /api/dashboard/summary         | All roles        | Income/expense/balance   |
| GET    | /api/dashboard/recent          | All roles        | Recent 10 transactions   |
| GET    | /api/dashboard/categories      | Analyst + Admin  | Category breakdown       |
| GET    | /api/dashboard/trends/monthly  | Analyst + Admin  | Last 12 months           |
| GET    | /api/dashboard/trends/weekly   | Analyst + Admin  | Last 7 weeks             |

### Users (Admin only)
| Method | Endpoint           | Description                  |
|--------|--------------------|------------------------------|
| GET    | /api/users         | List users (filters + paging)|
| POST   | /api/users         | Create user                  |
| GET    | /api/users/:id     | Get user by ID               |
| PUT    | /api/users/:id     | Update user                  |
| DELETE | /api/users/:id     | Deactivate user (soft)       |
| GET    | /api/users/profile | Get own profile              |
| PUT    | /api/users/profile | Update own profile           |

### Error Response Format
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "amount", "message": "Amount is required" }
  ]
}
```

### Success Response Format
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "total": 48,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Role & Permissions

| Permission            | Viewer | Analyst | Admin |
|-----------------------|--------|---------|-------|
| View records          | ✓      | ✓       | ✓     |
| View dashboard summary| ✓      | ✓       | ✓     |
| View recent activity  | ✓      | ✓       | ✓     |
| View insights/trends  | ✗      | ✓       | ✓     |
| Category breakdown    | ✗      | ✓       | ✓     |
| Create records        | ✗      | ✗       | ✓     |
| Edit records          | ✗      | ✗       | ✓     |
| Delete records        | ✗      | ✗       | ✓     |
| View users list       | ✗      | ✗       | ✓     |
| Create/edit users     | ✗      | ✗       | ✓     |
| Deactivate users      | ✗      | ✗       | ✓     |

Permissions are enforced at two levels:
1. **Route middleware** — `authorize("admin")` blocks the request before reaching the controller
2. **Service layer** — ownership checks (e.g. non-admin can only edit their own records)

---

## Design Decisions

### Soft Delete
Records are never hard-deleted. A `isDeleted: true` flag is set and a Mongoose `pre(/^find/)` hook
automatically filters them out of all queries. This preserves audit history and allows recovery.

### Service Layer
Business logic lives in `/services/`, not controllers. Controllers are thin HTTP adapters.
This makes the logic independently testable and reusable.

### Aggregation in Service
All dashboard calculations use MongoDB's native `$group`, `$match`, and `$sum` aggregation pipeline
instead of fetching all records and calculating in JavaScript. This is significantly more efficient
at scale.

### JWT Payload
The token encodes `{ id, role }`. Role is re-checked on every request via `authorize()` middleware,
so if a user's role changes, it takes effect on the next request (no stale role cache).

### Single Dashboard Endpoint
`GET /api/dashboard` runs all 5 aggregation queries in parallel via `Promise.all()` and returns
everything in one response — reducing frontend round-trips from 5 to 1.

---

## Assumptions & Tradeoffs

| Decision | Rationale |
|----------|-----------|
| MongoDB over SQL | Flexible schema suits evolving financial categories; aggregation pipeline is very powerful for analytics |
| Soft delete only | Preserves data integrity; hard delete is irreversible and bad for financial systems |
| Admin-only writes | Mirrors real financial systems where not everyone can enter transactions |
| JWT stored in localStorage | Simpler for a dashboard app; in production, use httpOnly cookies |
| No refresh tokens | Kept simple for assessment scope; production would add token rotation |
| React CRA | Quick setup; production would use Vite or Next.js |
| INR currency | Default for Indian finance context; trivially configurable |
