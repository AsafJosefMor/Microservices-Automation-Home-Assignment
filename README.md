# Microservices App

A demo microservices TypeScript application and tests showcasing a simple **Auth**, **User**, **Order**, and **Gateway** architecture with Redis Pub/Sub and PostgreSQL persistence. JWT-based authentication is handled by the Auth service; User and Order services expose business logic; and the Gateway proxies requests (enforcing auth) to the appropriate backend.

Tests (using Jest):
1. E2E
   * Authenticate via the Auth Service to get a JWT token
   * Create a user
   * Create an order for that user
   * Retrieve the user and their orders
2. Test Redis MQ event flow for an order

---

## Configuration & Environment Variables
Create `.env`:
```
PORT_AUTH=3000
PORT_USER=3001
PORT_ORDER=3002
PORT_GATEWAY=3003

AUTH_SERVICE_URL=http://auth-service:3000
USER_SERVICE_URL=http://user-service:3001
ORDER_SERVICE_URL=http://order-service:3002
GATEWAY_URL=http://gateway-service:3003

DATABASE_URL=postgres://postgres:postgres@postgres:5432/appdb
JWT_SECRET=super_secret_key
REDIS_URL=redis://redis:6379
```
---
## Running the application
```
docker compose up --build
```

---

## Running the application with tests
```
docker compose -f docker-compose.yml -f docker-compose.test.yml up --build --abort-on-container-exit --exit-code-from test-runner
```

---

## Endpoints Overview
#### Auth:
   - POST /login
   - GET /validate

#### User:
  - POST /users
  - GET /users/:userId

#### Order:
- POST /orders
- GET /orders/user/:userId

#### Gateway (Auth required except /login,/health):
- POST /login
- POST /users
- GET /users/:userId
- POST /orders
- GET /orders/user

---

## Architecture & Folder Layout
```
.
├── db/
│   └── init/
│       ├── 01_create_users.sql
│       └── 02_create_orders.sql
├── services/
│   ├── auth-service/
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── authController.ts
│   │       ├── authSchemas.ts
│   │       ├── index.ts
│   │       └── jwt.ts
│   ├── user-service/
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── index.ts
│   │       ├── user.repo.ts
│   │       ├── userSchema.ts
│   │       └── userService.ts
│   ├── order-service/
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── index.ts
│   │       ├── order.repo.ts
│   │       ├── orderSchema.ts
│   │       └── Order.ts
│   └── gateway-service/
│       ├── Dockerfile
│       └── src/
│           ├── authMiddleware.ts
│           └── index.ts
├── services/common/
│   ├── config.ts
│   ├── redisClient.ts
│   └── endpoints.ts
├── tests/
│   ├── e2e/
│   │   └── gateway.spec.ts
│   └── utils/
│       └── config.ts
├── docker-compose.yml
├── docker-compose.test.yml
├── .env
└── README.md
```