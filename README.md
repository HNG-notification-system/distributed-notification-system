# Distributed Notification System

 Monorepo for the Distributed Notification System: a production-ready, microservice-based notification platform that supports email and push channels, template management, user preferences, idempotency, retries, circuit breakers, and observability. Designed for Microservices & Message Queues with a deployable reference implementation.

* * *

## Table of contents


1.  Project overview
    
2.  Architecture & data flow
    
3.  Services (what’s included)
    
4.  Message formats & queues
    
5.  Repository layout
    
6.  Environment variables (by service)
    
7.  Running the system (docker-compose)
    
8.  API reference — key endpoints & examples
    
9.  Resiliency patterns & operational behaviour
    
10.  Scaling, performance & production considerations
    
11.  Testing & CI/CD
    
12.  Monitoring & observability
    
13.  Troubleshooting guide
    
14.  Contributing
    
15.  License & maintainers
    

* * *

# Project overview


This repository contains a small ecosystem of services that together implement a robust notification platform:

*   **API Gateway** — single secure ingress for notification requests; validates, enriches, enqueues.
    
*   **User Service** — stores users, preferences, device tokens.
    
*   **Template Service** — stores templates, versions, renders variables.
    
*   **Email Service** — consumes `email.queue`, renders templates, sends email via SMTP/SendGrid/Mailgun.
    
*   **Push Service** — consumes `push.queue`, sends web/mobile push (VAPID / FCM / OneSignal).
    
*   Shared infra: **RabbitMQ** (message broker), **Redis** (cache, idempotency, status store), **PostgreSQL** for persistent storage per service.
    

**Goals:**

*   Asynchronous delivery via RabbitMQ
    
*   Idempotency (prevent duplicate sends)
    
*   Exponential-backoff retries + Dead Letter Queue
    
*   Circuit breaker for fragile external dependencies
    
*   Traceability via correlation IDs and status tracking
    

* * *

# Architecture & data flow

# 

High-level flow:

```
Client   └─ POST /notifications  ---> API Gateway (validation, idempotency, enrich)                                 └─ Publish to RabbitMQ exchange: notifications.direct                                    ├─ routingKey=email  -> email.queue  -> Email Service consumer                                    ├─ routingKey=push   -> push.queue   -> Push Service consumer                                    └─ failed.queue      -> Dead Letter Queue (DLQ)
````

Synchronous lookups (gateway → user/template services) are done via internal HTTP with caching (Redis). Status and process metadata are stored in Redis for fast reads (e.g., `GET /notifications/:id/status`).

* * *

# Services (what’s included)

## 1\. API Gateway



*   **Tech**: NestJS
    
*   Responsibilities:
    
    *   Accept `POST /notifications` (validated by `CreateNotificationDto`)
        
    *   Idempotency check with Redis (by `id`)
        
    *   Fetch user preferences from User Service (cache results)
        
    *   Enrich payload (email address, push tokens)
        
    *   Publish to RabbitMQ exchange `notifications.direct` with routing key (`email`/`push`)
        
    *   Provide status endpoint `GET /notifications/:id/status`
        
    *   Rate limiting (`@nestjs/throttler`) and circuit-breaker utilities
        
    *   Swagger UI `/api`
        

## 2\. User Service



*   **Tech**: FastAPI (Python)
    
*   Responsibilities:
    
    *   Manage users, preferences, device tokens
        
    *   PostgreSQL storage + Redis caching
        
    *   Endpoints for CRUD: `/api/v1/users`, `/api/v1/users/{id}/preferences`, `/api/v1/users/{id}/devices`
        
    *   Health check `/health`
        

## 3\. Template Service



*   **Tech**: NestJS
    
*   Responsibilities:
    
    *   Store templates + versions (Postgres + Prisma)
        
    *   Render preview with variables (`POST /templates/preview`)
        
    *   Redis caching for templates
        
    *   Internal API auth via `x-service-key`
        
    *   Swagger at `/api/docs`
        

## 4\. Email Service



*   **Tech**: NestJS (or Node)
    
*   Responsibilities:
    
    *   Consume `email.queue`
        
    *   Render template with variables
        
    *   Send email via SMTP / SendGrid / Mailgun
        
    *   Retry logic with exponential backoff + circuit breaker
        
    *   Move permanently failed messages to `failed.queue`
        
    *   Health endpoints `/health`, `/ready`, `/live`
        

## 5\. Push Service



*   **Tech**: FastAPI (or Node)
    
*   Responsibilities:
    
    *   Consume `push.queue`
        
    *   Send web push (VAPID) or mobile push (FCM)
        
    *   Update Redis status; invalidate tokens via User Service
        
    *   Provide `GET /vapid_public_key`, `POST /subscribe`
        

* * *

# Message formats & queues

## Exchange & queue topology (RabbitMQ)


*   **Exchange**: `notifications.direct` (direct exchange)
    
*   **Queues**
    
    *   `email.queue` (bind routingKey=`email`)
        
    *   `push.queue` (bind routingKey=`push`)
        
    *   `failed.queue` (DLQ for permanently failed messages)
        

## Notification message schema (canonical)



```
{ 
   "id": "notif_123",                 // unique id (client-supplied or UUID)   
    "userId": "user_456",   
    "type": "email",                 // "email" | "push"   
    "template": "welcome",   
    "variables": {"name":"John"},   
    "priority": "normal",           // optional: "low"|"normal"|"high"      
    "scheduledAt": "2025-01-15T10:30:00Z", // optional   
    "retryCount": 0,   
    "correlationId": "req-abc-123"    // propagate across services 

}
```

## Status lifecycle (stored in Redis)


*   `queued` → `processing` → `sent` OR `failed`
    
*   Each status entry: `{ status, updatedAt, attempts, lastError }` keyed by `notification:{id}`
    

* * *

# Repository layout 
```
├── services/
│   ├── api_gateway/          # Node.js/NestJS
│   ├── user_service/         # Python/FastAPI
│   ├── email_service/        # Node.js/NestJS
│   ├── push_service/         # Python/FastAPI
│   └── template_service/     # Node.js/NestJS
├── docker-compose.yml
├── .github/workflows/
└── README.md
```
* * *

# Environment variables 


> Put each service's `.env.example` in its folder. Only a subset shown here.

## API Gateway


```
PORT=3000 
RABBIT_URL=amqp://guest:guest@rabbitmq:5672
RABBIT_EXCHANGE=notifications.direct 
REDIS_URL=redis://redis:6379 
USER_SERVICE_URL=http://user-service:3001 
TEMPLATE_SERVICE_URL=http://template-service:3003 
IDEMPOTENCY_TTL=3600 
THROTTLE_TTL=60 
THROTTLE_LIMIT=30
```

## User Service


```
PORT=3001 
DATABASE_URL=postgresql://postgres:postgres@db:5432/
user_service_db 
REDIS_URL=redis://redis:6379/0 
SECRET_KEY=super_secret 
IDEMPOTENCY_TTL=3600
```

## Template Service


```
PORT=3003 
DATABASE_URL=postgresql://postgres:postgres@db:5432/template_db
REDIS_URL=redis://redis:6379/1 
SERVICE_KEY=service_secret_key 
REDIS_TTL=300

```

## Email Service


```
PORT=3002 
RABBITMQ_URL=amqp://rabbitmq:5672 
EMAIL_QUEUE=email.queue 
FAILED_QUEUE=failed.queue 
SMTP_HOST=smtp.gmail.com 
SMTP_PORT=587 
SMTP_USER=dev@example.com 
SMTP_PASSWORD=devpassword 
SENDGRID_API_KEY= 
MAX_RETRY_ATTEMPTS=3 
CIRCUIT_BREAKER_THRESHOLD=5
```

## Push Service


```
PORT=3004 
RABBITMQ_URL=amqp://rabbitmq:5672 
RABBITMQ_QUEUE_NAME=push.queue 
REDIS_URL=redis://redis:6379/2 
VAPID_PUBLIC_KEY=... 
VAPID_PRIVATE_KEY=... 
VAPID_EMAIL=mailto:your_email@example.com 
USER_SERVICE_URL=http://user-service:3001
```

* * *

# Running the system (local / docker-compose)

## Quick dev bootstrap (recommended)


1.  Clone repo
    

```
git clone https://github.com/HNG-notification-system/distributed-notification-system
cd distributed-notification-system
```

2.  Start infra + services with Docker Compose (example)
    

```
docker compose up --build -d # or to see logs: docker compose up --build
```

This `docker-compose.yml` should include:

*   postgres, redis, rabbitmq (with management plugin)
    
*   api\_gateway, user\_service, template\_service, email\_service, push\_service
    

3.  Seed dev data (optional)
    

`./scripts/dev_seed_data.sh`

4.  Test sending a notification (via API Gateway)
    

```
curl -X POST http://localhost:3000/notifications \
  -H "Content-Type: application/json" \  
  -d '{ "id":"notif-1",    "userId":"user-1",   
        "type":"email",    "template":"welcome_email",  
        "variables":{"name":"Adewoye"},   
        "priority":"normal"  }'
```

5.  Check status
    

`curl http://localhost:3000/notifications/notif-1/status`

6.  Inspect queues (RabbitMQ management UI)
    

`http://localhost:15672 user: guest pass: guest`

* * *

# API reference — key endpoints & examples

## API Gateway


*   `POST /notifications` — enqueue notification  
    Body: canonical message schema (see earlier)
    
*   `GET /notifications/:id/status` — get status from Redis
    
*   `GET /health` — service & dependency health
    
*   `GET /api` — Swagger UI (when enabled)
    

## User Service


*   `POST /api/v1/users/` — create user
    
*   `GET /api/v1/users/{id}`
    
*   `PUT /api/v1/users/{id}/preferences`
    
*   `POST /api/v1/users/{id}/devices`
    

## Template Service


*   `POST /templates` — create (admin)
    
*   `PUT /templates/:id`
    
*   `GET /templates/:code`
    
*   `POST /templates/preview` — internal: render variables
    

## Email / Push health


*   `GET /health` `/ready` `/live`
    

* * *

# Resiliency patterns & operational behaviour

## Idempotency



*   Gateway requires client-supplied `id` (UUID). Redis key `idempotency:{id}` with TTL (`IDEMPOTENCY_TTL`) marks processed requests. Rejected if already exists.
    

## Retry & DLQ


*   Consumer increments `retryCount`. On failure:
    
    *   retry with exponential backoff: `delay = base * 2^attempt + jitter`
        
    *   after `MAX_RETRY_ATTEMPTS` → publish to `failed.queue` with metadata
        

## Circuit Breaker



*   Circuit breaker wraps fragile dependencies (SMTP, Template Service, User Service).
    
*   Config: fail threshold, timeout, half-open probing interval.
    

## Backpressure & Rate Limiting


*   API Gateway enforces client rate limits (`THROTTLE_LIMIT` per window).
    
*   Email service uses RabbitMQ prefetch and consumer pooling.
    

## Observability & Tracing



*   Correlation ID (`correlationId`) passed through messages and logs.
    
*   Structured logs (JSON), timestamps, levels — log aggregator friendly.
    

* * *

# Scaling, performance & production considerations

## Target performance (example)



*   Handle **\>1,000 notifications / minute** 
    
*   Sub-100ms API response for `POST /notifications` (gateway only queues the job)
    
*   Design to run multiple consumer replicas behind RabbitMQ competing consumers
    

## Horizontal scaling


*   **Stateless services (API Gateway, workers)**: scale with container replicas
    
*   **RabbitMQ**: cluster for high availability; consider mirrored queues or classic queue replication policies
    
*   **Postgres**: read replicas for heavy read workloads (user lookups)
    
*   **Redis**: cluster mode for scale and failover
    

## Security


*   Internal service calls use `x-service-key` header (rotate keys regularly)
    
*   Store secrets in vault / environment variables (avoid checked-in `.env`)
    
*   TLS for external endpoints (SMTP TLS, HTTPS between services)
    
*   Sanitize templates and variables to prevent injection attacks
    

* * *

# Testing & CI/CD

## Tests

*   Unit tests per service: `npm run test` / `pytest` as applicable
    
*   E2E test: deploy test stack via docker-compose and run test suite that:
    
    *   posts notification to gateway
        
    *   asserts message reaches correct queue
        
    *   asserts email/push consumer processes message and updates status
        

## CI/CD


*   Example GitHub Actions:
    
    *   Lint → unit tests → build Docker images → push to registry → optional deploy
        
*   Secrets required for deployments:
    
    *   `DOCKER_REGISTRY_USER`, `DOCKER_REGISTRY_TOKEN`
        
    *   `SERVER_HOST`, `SERVER_USER`, `SSH_PRIVATE_KEY`
        
    *   Provider API keys (SendGrid, FCM) stored in GitHub Secrets
        

* * *

# Monitoring & observability


*   **Metrics**: Prometheus scrape endpoints for each service; key metrics include:
    
    *   `notifications_enqueued_total`
        
    *   `notifications_processed_total`
        
    *   `notifications_failed_total`
        
    *   `queue_depth` (RabbitMQ)
        
    *   `consumer_processing_latency`
        
*   **Dashboards**: Grafana for trends (queue depth, delivery rate, error rate)
    
*   **Logging**: centralized ELK / EFK stack or hosted alternative (Datadog, Logz)
    
*   **Alerting**:
    
    *   queue depth rising above threshold
        
    *   error rate spike (>X%)
        
    *   circuit breaker open for >Y minutes
        

* * *

# Troubleshooting guide

### Common: "Message stuck in queue"


1.  Check consumer logs for errors.
    
2.  Inspect RabbitMQ management UI for queue bindings and consumer count.
    
3.  Confirm consumer prefetch and concurrency settings.
    

### "Emails not sending"

1.  Verify SMTP / SendGrid credentials.
    
2.  Check circuit breaker state (endpoint `/status` if implemented).
    
3.  Search logs for auth errors or 5xx responses from provider.
    

### "User preferences ignored"


1.  Confirm API Gateway fetches latest user prefs (cache invalidation on updates).
    
2.  Check Redis cache TTL and invalidation on user change.
    

* * *

# Contributing


1.  Fork the repo
    
2.  Create a feature branch: `git checkout -b feat/my-feature`
    
3.  Run tests and linters locally
    
4.  Open a PR describing your changes; link related issue
    
5.  Maintain code quality and include tests for new logic
    

Coding standards:

*   Node services: ESLint + Prettier
    
*   Python services: black + flake8
    
*   Clear commit messages, small PRs preferred
    

* * *

# License & maintainers


*   **License:** MIT
    
*   **Maintainers:** Distributed Notification System Team
    
    *   Oparaocha Glory Mmachi
    *   Desmond Egwurube
    *   Saheed Damilola Adewoye
    *   Abuchi Nwajagu Collins
