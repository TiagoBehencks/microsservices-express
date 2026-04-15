# Microservices Elysia

A modern microservices architecture built with **Bun** + **Elysia.js**, featuring gRPC for internal communication, RabbitMQ for event-driven messaging, and HTTP for the API Gateway.

## Architecture Overview

```
                                        ┌─────────────────────────────────────────────────────────────┐
                                        │                        INTERNET                             │
                                        └─────────────────────────────┬───────────────────────────────┘
                                                                      │
                                                                      ▼
                                        ┌─────────────────────────────────────────────────────────────┐
                                        │                       API GATEWAY                           │
                                        │                    (Port 3000 - HTTP)                       │
                                        │                      Elysia.js                              │
                                        └─────────────────────────────┬───────────────────────────────┘
                                                                      │
                              ┌───────────────────────────────────────┼───────────────────────────────────────┐
                              │                                       │                                       │
                              ▼                                       ▼                                       ▼
              ┌───────────────────────────┐               ┌──────────────────────────┐              ┌──────────────────┐
              │     PRODUCT SERVICE       │               │      ORDER SERVICE       │              │ (routes to       │
              │       (Port 3001)         │     gRPC      │        (Port 3002)       │              │  services above) │
              │         (gRPC: 4001)      │◄─────────────►│                          │              └──────────────────┘
              │         Elysia.js         │               │        Elysia.js         │
              │         Bun + Drizzle     │               │        Bun + Drizzle     │
              │         PostgreSQL        │               │        PostgreSQL        │
              └───────────────────────────┘               └────────────┬─────────────┘
                                                                       │
                                                                       │ Publish
                                                                       │ order.created
                                                                       ▼
                                          ┌────────────────────────────────────────────────────┐
                                          │                       MESSAGE BROKER               │
                                          │                    RabbitMQ (Port 5672)            │
                                          │                RabbitMQ UI (Port 15672)            │
                                          │                  • order.created queue             │
                                          └────────────┬──────────────────────────┬────────────┘
                                                       │                          │
                                                       │ Consume                  │ Other
                                                       │ order.created            │ consumers
                                                       ▼                          ▼
                                  ┌───────────────────────────────────────────────────────────┐
                                  │           NOTIFICATION SERVICE (Port 3003)                │
                                  │                    Elysia.js                              │
                                  │               Bun + amqplib                               │
                                  │  • Consumes order.created events                          │
                                  │  • Sends email confirmations                              │
                                  └───────────────┬───────────────────────────────────────────┘
                                                  │
                                                  │ Reads/Writes
                                                  ▼
                                  ┌───────────────────────────────────────────────────────────┐
                                  │                    POSTGRESQL                             │
                                  │                   (Port 5432)                             │
                                  │                                                           │
                                  │  • product-service DB (products, inventory)               │
                                  │  • order-service DB (orders)                              │
                                  └───────────────────────────────────────────────────────────┘
```

## Services

### API Gateway

| Property       | Value                                      |
| -------------- | ------------------------------------------ |
| Port           | 3000                                       |
| Technology     | Bun + Elysia.js                            |
| Purpose        | Single entry point for all client requests |
| Responsibility | Route requests to appropriate services     |

### Product Service

| Property         | Value                                    |
| ---------------- | ---------------------------------------- |
| HTTP Port        | 3001                                     |
| gRPC Port        | 4001                                     |
| Technology       | Bun + Elysia.js + Drizzle ORM            |
| Database         | PostgreSQL                               |
| Purpose          | Manage products and inventory            |
| Responsibilities | CRUD products, check stock, reduce stock |

### Order Service

| Property         | Value                               |
| ---------------- | ----------------------------------- |
| Port             | 3002                                |
| Technology       | Bun + Elysia.js + Drizzle ORM       |
| Database         | PostgreSQL                          |
| Purpose          | Process and manage orders           |
| Responsibilities | Create orders, publish order events |

### Notification Service

| Property         | Value                                          |
| ---------------- | ---------------------------------------------- |
| Port             | 3003                                           |
| Technology       | Bun + Elysia.js + amqplib                      |
| Purpose          | Send notifications to customers                |
| Responsibilities | Consume order events, send email confirmations |

## Communication Patterns

### 1. HTTP (Synchronous)

```
┌─────────┐     HTTP      ┌─────────────────┐
│  Client │ ───────────►  │  API Gateway    │
└─────────┘               │   (Elysia)      │
                          └────────┬────────┘
                                   │ HTTP
                          ┌────────▼────────┐
                          │  Product/Order  │
                          │    Services     │
                          └─────────────────┘
```

### 2. gRPC (Internal Service-to-Service)

```
┌─────────────────┐                    ┌─────────────────┐
│  ORDER SERVICE  │                    │ PRODUCT SERVICE │
│                 │     gRPC           │                 │
│  ┌───────────┐  │ ◄────────────────► │  ┌───────────┐  │
│  │gRPC Client│──┼────────────────────┼──│gRPC Server│  │
│  └───────────┘  │                    │  └───────────┘  │
└─────────────────┘                    └─────────────────┘

Services:
  • GetProduct    - Retrieve product details
  • CheckStock    - Verify product availability
  • ReduceStock   - Decrease product quantity
```

### 3. RabbitMQ (Event-Driven / Async)

```
┌─────────────────┐     Publish      ┌────────────────┐     Consume    ┌───────────────────┐
│  ORDER SERVICE  │ ──────────────►  │  order.created │ ─────────────► │ NOTIFICATION SVC  │
│                 │   on new order   │    (Queue)     │                │                   │
│                 │                  └────────────────┘                │  • Email confirm  │
│                 │                                                    │  • Order alerts   │
└─────────────────┘                                                    └───────────────────┘
```

## Flow Diagrams

### Create Order Flow

```
┌────────┐     POST /orders      ┌────────────┐      gRPC       ┌───────────┐
│ Client │ ─────────────────────►│   API GW   │───────────────► │ Product   │
└────────┘                       └─────┬──────┘  CheckStock     │ Service   │
                                       │                        └───────────┘
                                       │ HTTP
                                       ▼
                               ┌──────────────┐
                               │Order Service │
                               │  • Validate  │
                               │  • Create    │
                               │  • Publish   │
                               └──────┬───────┘
                                      │ Publish
                                      │ order.created
                                      ▼
                               ┌──────────────┐
                               │  RabbitMQ    │
                               │  Queue       │
                               └──────┬───────┘
                                      │ Consume
                                      ▼
                               ┌──────────────┐
                               │ Notification │
                               │   Service    │
                               │  • Email     │
                               └──────────────┘
```

## Technologies

### Runtime & Framework

| Technology    | Version | Purpose                  |
| ------------- | ------- | ------------------------ |
| **Bun**       | 1.x     | Fast JavaScript runtime  |
| **Elysia.js** | 1.x     | Ergonomic HTTP framework |

### Databases

| Technology     | Purpose                       |
| -------------- | ----------------------------- |
| **PostgreSQL** | Primary database for services |

### ORM

| Technology      | Purpose                    |
| --------------- | -------------------------- |
| **Drizzle ORM** | Type-safe database queries |

### Communication

| Technology   | Purpose                                    |
| ------------ | ------------------------------------------ |
| **gRPC**     | Fast, typed internal service communication |
| **RabbitMQ** | Message broker for async events            |
| **amqplib**  | RabbitMQ client                            |

### Infrastructure

| Technology         | Purpose                       |
| ------------------ | ----------------------------- |
| **Docker**         | Containerization              |
| **Docker Compose** | Multi-container orchestration |

### Code Quality

| Technology           | Purpose                |
| -------------------- | ---------------------- |
| **TypeScript**       | Type safety            |
| **Protocol Buffers** | gRPC schema definition |

## Prerequisites

- [Bun](https://bun.sh/) v1.x
- [Docker](https://www.docker.com/) & Docker Compose
- [Protocol Buffers](https://protobuf.dev/) compiler (optional, for gRPC)

## Getting Started

### 1. Clone & Setup Environment

```bash
git clone <repository-url>
cd microsservices-elysia

# Copy environment files (already configured)
```

### 2. Start Infrastructure

```bash
docker compose up -d postgres rabbitmq
```

### 3. Start Services

```bash
# Terminal 1 - Product Service
cd product-service && bun run src/main.ts

# Terminal 2 - Order Service
cd order-service && bun run src/main.ts

# Terminal 3 - Notification Service
cd notification-service && bun run src/main.ts

# Terminal 4 - API Gateway
cd api-gateway && bun run src/main.ts
```

### 4. Or Use Docker Compose (All at once)

```bash
docker compose up -d
```

## API Endpoints

### API Gateway (Port 3000)

| Method | Endpoint    | Description       |
| ------ | ----------- | ----------------- |
| GET    | `/`         | Health check      |
| GET    | `/products` | List all products |
| GET    | `/orders`   | List all orders   |
| POST   | `/orders`   | Create new order  |

### Product Service (Port 3001)

| Method | Endpoint        | Description       |
| ------ | --------------- | ----------------- |
| GET    | `/`             | Health check      |
| GET    | `/products`     | List all products |
| GET    | `/products/:id` | Get product by ID |
| POST   | `/products`     | Create product    |

### Order Service (Port 3002)

| Method | Endpoint      | Description     |
| ------ | ------------- | --------------- |
| GET    | `/`           | Health check    |
| GET    | `/orders`     | List all orders |
| GET    | `/orders/:id` | Get order by ID |
| POST   | `/orders`     | Create order    |

### Notification Service (Port 3003)

| Method | Endpoint | Description  |
| ------ | -------- | ------------ |
| GET    | `/`      | Health check |

## Testing the Flow

```bash
# 1. Create a product
curl -X POST http://localhost:3001/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","price":999.99,"quantity":10}'

# 2. Create an order (triggers notification)
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"productId":"1","quantity":1,"customerEmail":"customer@example.com"}'

# 3. Check notifications in RabbitMQ UI
# http://localhost:15672 (guest/guest)
```

## Project Structure

```
microsservices-elysia/
├── api-gateway/           # HTTP entry point
│   ├── src/
│   │   └── main.ts
│   ├── Dockerfile.gateway
│   └── package.json
│
├── product-service/       # Product management
│   ├── src/
│   │   ├── adapters/     # gRPC handlers
│   │   ├── application/  # Use cases
│   │   ├── domain/       # Entities & mappers
│   │   ├── infrastructure/ # Repository implementations
│   │   └── main.ts
│   ├── proto/            # Protocol Buffers
│   ├── Dockerfile.product
│   └── package.json
│
├── order-service/        # Order processing
│   ├── src/
│   │   ├── application/ # Use cases
│   │   ├── domain/       # Entities & mappers
│   │   ├── infrastructure/ # Repository implementations
│   │   ├── rabbitmq.ts   # RabbitMQ connection
│   │   ├── grpc-client.ts # gRPC client
│   │   └── main.ts
│   ├── proto/            # Protocol Buffers
│   ├── Dockerfile.order
│   └── package.json
│
├── notification-service/ # Email notifications
│   ├── src/
│   │   ├── consumer.ts   # RabbitMQ consumer
│   │   └── main.ts
│   ├── Dockerfile.notification
│   └── package.json
│
├── proto/                # Shared proto definitions
│   └── products.proto
│
├── docker-compose.yml    # Container orchestration
└── README.md
```

## Design Patterns

- **Clean Architecture**: Separation of concerns (Domain, Application, Infrastructure)
- **Repository Pattern**: Data access abstraction
- **Event-Driven Architecture**: Async communication via RabbitMQ
- **Microservices**: Independent deployable services
- **gRPC**: Type-safe internal communication

## Monitoring

### RabbitMQ Management UI

- URL: http://localhost:15672
- Credentials: `guest` / `guest`

### Health Checks

```bash
curl http://localhost:3000  # API Gateway
curl http://localhost:3001  # Product Service
curl http://localhost:3002  # Order Service
curl http://localhost:3003  # Notification Service
```

## License

MIT
