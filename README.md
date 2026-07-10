# 🏨 Booking Platform REST API

A production-ready REST API for managing services and customer bookings. Built with **NestJS**, **TypeORM**, and **SQLite**.

## ✨ Features

- **Authentication** – JWT-based registration, login, and token refresh
- **Service Management** – CRUD operations with owner-only authorization
- **Booking Management** – Public booking creation with full business rules
- **Status Workflow** – Enforced state transitions (`PENDING → CONFIRMED → COMPLETED`, cancel anytime)
- **Duplicate Prevention** – Blocks duplicate bookings for the same service/date/time
- **Pagination & Search** – Paginated listing with search and status filters
- **API Documentation** – Full Swagger/OpenAPI UI at `/api/docs`
- **Error Handling** – Consistent error responses with validation details
- **Docker Support** – Ready-to-use Docker and Docker Compose setup

## 🛠 Tech Stack

| Technology       | Purpose                  |
| ---------------- | ------------------------ |
| NestJS 11        | Framework                |
| TypeScript 5     | Language                 |
| TypeORM 0.3      | ORM                      |
| SQLite           | Database (development)   |
| Passport.js      | Authentication           |
| JWT              | Token-based auth         |
| bcrypt           | Password hashing         |
| Swagger/OpenAPI  | API documentation        |
| class-validator  | Input validation         |

## 📋 Prerequisites

- **Node.js** v18 or higher (v22+ recommended)
- **npm** v9 or higher

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <repo-url>
cd booking-platform-api
npm install
```

### 2. Environment Variables

Copy the example env file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database (SQLite for development)
DATABASE_URL=sqlite:./data/booking.db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRATION=7d

# App
PORT=3000
NODE_ENV=development
```

### 3. Run the App

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at **http://localhost:3000**.

### 4. API Documentation

Open your browser to **http://localhost:3000/api/docs** for the interactive Swagger UI.

Use the "Authorize" button to enter your JWT token after logging in.

## 📡 API Endpoints

### Authentication (`/auth`)

| Method | Endpoint             | Auth     | Description                  |
| ------ | -------------------- | -------- | ---------------------------- |
| POST   | `/auth/register`     | Public   | Register a new user          |
| POST   | `/auth/login`        | Public   | Login and receive JWT tokens |
| POST   | `/auth/refresh`      | Public   | Refresh access token         |

### Users (`/users`)

| Method | Endpoint         | Auth  | Description               |
| ------ | ---------------- | ----- | ------------------------- |
| GET    | `/users/profile` | JWT   | Get current user profile  |
| PATCH  | `/users/profile` | JWT   | Update current user       |

### Services (`/services`)

| Method | Endpoint         | Auth   | Description                        |
| ------ | ---------------- | ------ | ---------------------------------- |
| POST   | `/services`      | JWT    | Create a new service               |
| GET    | `/services`      | Public | List all active services           |
| GET    | `/services/:id`  | Public | Get service by ID                  |
| PATCH  | `/services/:id`  | JWT    | Update service (owner only)        |
| DELETE | `/services/:id`  | JWT    | Soft-delete service (owner only)   |

### Bookings (`/bookings`)

| Method | Endpoint               | Auth   | Description                        |
| ------ | ---------------------- | ------ | ---------------------------------- |
| POST   | `/bookings`            | Public | Create a new booking               |
| GET    | `/bookings`            | JWT    | List bookings (paginated)          |
| GET    | `/bookings/:id`        | JWT    | Get booking by ID                  |
| PATCH  | `/bookings/:id/status` | JWT    | Update booking status              |
| DELETE | `/bookings/:id`        | JWT    | Cancel a booking                   |

### Query Parameters

**GET /services**
- `?search=hair` – Search by title
- `?isActive=true` – Filter by active status

**GET /bookings**
- `?page=1&limit=10` – Pagination
- `?search=John` – Search by customer name
- `?status=CONFIRMED` – Filter by status

## 📦 Project Structure

```
src/
├── auth/                    # Authentication module
│   ├── dto/                 # Request DTOs
│   ├── guards/              # JWT auth guard
│   ├── strategies/          # JWT strategy
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/                   # User management
│   ├── dto/
│   ├── entities/            # User entity
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── services/                # Service management
│   ├── dto/
│   ├── entities/            # Service entity
│   ├── services.controller.ts
│   ├── services.service.ts
│   └── services.module.ts
├── bookings/                # Booking management
│   ├── dto/
│   ├── entities/            # Booking entity
│   ├── bookings.controller.ts
│   ├── bookings.service.ts
│   └── bookings.module.ts
├── common/                  # Shared resources
│   ├── decorators/          # @CurrentUser, @Public
│   ├── filters/             # Global exception filter
│   ├── interceptors/        # Response transformer
│   └── common.module.ts
├── config/                  # Configuration
├── app.module.ts            # Root module
└── main.ts                  # Entry point
```

## 🧪 Running Tests

```bash
# Unit tests
npm test

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## 🐳 Docker (Bonus)

### SQLite (lightweight)

```bash
docker build -t booking-api .
docker run -p 3000:3000 booking-api
```

### PostgreSQL (production-ready)

```bash
docker-compose up -d
```

> **Note:** When using Docker Compose, switch to PostgreSQL by updating the `DATABASE_URL` in `docker-compose.yml`.

## 🔐 Business Rules

### Booking Status Workflow

```
PENDING ──→ CONFIRMED ──→ COMPLETED
    │                        │
    └────→ CANCELLED ←───────┘
```

- `CANCELLED` bookings cannot be marked as `COMPLETED`
- `COMPLETED` bookings cannot be changed
- Only `PENDING → CONFIRMED → COMPLETED` forward flow
- Any status can jump to `CANCELLED` (except `COMPLETED`)

### Validation Rules

- Booking dates **must be in the future**
- Bookings require an **existing, active service**
- Duplicate bookings for the same **service + date + time** are blocked
- Services can only be modified by their **owner**

## 🤔 Assumptions

1. Soft delete for services (mark `isActive = false`) rather than hard deletion
2. Bookings are public (no authentication required to create one)
3. UUIDs for primary keys across all entities
4. SQLite for development ease; PostgreSQL for production via Docker Compose

## 🚧 Future Improvements

- [ ] Rate limiting on public endpoints
- [ ] Email notifications for booking confirmations
- [ ] Admin role with elevated permissions
- [ ] File uploads for service images
- [ ] Real-time booking availability calendar
- [ ] Webhooks for external integrations
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Redis caching for frequently accessed services
- [ ] Comprehensive unit and integration tests

## 📄 License

MIT
