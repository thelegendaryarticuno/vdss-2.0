# VDSS 2.0 - Vasus Digital Sales System (truethat)

A complete monorepo for a cloud-ready Digital Sales System with a React + TypeScript frontend, Node.js + TypeScript backend, PostgreSQL database, and a built‑in Python AI microservice for sales prediction and product recommendations.

The current project is in a **fully working MVP stage** with end‑to‑end flows for authentication, customers, products, quotes, orders, inventory, reports, and AI insights wired from database → backend → AI service → frontend UI.

## Project Structure

```
truethat/
├── ai-service/           # Python FastAPI service for AI logic
│   ├── src/
│   │   ├── main.py       # FastAPI app & routes
│   │   ├── models.py     # Pydantic models for requests/responses
│   │   └── services/
│   │       ├── forecast.py        # Sales forecasting logic
│   │       ├── recommendations.py # Product recommendations logic
│   │       └── utils.py           # Shared helpers, feature prep, etc.
│   └── requirements.txt  # Python dependencies
├── backend/              # Node.js + TypeScript + Express API
│   ├── src/
│   │   ├── app.ts        # Express app + middleware registration
│   │   ├── server.ts     # HTTP server bootstrap
│   │   ├── config/
│   │   │   └── env.ts    # Environment variable loading
│   │   ├── controllers/  # HTTP controllers (request/response mapping)
│   │   ├── services/     # Business logic layer
│   │   ├── routes/       # API route definitions
│   │   ├── middleware/   # Auth, error handling, etc.
│   │   ├── utils/        # JWT, pagination, password utils
│   │   └── db/
│   │       └── prismaClient.ts
│   └── prisma/
│       ├── schema.prisma
│       ├── seed.ts
│       └── migrations/
├── frontend/             # React + TypeScript + Vite SPA
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/          # Typed Axios clients
│   │   ├── context/      # Auth context
│   │   └── routes/       # React Router setup
│   └── vite.config.ts
├── docker-compose.yml    # PostgreSQL container
├── package.json          # Root scripts (orchestration)
└── .env.example          # Environment variables template
```

---

## Functional Overview (Current Stage)

### Core Business Capabilities

- **User & Auth Management**

  - Email/password login with JWT‑based authentication.
  - Role‑based access control with roles: `ADMIN`, `MANAGER`, `SALES_REP`, `DISTRIBUTOR`.
  - Protected backend routes using `authMiddleware` and frontend guarded routes using `AuthContext` + `useAuth`.
  - `GET /api/auth/me` exposes current user profile and role for the SPA.

- **Customer Management**

  - Full CRUD on customers from the backend `customerController` / `customerService` and frontend `CustomersPage` + `CustomerDetailPage`.
  - Server‑side pagination, search and filtering through `pagination.ts` helpers.
  - Customer detail view includes AI insights (forecast + recommendations) for that customer.

- **Product & Inventory Management**

  - Products CRUD with categories and pricing.
  - Inventory snapshot tracking with `InventorySnapshot` entries in the Prisma schema.
  - Endpoints to fetch a global inventory snapshot or per‑product inventory history.
  - `POST /api/inventory/sync` allows privileged roles to sync/update inventory (e.g., from ERP or manual audit).

- **Quotes & Orders**

  - Quotes lifecycle: creation, update, sending, and acceptance.
  - Quotes are associated with customers and products; items are persisted via Prisma relations.
  - Conversion from accepted quotes into orders, with order status tracking.
  - Orders endpoints expose status transitions (e.g., PENDING → CONFIRMED → SHIPPED).

- **Reporting & Analytics**
  - Aggregated sales summary grouped by customer, product, or region.
  - Customer sales history endpoint drives charts and tables on the `ReportsPage`.
  - Pagination and filtering options to support realistic datasets.

---

## AI Module – Architecture & Capabilities

The **AI module** is implemented as a standalone Python microservice (`ai-service/`) to keep data processing and experimentation separate from the Node.js backend, while exposing a clean HTTP API that the backend uses.

### AI Service Tech Stack

- **Framework**: FastAPI (Python) for high‑performance typed HTTP APIs.
- **Dependencies** (see `ai-service/requirements.txt`):
  - `fastapi`, `uvicorn`
  - `pydantic` for request/response models
  - `numpy`, `pandas`, and optionally `scikit-learn` (depending on your final requirements file) for time‑series/ML style operations

### AI Service Responsibilities

- **Sales Forecasting (`forecast.py`)**

  - Consumes cleaned, per‑customer historical sales series, typically monthly or weekly aggregates.
  - Implements classical approaches (no external AI APIs):
    - Moving averages to smooth noise and produce baseline forecasts.
    - Simple trend extrapolation / linear regression across time steps.
  - Produces a combined payload containing:
    - Historical points (timestamp + value) normalized for charting.
    - Forecast points for the next N periods (configurable via query args).
    - Basic confidence bands (min/mean/max style bounds) where enough history exists.

- **Product Recommendations (`recommendations.py`)**

  - Accepts a customer identifier and purchase history / segment information from the backend.
  - Computes:
    - Similar customers based on segment, region, and/or behavioral features.
    - Product popularity among similar customers.
    - Set difference between products bought by peers vs. target customer.
  - Returns a ranked list of recommended products:
    - Product id, name, category.
    - Scores based on frequency, recentness, and cross‑sell potential.

- **Shared Utilities (`utils.py`)**
  - Data cleaning and normalization helpers (e.g., fill missing months, sort chronologically).
  - Feature engineering utilities for forecasting and recommendation features.
  - Input validation helpers and reusable error responses.

### AI HTTP API (Service Level)

> Note: URLs below refer to the Python service itself (e.g., `http://localhost:8001`), which is usually consumed **only** by the Node backend. External consumers talk only to the Node backend.

- `GET /forecast`

  - **Query params**: `customerId`, `months`, `forecastMonths`.
  - **Body (optional)**: explicit series if backend chooses to push raw history.
  - **Response**: typed Pydantic model with history + forecast arrays and metadata.

- `GET /recommendations`
  - **Query params**: `customerId`.
  - **Response**: list of recommended products with score and explanation metadata.

The backend `aiService.ts` is responsible for calling these FastAPI routes, applying auth/tenancy rules, and exposing simplified REST endpoints to the frontend.

---

## Backend – Detailed Capabilities

Backend is a **TypeScript + Express** app, backed by **Prisma** and PostgreSQL.

### Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript (strict configuration via `tsconfig.json`).
- **Framework**: Express.
- **ORM**: Prisma (PostgreSQL driver).
- **Auth**: JWT (`utils/jwt.ts`) with password hashing (`utils/password.ts`).

### Main Modules

- `config/env.ts`

  - Centralizes reading `.env` variables.
  - Provides typed configuration (e.g., DB URL, JWT secret, ports, AI service URL).

- `db/prismaClient.ts`

  - Exports a singleton Prisma client for use in services.
  - Used across all service layers to access `User`, `Customer`, `Product`, `Quote`, `Order`, `InventorySnapshot`, and `SalesSummary` models.

- `middleware/authMiddleware.ts`

  - Extracts and verifies JWT from `Authorization: Bearer <token>` header.
  - Attaches `req.user` with id/role for downstream controllers.
  - Optionally enforces role checks for privileged endpoints.

- `middleware/errorMiddleware.ts`

  - Centralized error handling.
  - Consistent JSON error structure and HTTP status codes.

- `utils/jwt.ts`

  - Sign and verify JWTs using `JWT_SECRET` from env.
  - Helpers for generating access tokens with expiration.

- `utils/pagination.ts`
  - Parses `page`, `pageSize`, `search`, and sort parameters.
  - Produces Prisma‑compatible `skip`, `take`, and `where` objects.

### HTTP Controllers & Services

Each domain has a **controller** (HTTP layer) and a **service** (business logic):

- **Auth**

  - `authController.ts` / `authService.ts`.
  - Endpoints: `POST /api/auth/login`, `GET /api/auth/me`.
  - Validates credentials, generates JWT, returns user profile + role.

- **Customers**

  - `customerController.ts` / `customerService.ts`.
  - Endpoints: `GET /api/customers`, `GET /api/customers/:id`, `POST /api/customers`, `PUT /api/customers/:id`, `DELETE /api/customers/:id`.
  - Integrates pagination and search; enforces role restrictions on write ops.

- **Products**

  - `productController.ts` / `productService.ts`.
  - Full CRUD for products with category and pricing.

- **Quotes**

  - `quoteController.ts` / `quoteService.ts`.
  - Endpoints to manage quote lifecycle, including send and accept operations.

- **Orders**

  - `orderController.ts` / `orderService.ts`.
  - Endpoints for orders listing, details, creation, and status updates.

- **Inventory**

  - `inventoryController.ts` / `inventoryService.ts`.
  - Reads latest inventory snapshots and syncs new data.

- **Reports**

  - `reportController.ts` / `reportService.ts`.
  - Endpoints: sales summary and per‑customer sales history.

- **AI Integration**
  - `aiController.ts` / `aiService.ts`.
  - Backend endpoints used by the frontend:
    - `GET /api/ai/sales-forecast?customerId=...&months=6&forecastMonths=3`.
    - `GET /api/ai/recommendations?customerId=...`.
  - Orchestrates:
    - Fetching raw transactional data from Prisma.
    - Transforming it into the expected AI service input.
    - Calling the Python `ai-service`.
    - Returning unified JSON back to the frontend.

---

## Frontend – Detailed Capabilities

Frontend is a **React + TypeScript + Vite** SPA styled with **TailwindCSS**.

### Technology Stack

- **Build tool**: Vite.
- **Language**: TypeScript.
- **Routing**: React Router (in `routes/AppRoutes.tsx`).
- **State/Context**: React Context for Auth (`context/AuthContext.tsx`).
- **HTTP Client**: Axios with a shared client wrapper (`api/axiosClient.ts`).

### Layout & Shared Components

- `layout/AppLayout.tsx`

  - Main shell layout with sidebar + top bar.
  - Enforces that only authenticated users can access protected pages.

- `layout/Sidebar.tsx` and `layout/TopBar.tsx`

  - Navigation links for Dashboard, Customers, Quotes, Orders, Reports, AI Insights.
  - Shows current user / logout in the top bar.

- `components/ui/*`

  - `Button`, `Card`, `Input`, `Select`, `Table` components.
  - Provide consistent design system across the app.

- `components/charts/SalesForecastChart.tsx`
  - Renders combined historical + forecasted sales for the AI Insights feature using data provided by `aiApi.ts`.

### Pages & User Flows

- `LoginPage.tsx`

  - Handles email/password login via `authApi.ts`.
  - On success, stores JWT + user info in `AuthContext` and redirects to dashboard.

- `DashboardPage.tsx`

  - Overview metrics (e.g., counts of customers, quotes, orders) and quick links.
  - Can be extended to show role‑specific dashboards.

- `CustomersPage.tsx`

  - Lists customers with pagination and search.
  - Integrates with `customerApi.ts`.

- `CustomerDetailPage.tsx`

  - Shows full profile + sales history summary.
  - Embeds AI insights (forecast chart + recommendations) for that specific customer.

- `QuotesPage.tsx` and `NewQuotePage.tsx`

  - Allow listing, creating, and managing quotes.

- `OrdersPage.tsx` and `OrderDetailPage.tsx`

  - View all orders and individual order timelines/status.

- `ReportsPage.tsx`

  - Shows aggregated sales reports (customer/product/region grouping) using `reportApi.ts`.

- `AiInsightsPage.tsx`
  - Central place for AI‑driven insights.
  - Flow:
    1. Select a customer from a dropdown (populated from `customerApi.ts`).
    2. Fetch sales forecast via `aiApi.ts`.
    3. Render the `SalesForecastChart` with history + future prediction.
    4. Display list of recommended products with key attributes.

### API Layer (Frontend)

- **Shared Axios Client (`api/axiosClient.ts`)**

  - Configures base URL from `VITE_API_BASE_URL`.
  - Attaches auth token from `AuthContext` to each request.
  - Global error handling hooks (e.g., redirect to login on 401).

- **Domain‑Specific Clients**
  - `authApi.ts`: login, me.
  - `customerApi.ts`: customer listing, details, CRUD.
  - `productApi.ts`: product listing and details.
  - `quoteApi.ts`: quotes operations.
  - `orderApi.ts`: orders operations.
  - `inventoryApi.ts`: inventory endpoints.
  - `reportApi.ts`: sales summary and history.
  - `aiApi.ts`: sales forecast and recommendations.

---

## Prerequisites

- Node.js 18+ and npm.
- Python 3.10+ (for `ai-service`).
- Docker and Docker Compose (for PostgreSQL).
- Git.

---

## Setup Instructions (Current Monorepo)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd truethat
```

### 2. Install JS/TS Dependencies

From the root directory, install all Node dependencies for root, backend, and frontend:

```bash
npm run install:all
```

> See `package.json` at the root for the exact script, typically running `npm install` in `backend/` and `frontend/`.

### 3. Install Python Dependencies for AI Service

```bash
cd ai-service
python -m venv .venv
./.venv/Scripts/Activate.ps1
pip install -r requirements.txt
cd ..
```

### 4. Set Up Environment Variables

Copy `.env.example` to `.env` in the root directory:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and update values as needed:

```env
# Backend
DATABASE_URL=postgresql://vdss_user:vdss_password@localhost:5432/vdss
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=4000
NODE_ENV=development

# Frontend
VITE_API_BASE_URL=http://localhost:4000

# AI Service
AI_SERVICE_URL=http://localhost:8001
```

**Important**: Use a strong `JWT_SECRET` (minimum 32 characters) before any production deployment.

### 5. Start PostgreSQL Database

Start the PostgreSQL container using Docker Compose:

```bash
docker-compose up -d
```

Wait for the database to be ready (about 10–15 seconds).

### 6. Set Up Database (Prisma)

From the root (or `backend/`), generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Seed the database with initial data:

```bash
npm run prisma:seed
```

This creates sample data including users, customers, products, quotes, and orders.

### 7. Run AI Service

From the `ai-service` folder:

```bash
cd ai-service
./.venv/Scripts/Activate.ps1
uvicorn src.main:app --reload --host 0.0.0.0 --port 8001
```

Ensure `AI_SERVICE_URL` in `.env` matches the host/port used here.

### 8. Start Backend & Frontend

Start both backend and frontend in development mode from the root:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

- Backend API: `http://localhost:4000`
- Frontend SPA: `http://localhost:3000`

---

## Usage & End‑to‑End Flows

### Login

1. Open `http://localhost:3000` in your browser.
2. Login with one of the seeded accounts (see `backend/prisma/seed.ts` for exact emails; typical examples: `admin@vdss.com`, `manager@vdss.com`, etc.).

### Navigation

- **Dashboard** – overview with key metrics and quick links.
- **Customers** – manage customers and access AI insights per customer.
- **Quotes** – create, edit, send, and accept quotes.
- **Orders** – view and update order statuses.
- **Reports** – visualize sales summary and history.
- **AI Insights** – focused view for forecasting and recommendations.

### Testing the AI Features

1. Navigate to **AI Insights** in the sidebar.
2. Select a customer from the dropdown.
3. Inspect the **Sales Forecast** chart (history + predicted next months).
4. Review the **Recommended Products** section for cross‑sell ideas.

---

## Public API Endpoints (Backend)

These are the primary endpoints exposed by the Node backend.

### Authentication

- `POST /api/auth/login` – Login.
- `GET /api/auth/me` – Get current user.

### Customers

- `GET /api/customers` – List customers (pagination + search).
- `GET /api/customers/:id` – Get customer details.
- `POST /api/customers` – Create customer (`ADMIN`/`MANAGER`).
- `PUT /api/customers/:id` – Update customer (`ADMIN`/`MANAGER`).
- `DELETE /api/customers/:id` – Delete customer (`ADMIN`/`MANAGER`).

### Products

- `GET /api/products` – List products.
- `GET /api/products/:id` – Get product details.
- `POST /api/products` – Create product (`ADMIN`/`MANAGER`).
- `PUT /api/products/:id` – Update product (`ADMIN`/`MANAGER`).
- `DELETE /api/products/:id` – Delete product (`ADMIN`/`MANAGER`).

### Quotes

- `GET /api/quotes` – List quotes.
- `GET /api/quotes/:id` – Get quote details.
- `POST /api/quotes` – Create quote.
- `PUT /api/quotes/:id` – Update quote.
- `POST /api/quotes/:id/send` – Send quote.
- `POST /api/quotes/:id/accept` – Accept quote.

### Orders

- `GET /api/orders` – List orders.
- `GET /api/orders/:id` – Get order details.
- `POST /api/orders` – Create order.
- `PUT /api/orders/:id/status` – Update order status.

### Inventory

- `GET /api/inventory` – Get latest inventory for all products.
- `GET /api/inventory/:productId` – Get inventory for a product.
- `POST /api/inventory/sync` – Sync inventory (`ADMIN`/`MANAGER`).

### Reports

- `GET /api/reports/sales/summary` – Get sales summary (groupBy: customer/product/region).
- `GET /api/reports/sales/customer/:customerId` – Get customer sales history.

### AI (Backend Facade)

- `GET /api/ai/sales-forecast?customerId=...&months=6&forecastMonths=3` – Get sales forecast.
- `GET /api/ai/recommendations?customerId=...` – Get product recommendations.

---

## Database Schema (High Level)

The system uses **Prisma ORM** with PostgreSQL. Core models defined in `backend/prisma/schema.prisma` include:

- **User** – Authentication and user management with roles and hashed passwords.
- **Customer** – Customer profile data and segmentation fields.
- **Product** – Product catalog with pricing and category info.
- **Quote** – Quotes with status and associated line items.
- **Order** – Orders with lifecycle status tracking.
- **InventorySnapshot** – Time‑stamped inventory snapshots per product.
- **SalesSummary** – Aggregated sales data to support reports and AI.

---

## AI Design Notes

- Purely **self‑contained AI**: no external AI/ML APIs required (no OpenAI, etc.).
- Algorithms are intentionally **transparent and explainable** (moving averages, linear trends, rule‑based recommendations) so that business users can understand and trust the outputs.
- Separation of concerns: Node backend focuses on business rules + security, Python AI service focuses on data processing and modeling.

---

## Scripts

### Root Level

- `npm run dev` – Run both backend and frontend (and potentially orchestrate AI service depending on your script wiring).
- `npm run dev:backend` – Run backend only.
- `npm run dev:frontend` – Run frontend only.
- `npm run install:all` – Install dependencies in root, backend, and frontend.
- `npm run prisma:generate` – Generate Prisma client.
- `npm run prisma:migrate` – Run database migrations.
- `npm run prisma:seed` – Seed the database.

### Backend

- `npm run dev` – Start development server (ts-node-dev).
- `npm run build` – Build for production.
- `npm run start` – Start production server.
- `npm run prisma:generate` – Generate Prisma client.
- `npm run prisma:migrate` – Run migrations.
- `npm run prisma:seed` – Seed database.
- `npm run prisma:studio` – Open Prisma Studio (interactive DB UI).

### Frontend

- `npm run dev` – Start Vite dev server.
- `npm run build` – Build production bundle.
- `npm run preview` – Preview production build locally.

---

## Troubleshooting

### Database Connection Issues

- Ensure Docker is running and PostgreSQL container is up: `docker-compose ps`.
- Check `DATABASE_URL` in `.env` matches `docker-compose.yml`.
- Try restarting the container: `docker-compose restart`.

### Port Already in Use

- Backend uses port `4000`, frontend uses port `3000`, AI service typically uses port `8001`.
- Change ports in `.env` and `vite.config.ts` / backend config if needed.

### Prisma Errors

- Run `npm run prisma:generate` after schema changes.
- Ensure migrations are up to date: `npm run prisma:migrate`.

### Build or TypeScript Errors

- Remove `node_modules` and reinstall:

```bash
rm -rf node_modules
npm install
```

- Check Node.js version (18+ recommended).

---

## Production Deployment Checklist

Before deploying to production:

1. Update all environment variables in `.env` (including `AI_SERVICE_URL`).
2. Set `NODE_ENV=production` on backend.
3. Use a strong `JWT_SECRET` (32+ characters).
4. Build frontend: `cd frontend && npm run build`.
5. Build backend: `cd backend && npm run build`.
6. Set up a production PostgreSQL database.
7. Run migrations and seed data.
8. Run the Node backend behind a process manager (PM2, systemd, etc.).
9. Serve frontend build via nginx or another static file server.
10. Deploy and supervise the Python AI service alongside the backend.

---

## License

This project is created for educational/demonstration purposes.

---

## Support

For issues or questions, please check the codebase or create an issue in the repository.
