# API Gateway Service for Distributed Notification System

This service is a NestJS application that serves as the primary ingress point for the distributed notification system. It is responsible for accepting, validating, and queueing notification requests from clients.

## Overview

The API Gateway handles the initial phase of the notification lifecycle. Its key responsibilities include:

*   **Receiving Requests:** Exposes a secure, rate-limited REST API endpoint to accept new notification jobs.
*   **Validation:** Validates incoming data against a defined schema (`CreateNotificationDto`).
*   **Idempotency:** Ensures that the same notification request is not processed multiple times by using Redis for idempotency checks.
*   **User Preference Management:** Fetches user data and notification preferences from the User Service, respecting user opt-outs.
*   **Data Enrichment:** Augments notification payloads with user-specific details like email addresses or push tokens.
*   **Message Queuing:** Publishes validated and enriched notification jobs to a RabbitMQ message broker for asynchronous processing by downstream services.
*   **Status Tracking:** Provides an initial status (`queued`, `scheduled`, `failed`) and an endpoint for clients to track the state of their requests.

## Core Technologies

*   **Framework:** [NestJS](https://nestjs.com/)
*   **Messaging:** [RabbitMQ](https://www.rabbitmq.com/) via `amqplib`
*   **Caching & Idempotency:** [Redis](https://redis.io/) via `ioredis`
*   **API Documentation:** [Swagger (OpenAPI)](https://swagger.io/)
*   **Rate Limiting:** `@nestjs/throttler`
*   **Circuit Breaker:** A utility using `opossum` is included for resilient external service calls.

## Architecture

1.  A client sends a `POST /notifications` request to the API Gateway.
2.  The gateway's `ThrottlerGuard` applies rate limiting.
3.  The `NotificationsController` receives the request, which is validated by a `ValidationPipe` against the `CreateNotificationDto`.
4.  The `NotificationsService` is invoked.
5.  It first attempts to fetch user data from the Redis cache. On a cache miss, it calls the external **User Service** via HTTP and caches the result.
6.  It checks the user's notification preferences to see if they have opted out of the requested notification type.
7.  It performs an idempotency check using the unique notification `id` in Redis. If the request is a duplicate, it is rejected.
8.  It enriches the notification payload with user information (e.g., email address, push token).
9.  The payload is published to a RabbitMQ direct exchange (`notifications.direct`) by the `NotificationProducer`. The routing key (`email` or `push`) is determined by the notification type.
10. An initial status is set in Redis for the notification, which can be queried via `GET /notifications/:id/status`.

## Prerequisites

*   Node.js (v18 or higher)
*   NPM
*   Docker & Docker Compose (for running dependencies like RabbitMQ and Redis)

## Environment Variables

Create a `.env` file in the root of the `api_gateway` directory with the following variables. Defaults are provided in the configuration.

| Variable          | Description                                                                 | Default                                 |
| ----------------- | --------------------------------------------------------------------------- | --------------------------------------- |
| `PORT`            | The port for the gateway to listen on.                                      | `3000`                                  |
| `RABBIT_URL`      | The connection string for the RabbitMQ server.                              | `amqp://guest:guest@rabbitmq:5672`      |
| `RABBIT_EXCHANGE` | The name of the RabbitMQ direct exchange.                                   | `notifications.direct`                  |
| `REDIS_URL`       | The connection string for the Redis server.                                 | `redis://redis:6379`                    |
| `USER_SERVICE_URL`| The base URL for the User Service.                                          | `http://user-service:3001`              |
| `IDEMPOTENCY_TTL` | Time-to-live (in seconds) for idempotency keys in Redis.                    | `3600` (1 hour)                         |
| `THROTTLE_TTL`    | Time-to-live (in seconds) for the rate-limiting window.                     | `60`                                    |
| `THROTTLE_LIMIT`  | Maximum number of requests per `THROTTLE_TTL` period.                       | `30`                                    |

## Getting Started

### Installation

Clone the repository and install the dependencies for this service:

```bash
cd services/api_gateway
npm install
```

### Running the Application

To run the service in different modes:

```bash
# Development mode with hot-reloading
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## Docker

A `Dockerfile` is provided to build and run the service in a containerized environment.

1.  **Build the Docker image:**

    ```bash
    docker build -t api-gateway .
    ```

2.  **Run the container:**

    Ensure your dependencies (RabbitMQ, Redis, User Service) are accessible from the container's network. You can pass environment variables directly or use an environment file.

    ```bash
    docker run -p 3000:3000 --name api-gateway --env-file ./.env api-gateway
    ```

## API Endpoints

### Enqueue a Notification

*   **`POST /notifications`**

    Submits a new notification job to the system. The request body must conform to `CreateNotificationDto`.

    **Example Payload:**

    ```json
    {
      "id": "f8a5a0f1-8ac1-4f51-9b16-5cb3f7cb7d55",
      "userId": "user-123",
      "type": "email",
      "template": "welcome-email",
      "variables": {
        "name": "Jane Doe"
      },
      "priority": "normal",
      "scheduledAt": "2024-09-15T10:00:00Z"
    }
    ```

    **Success Response (201 Created):**

    ```json
    {
        "id": "f8a5a0f1-8ac1-4f51-9b16-5cb3f7cb7d55",
        "status": "queued",
        "scheduled": true
    }
    ```

### Get Notification Status

*   **`GET /notifications/:id/status`**

    Retrieves the current status of a notification from Redis.

    **Success Response (200 OK):**

    ```json
    {
        "status": "queued",
        "updatedAt": "2024-08-01T12:34:56.789Z"
    }
    ```

### Health Check

*   **`GET /health`**

    Checks the health of the service and its primary dependencies (RabbitMQ, Redis).

    **Success Response (200 OK):**

    ```json
    {
        "rabbit": "ok",
        "redis": "ok"
    }
    ```

### API Documentation

*   **`GET /api`**

    Serves the Swagger UI, providing interactive API documentation for all available endpoints.

## Testing

To run the test suites:

```bash
# Run unit tests
npm run test

# Run end-to-end tests
npm run test:e2e

# Get a test coverage report
npm run test:cov