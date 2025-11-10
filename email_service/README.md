# Email Service - Distributed Notification System (NestJS)

A production-ready microservice built with **NestJS** responsible for consuming email notification messages from RabbitMQ, fetching templates, and sending emails via SMTP/SendGrid/Mailgun with retry logic, circuit breakers, and failure handling.

## Features

✅ **NestJS Framework** - Modern, TypeScript-first framework  
✅ **RabbitMQ Consumer** - Consumes messages from email queue  
✅ **Template Integration** - Fetches and renders templates with variable substitution  
✅ **Multiple Email Providers** - SMTP, SendGrid, Mailgun  
✅ **Circuit Breaker** - Prevents cascading failures  
✅ **Retry Logic** - Exponential backoff with configurable attempts  
✅ **Dead Letter Queue** - Moves permanently failed messages to DLQ  
✅ **Health Checks** - `/health`, `/ready`, `/live` endpoints  
✅ **Idempotency** - Prevents duplicate notifications  
✅ **Structured Logging** - Winston with correlation IDs  
✅ **Dependency Injection** - Clean, testable architecture  
✅ **Dockerized** - Production-ready containerization  
✅ **CI/CD Pipeline** - GitHub Actions workflow

## Architecture

```
RabbitMQ (email.queue)
    ↓
Queue Service (Consumer)
    ↓
┌─────────────────────────────┐
│ 1. Fetch Template           │ → Template Service (HTTP)
│ 2. Render Variables         │
│ 3. Send Email (SMTP/etc)    │
│ 4. Retry on Failure         │
│ 5. DLQ on Max Retry         │ → RabbitMQ (failed.queue)
└─────────────────────────────┘
```

## NestJS Structure

```
src/
├── main.ts                    # Application entry point
├── app.module.ts              # Root module
├── common/
│   ├── dto/                   # Data Transfer Objects
│   │   └── index.ts
│   └── utils/                 # Shared utilities
│       ├── logger.ts          # Winston logger
│       ├── circuit-breaker.ts # Circuit breaker
│       └── retry.ts           # Retry handler
└── modules/
    ├── email/                 # Email module
    │   ├── email.module.ts
    │   └── email.service.ts
    ├── template/              # Template module
    │   ├── template.module.ts
    │   └── template.service.ts
    ├── queue/                 # RabbitMQ module
    │   ├── queue.module.ts
    │   └── queue.service.ts
    └── health/                # Health check module
        ├── health.module.ts
        └── health.controller.ts
```

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- RabbitMQ
- SMTP credentials (Gmail/SendGrid/Mailgun)

## Quick Start

### 1. Clone and Install

```bash
cd email_service
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# SMTP (Gmail Example)
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Or use SendGrid
SENDGRID_API_KEY=your-sendgrid-api-key

# Or use Mailgun
MAILGUN_API_KEY=your-mailgun-key
MAILGUN_DOMAIN=your-domain.mailgun.org
```

### 3. Run with Docker Compose

```bash
docker-compose up -d
```

This starts:

- RabbitMQ (port 5672, management UI at 15672)
- Email Service (port 3002)

### 4. Check Health

```bash
curl http://localhost:3002/health
```

## Development

### Run Locally (Without Docker)

```bash
# Start RabbitMQ in Docker
docker-compose up rabbitmq

# In another terminal, start NestJS
npm run start:dev
```

### Build

```bash
npm run build
```

### Production Mode

```bash
npm run start:prod
```

### Testing

```bash
npm test
```

## Message Format

The service expects messages in this format:

```json
{
  "notification_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user123",
  "template_id": "welcome_email",
  "to_email": "user@example.com",
  "variables": {
    "name": "John Doe",
    "verification_link": "https://app.com/verify/abc123"
  },
  "priority": "high",
  "correlation_id": "req-123"
}
```

## API Endpoints

### Health Check

```bash
GET /health
```

Response:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "email-service",
    "timestamp": "2025-11-10T12:00:00Z",
    "uptime": 3600,
    "checks": {
      "rabbitmq": true,
      "template_service": true,
      "smtp": true
    },
    "version": "1.0.0"
  },
  "message": "Service is healthy"
}
```

### Detailed Status

```bash
GET /status
```

### Readiness Probe

```bash
GET /ready
```

### Liveness Probe

```bash
GET /live
```

## Configuration

### Environment Variables

| Variable                    | Description                                                                                            | Default                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------- |
| `PORT`                      | HTTP server port                                                                                       | `3002`                  |
| `RABBITMQ_URL`              | RabbitMQ connection URL                                                                                | `amqp://localhost:5672` |
| `EMAIL_QUEUE`               | Email queue name                                                                                       | `email.queue`           |
| `FAILED_QUEUE`              | Dead letter queue name                                                                                 | `failed.queue`          |
| `SMTP_HOST`                 | SMTP server host                                                                                       | `smtp.gmail.com`        |
| `SMTP_PORT`                 | SMTP server port                                                                                       | `587`                   |
| `SMTP_USER`                 | SMTP username — REQUIRED in production (docker-compose provides safe local defaults `dev@example.com`) | -                       |
| `SMTP_PASSWORD`             | SMTP password — REQUIRED in production (docker-compose provides safe local defaults `devpassword`)     | -                       |
| `TEMPLATE_SERVICE_URL`      | Template service endpoint                                                                              | `http://localhost:3005` |
| `MAX_RETRY_ATTEMPTS`        | Max retry attempts                                                                                     | `3`                     |
| `CIRCUIT_BREAKER_THRESHOLD` | Circuit breaker threshold                                                                              | `5`                     |

### Gmail Setup

1. Enable 2-Factor Authentication
2. Generate App Password: [Google Account > Security > App Passwords](https://myaccount.google.com/apppasswords)
3. Use app password in `SMTP_PASSWORD`

### SendGrid Setup

1. Sign up at [SendGrid](https://sendgrid.com)
2. Create API Key
3. Set `SENDGRID_API_KEY`

### Mailgun Setup

1. Sign up at [Mailgun](https://mailgun.com)
2. Get API Key and Domain
3. Set `MAILGUN_API_KEY` and `MAILGUN_DOMAIN`

## Circuit Breaker

The service implements circuit breaker pattern using dependency injection:

- **SMTP Connection** - Opens after 5 consecutive failures
- **Template Service** - Opens after 5 consecutive failures

States:

- **CLOSED**: Normal operation
- **OPEN**: Service unavailable, requests fail fast
- **HALF_OPEN**: Testing if service recovered

## Retry Logic

Exponential backoff retry with jitter:

| Attempt | Delay |
| ------- | ----- |
| 1st     | 1s    |
| 2nd     | 2s    |
| 3rd     | 4s    |

After 3 failed attempts, message moves to `failed.queue`.

## Monitoring

### Logs

Logs are written to:

- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

### Queue Monitoring

Access RabbitMQ Management UI:

```
http://localhost:15672
Username: admin
Password: admin123
```

## Deployment

### Docker Build

```bash
docker build -t email-service:latest .
```

### Docker Run

```bash
docker run -d \
  --name email-service \
  -p 3002:3002 \
  -e RABBITMQ_URL=amqp://rabbitmq:5672 \
  -e SMTP_USER=your-email@gmail.com \
  -e SMTP_PASSWORD=your-password \
  email-service:latest
```

### CI/CD

The service includes GitHub Actions workflow that:

1. Runs linting and tests
2. Builds Docker image
3. Pushes to GitHub Container Registry
4. Deploys to server via SSH

Required secrets:

- `SERVER_HOST`
- `SERVER_USER`
- `SSH_PRIVATE_KEY`
- `SLACK_WEBHOOK` (optional)

## NestJS Best Practices

### Modules

Each feature is organized into a module:

- **EmailModule** - Email sending logic
- **TemplateModule** - Template fetching
- **QueueModule** - RabbitMQ consumer
- **HealthModule** - Health checks

### Dependency Injection

Services are injected via constructors:

```typescript
constructor(
  private configService: ConfigService,
  private emailService: EmailService,
  private templateService: TemplateService,
) {}
```

### Lifecycle Hooks

Services use lifecycle hooks:

- `OnModuleInit` - Initialize connections
- `OnModuleDestroy` - Cleanup resources

## Production Considerations

### Performance

- **Prefetch Count**: Set to 10 for optimal throughput
- **Connection Pooling**: HTTP connections are managed by NestJS
- **Template Caching**: Templates cached for 5 minutes

### Scaling

Scale horizontally by running multiple instances:

```bash
docker-compose up --scale email-service=3
```

All instances consume from the same queue (competing consumers pattern).

### Security

- ✅ Non-root Docker user
- ✅ CORS enabled
- ✅ Environment-based secrets
- ✅ Validation pipes for DTOs
- ✅ No hardcoded credentials

## Troubleshooting

### Email not sending

1. Check SMTP credentials
2. Verify circuit breaker state: `GET /status`
3. Check logs: `docker logs email-service`
4. Test SMTP connection manually

### RabbitMQ connection issues

1. Verify RabbitMQ is running
2. Check network connectivity
3. Review connection URL format
4. Check RabbitMQ logs

### Template Service unavailable

1. Verify Template Service is running
2. Check circuit breaker state
3. Templates are cached - service may work with stale cache

## Performance Targets

- ✅ Process 1,000+ emails per minute
- ✅ 99.5% delivery success rate
- ✅ Health check response < 100ms
- ✅ Automatic retry with exponential backoff

## Technology Stack

- **Framework**: NestJS 10
- **Runtime**: Node.js 18 + TypeScript
- **Message Queue**: RabbitMQ (amqp-connection-manager)
- **Email**: Nodemailer, SendGrid, Mailgun
- **HTTP Client**: Axios (via @nestjs/axios)
- **Logging**: Winston + nest-winston
- **Validation**: class-validator, class-transformer
- **Containerization**: Docker

## License

MIT

## Support

For issues or questions, contact the development team or create an issue in the repository.

---

**Built with NestJS + ❤️ for the Distributed Notification System**
