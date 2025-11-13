# Distributed Notification System

A scalable, microservices-based notification system designed to handle email and push notifications asynchronously through message queues. Built with modern backend technologies and following microservices architecture principles.

## 🚀 System Overview

The Distributed Notification System consists of multiple independent services that work together to deliver notifications reliably and efficiently. The system handles user preferences, template management, and delivery through multiple channels with built-in retry mechanisms and failure handling.

## 🏗️ Architecture
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATIONS                                 │
│                        (Web, Mobile, Desktop)                                │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (Port 3000)                            │
│                          Single Entry Point                                  │
└────┬──────────────┬──────────────┬──────────────────────┬───────────────────┘
     │              │              │                      │
     │              │              │                      │
     ▼              ▼              ▼                      ▼
┌─────────┐  ┌──────────┐  ┌─────────────┐      ┌──────────────┐
│  User   │  │ Template │  │    Redis    │      │   RabbitMQ   │
│ Service │  │ Service  │  │    Cache    │      │   Exchange   │
│(Pt 3001)│  │(Pt 3005) │  │             │      │notifications │
│ Python/ │  │  Node/   │  │  In-Memory  │      │   .direct    │
│ FastAPI │  │  NestJS  │  │    Store    │      └──────┬───────┘
└────┬────┘  └────┬─────┘  └─────────────┘             │
     │            │                                     │
     ▼            ▼                          ┌──────────┼──────────┐
┌─────────┐  ┌─────────┐                    │          │          │
│   User  │  │Template │                    ▼          ▼          ▼
│Database │  │Database │              ┌──────────┐┌──────────┐┌──────────┐
│Postgres │  │Postgres │              │  email   ││   push   ││  failed  │
└─────────┘  └─────────┘              │  .queue  ││  .queue  ││  .queue  │
                                      └────┬─────┘└────┬─────┘└──────────┘
                                           │           │       (DLQ)
                                           │           │
                                           ▼           ▼
                                    ┌──────────┐ ┌──────────┐
                                    │  Email   │ │   Push   │
                                    │ Service  │ │ Service  │
                                    │(Pt 3002) │ │(Pt 3003) │
                                    │  Node/   │ │ Python/  │
                                    │  NestJS  │ │ FastAPI  │
                                    └────┬─────┘ └────┬─────┘
                                         │            │
                                         │            │
                    ┌────────────────────┼────────────┼────────────────────┐
                    │                    │            │                    │
                    ▼                    ▼            ▼                    ▼
            ┌──────────────┐    ┌──────────────┐    │            ┌──────────────┐
            │   Template   │    │     Redis    │    │            │   Template   │
            │   Service    │    │     Cache    │    │            │   Service    │
            │  (Shared)    │    │   (Shared)   │    │            │  (Shared)    │
            └──────────────┘    └──────────────┘    │            └──────────────┘
                                                     │
                                         ┌───────────┴───────────┐
                                         ▼                       ▼
                                  ┌─────────────┐        ┌─────────────┐
                                  │   Email     │        │    Push     │
                                  │  Providers  │        │  Providers  │
                                  └─────────────┘        └─────────────┘

Legend:
  ──▶  Request Flow (Synchronous)
  ━━▶  Message Queue Flow (Asynchronous)
  ───  Data Access
  

## 📦 Services

### 1. API Gateway (Port 3000) - Node.js/NestJS
**Role:** Single entry point for all notification requests

**Responsibilities:**
- Request validation and authentication
- Routing to appropriate services
- Status tracking and response aggregation
- Rate limiting and security

### 2. User Service (Port 3001) - Python/FastAPI/Flask
**Role:** Manages user data and notification preferences

**Key Features:**
- User registration and authentication
- Contact information management (email, push tokens)
- Notification preferences (email/push opt-in/out)
- Device token management
- Quiet hours configuration

### 3. Template Service (Port 3005) - Node.js/NestJS
**Role:** Handles notification templates and content management

**Key Features:**
- Create, update, and manage templates
- Multi-language support
- Variable substitution ({{name}}, {{link}})
- Template versioning
- Preview functionality

### 4. Email Service (Port 3002) - Node.js/NestJS
**Role:** Processes and sends email notifications

**Key Features:**
- Consumes messages from RabbitMQ email queue
- Supports multiple providers (SMTP, SendGrid, Mailgun)
- Template rendering with variables
- Circuit breaker pattern for failure prevention
- Retry logic with exponential backoff

### 5. Push Service (Port 3003) - Python/FastAPI/Flask
**Role:** Handles mobile and web push notifications

**Key Features:**
- Consumes messages from RabbitMQ push queue
- Supports FCM, OneSignal, and Web Push
- Device token validation
- Rich notifications (title, text, image, link)
- Failure handling and retry mechanisms

## 🛠️ Technology Stack

### Backend Frameworks
- **Node.js/NestJS:** API Gateway, Email Service, Template Service
- **Python/FastAPI/Flask:** User Service, Push Service

### Infrastructure
- **Message Queue:** RabbitMQ
- **Databases:** PostgreSQL (primary), Redis (caching)
- **Containerization:** Docker & Docker Compose
- **API Documentation:** Swagger/OpenAPI
- **Monitoring:** Health checks, structured logging

## 🔄 Message Flow

1. Client sends notification request to API Gateway
2. API Gateway validates request and checks user preferences with User Service
3. API Gateway gets template information from Template Service
4. API Gateway routes message to appropriate RabbitMQ queue
5. Processing Services (Email/Push) consume messages and:
   - Fetch templates from Template Service
   - Render content with variables
   - Send via external providers
6. Status updates are stored and propagated back to clients

## ⚙️ Key Features

### Reliability
- **Circuit Breaker:** Prevents cascading failures
- **Retry System:** Exponential backoff with configurable attempts
- **Dead Letter Queue:** Handles permanently failed messages
- **Idempotency:** Prevents duplicate notifications using request IDs

### Performance
- **Redis Caching:** Fast access to user preferences and templates
- **Async Processing:** Non-blocking message processing
- **Horizontal Scaling:** All services support multiple instances
- **Connection Pooling:** Optimized database and external service connections

### Monitoring
- **Health Checks:** `/health` endpoints for all services
- **Structured Logging:** Correlation IDs for request tracing
- **Metrics:** Queue lengths, response times, error rates
- **Alerting:** Dead letter queue monitoring

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for Node.js services)
- Python 3.11+ (for Python services)

### Running the System

1. **Clone the repository:**
```bash
git clone https://github.com/HNG-notification-system/distributed-notification-system.git
cd distributed-notification-system
```

2. **Start all services:**
```bash
docker-compose up -d
```

3. **Verify services are running:**
```bash
curl http://localhost:3000/health  # API Gateway (Node.js/NestJS)
curl http://localhost:3001/health  # User Service (Python/FastAPI)
curl http://localhost:3002/health  # Email Service (Node.js/NestJS)
curl http://localhost:3003/health  # Push Service (Python/FastAPI)
curl http://localhost:3005/health  # Template Service (Node.js/NestJS)
```

## 📡 API Usage

### Send Notification
```bash
POST /api/v1/notifications/
{
  "notification_type": "email",  # or "push"
  "user_id": "user-123",
  "template_code": "welcome_email",
  "variables": {
    "name": "John Doe",
    "verification_link": "https://app.com/verify/abc123"
  },
  "request_id": "req-123456",
  "priority": "high"
}
```

### Check Notification Status
```bash
GET /api/v1/notifications/{notification_id}/status
```

## 🔧 Configuration

Each service is configured via environment variables. See individual service READMEs for detailed configuration options.

**Key environment variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `RABBITMQ_URL`: RabbitMQ connection URL
- `REDIS_URL`: Redis connection string
- Service-specific keys and credentials

## 🧪 Testing
```bash
# Run tests for Node.js services
docker-compose run api_gateway npm test
docker-compose run email_service npm test
docker-compose run template_service npm test

# Run tests for Python services
docker-compose run user_service pytest
docker-compose run push_service pytest
```

## 📊 Monitoring & Logs

- **RabbitMQ Management:** http://localhost:15672
- **API Documentation:** http://localhost:3000/api/docs
- **Service Logs:** `docker-compose logs [service_name]`

## 🎯 Performance Targets

✅ **Throughput:** 1,000+ notifications per minute  
✅ **Latency:** <100ms API Gateway response time  
✅ **Reliability:** 99.5% delivery success rate  
✅ **Scalability:** Horizontal scaling enabled for all services

## 🤝 Development

### Project Structure
```text
distributed-notification-system/
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

### Technology Distribution
- **Node.js/NestJS Stack:** API Gateway, Email Service, Template Service
- **Python/FastAPI Stack:** User Service, Push Service

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Team

Distributed Notification System Development Team

---

**Note:** For detailed information about each service, refer to their individual README files in the `services/` directory.