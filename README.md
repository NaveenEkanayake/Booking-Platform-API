# EN2H Booking Platform

A self-contained, production-ready Booking Platform REST API and interactive Single Page Application (SPA) built with **NestJS** (backend) and **React + Tailwind CSS + Lucide Icons** (frontend).

## Overview

This application serves as a complete booking management system with three access boundaries:

1. **Guest Customer (Unauthenticated)**: Can view the public service catalog and submit booking requests without an account.
2. **Registered Customer (Authenticated - CUSTOMER role)**: Can register/login via the Client Login gateway, view active services, book time slots (auto-linked to their profile), view their booking history, and cancel their own bookings.
3. **Platform Administrator (Authenticated - ADMIN role)**: Can login via the Staff Portal, perform CRUD operations on services, toggle service activation, view all site-wide bookings via a Master Booking Board (with search, status filters, and pagination), and confirm, complete, or cancel bookings.

---

## Project Structure

```
en2h-booking-platform/
├── .gitignore
├── README.md
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── common/
│   │   │   ├── filters/
│   │   │   │   └── http-exception.filter.ts
│   │   │   ├── decorators/
│   │   │   │   └── roles.decorator.ts
│   │   │   └── guards/
│   │   │       └── roles.guard.ts
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── user.entity.ts
│   │   │   └── dto/
│   │   │       ├── register.dto.ts
│   │   │       └── login.dto.ts
│   │   ├── services/
│   │   │   ├── services.module.ts
│   │   │   ├── services.service.ts
│   │   │   ├── services.controller.ts
│   │   │   ├── service.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-service.dto.ts
│   │   │       └── update-service.dto.ts
│   │   └── bookings/
│   │       ├── bookings.module.ts
│   │       ├── bookings.service.ts
│   │       ├── bookings.controller.ts
│   │       ├── booking.entity.ts
│   │       └── dto/
│   │           ├── create-booking.dto.ts
│   │           ├── update-booking-status.dto.ts
│   │           └── booking-query.dto.ts
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        └── index.css
```

---

## Installation & Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) (included with Node.js)

### 1. Clone & Install Dependencies

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

---

## Environment Variables

Create a `.env` file at the project root (or set these in your environment):

```env
JWT_SECRET=super-secret-jwt-key-for-local-development-12345
PORT=3001
```

---

## Database Setup

This project uses **SQLite** via **TypeORM** — no external database required.

- The SQLite database file (`database.sqlite`) is created automatically in the project root directory on first run.
- Schema synchronization is automatic (`synchronize: true`), so tables are created/updated on startup.

### Default Admin Account

On first boot, the system automatically seeds an administrator account:

| Email               | Password  | Role  |
|---------------------|-----------|-------|
| admin@entwoh.com    | admin123  | ADMIN |

---

## Running the Application

### Backend (API Server)

```bash
cd backend
npm run dev
```

The backend runs on `http://localhost:3001`.

### Frontend (SPA Client)

```bash
cd frontend
npm run dev
```

The frontend runs on `http://localhost:5173` (or the next available port).  
API requests are proxied to the backend automatically via Vite's proxy configuration.

---

## API Documentation

Interactive Swagger OpenAPI documentation is available when the backend is running:

- **URL**: `http://localhost:3001/api/docs`
- **Auth**: Click the `Authorize` button and paste your JWT `accessToken` to test protected endpoints.

### Available Endpoints

| Method | Endpoint                              | Auth     | Role     | Description                      |
|--------|---------------------------------------|----------|----------|----------------------------------|
| POST   | `/api/auth/register`                  | Public   | -        | Register a new customer          |
| POST   | `/api/auth/login`                     | Public   | -        | Login (returns JWT + user info)  |
| GET    | `/api/services/public`                | Public   | -        | View active services             |
| POST   | `/api/services`                       | Bearer   | ADMIN    | Create a service                 |
| GET    | `/api/services`                       | Bearer   | ADMIN    | List all services                |
| GET    | `/api/services/:id`                   | Bearer   | ADMIN    | Get service details              |
| PATCH  | `/api/services/:id`                   | Bearer   | ADMIN    | Update a service                 |
| DELETE | `/api/services/:id`                   | Bearer   | ADMIN    | Delete a service                 |
| POST   | `/api/bookings`                       | Public*  | -        | Submit a booking (guest or auth) |
| GET    | `/api/bookings/my-bookings`           | Bearer   | CUSTOMER | View personal booking history    |
| PATCH  | `/api/bookings/:id/cancel-my-booking` | Bearer   | CUSTOMER | Cancel own booking               |
| GET    | `/api/bookings`                       | Bearer   | ADMIN    | Master booking board (paginated) |
| PATCH  | `/api/bookings/:id/status`            | Bearer   | ADMIN    | Update booking status            |

*\* POST /api/bookings optionally accepts a Bearer token to auto-link the booking to a logged-in customer.*

---

## Business Rules

1. **Service validation**: Bookings must reference an existing, active service.
2. **Past dates**: Booking date cannot be in the past.
3. **Double booking prevention**: A service cannot be double-booked for the same date and time when the status is `CONFIRMED` (throws `ConflictException`).
4. **Status transitions**: Cancelled bookings cannot be changed to any other status. Completed bookings cannot be changed.
5. **Global error format**: All errors return `{ statusCode, timestamp, error: { message } }`.

---

## Tech Stack

### Backend
- **Runtime**: Node.js with NestJS
- **Language**: TypeScript
- **Database**: SQLite via TypeORM
- **Auth**: JWT (passport-jwt) + bcrypt
- **Validation**: class-validator + class-transformer
- **API Docs**: Swagger / OpenAPI

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State**: React hooks (no external state library)

---

## Developer CLI Scripts

We have added helper scripts to make testing and resetting the platform easy:

1. **Clear Test Data**:
   Remove all test services, customer bookings, and test users from the database, leaving it clean and fresh (the admin account will be automatically seeded on the next application run).
   ```bash
   npm run db:clear
   ```

2. **Generate JWT Token**:
   Generate a valid JWT Bearer token for testing API endpoints in Swagger/Postman directly without registering or logging in.
   ```bash
   # Default generates an ADMIN token for admin@entwoh.com
   npm run jwt:generate
   
   # Generate a CUSTOMER token for a custom user
   npm run jwt:generate -- --role CUSTOMER --email user@example.com --name "Jane Doe"
   ```

## Customized Features & UX Improvements

To provide a premium and secure user experience, several customized features have been added:

1. **Auto-Redirect & Secured Gateway**:
   - Guests cannot view or access the client portal or service scheduling layout. 
   - Unauthenticated visitors are automatically directed to a larger, centered login/registration card inside the main page.
   - Login input fields contain clean icon alignments (`User` for name, `Mail` for email, `Lock` for password).

2. **Custom Modal Confirmations**:
   - Native browser dialogs (`window.prompt` and `window.confirm`) have been completely replaced with custom overlays.
   - Modals use tailwind glassmorphic styling, complete with hover transition effects and standard close (`X`) buttons.

3. **Booking Cancellation Reasons**:
   - When a customer cancels their booking or an administrator changes status to `CANCELLED`, they are presented with a custom cancellation dialog box to supply a reason.
   - Cancellation reasons are saved in the database under `cancellationReason` column and rendered under the status badges on client and staff boards.

---

## Docker Containerization (Local Run)

The application has been dockerized for local deployment with multi-stage builds and Nginx proxying for the Vite React SPA:

### 1. Start using Docker Compose
```bash
docker-compose up --build
```

- **Backend / Swagger Documentation**: Available at `http://localhost:3001` and `http://localhost:3001/api/docs`
- **Frontend SPA**: Available at `http://localhost:5173`
- **Database Persistence**: SQLite database is automatically persisted inside a named docker volume `sqlite-data`.

---

## Vercel Deployment

Both the Frontend and Backend can be deployed to Vercel as two separate projects linked to your repository:

### 1. Backend Deployment (NestJS Serverless Function)
Vercel hosts the backend as serverless functions.
- **Root Directory**: `backend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `DATABASE_URL`: A PostgreSQL connection string (e.g., from Neon or Supabase). Required as local SQLite files are read-only and transient on Vercel.
  - `JWT_SECRET`: A secure random secret key.

### 2. Frontend Deployment (Vite SPA)
Vercel hosts the frontend as a static SPA.
- **Root Directory**: `frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: Set to your Vercel backend URL (e.g., `https://en2h-backend.vercel.app`).

---

## Assumptions & Design Choices

1. **Self-contained DB**: SQLite was chosen for zero-config setup — no external database server needed.
2. **State-based SPA routing**: The frontend uses conditional rendering (state-based views) instead of a routing library, keeping dependencies minimal.
3. **CORS**: Configured to allow `http://localhost:5173` for local development.
4. **JWT fallback**: A fallback secret key is compiled in for development convenience; production deployments should set `JWT_SECRET` via environment variable.
5. **No ORM migrations**: `synchronize: true` in TypeORM automatically keeps the schema in sync with entities.

---

## Future Improvements

1. **Email notifications**: Trigger emails on booking confirmation and status changes.
2. **Availability calendar**: Show available time slots based on existing bookings and service durations.
3. **Password strength**: Increase bcrypt salt rounds to 12 for production.
4. **Rate limiting**: Add throttling to public endpoints to prevent abuse.
5. **Pagination improvements**: Add sort options and advanced filtering to the admin booking board.
6. **Unit & e2e tests**: Add comprehensive test coverage.
