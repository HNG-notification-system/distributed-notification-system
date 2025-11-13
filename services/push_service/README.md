# Push Notification Service

This is a microservice responsible for asynchronously sending web push notifications. It is designed for resilience and scalability, leveraging RabbitMQ for message queuing, Redis for status tracking, and FastAPI for its API interface.

## System Architecture

The service operates on a decoupled, asynchronous model:

1.  **Subscription**: A client (browser) subscribes to notifications via the service's API. A welcome message is queued to confirm the subscription.
2.  **Message Queuing**: Other microservices (e.g., a notification orchestrator) publish notification requests to a RabbitMQ queue.
3.  **Consumption & Delivery**: A background consumer process retrieves messages from the queue.
4.  **Sending**: It sends the web push notification to the appropriate push service (e.g., FCM, Apple Push Notification Service) using VAPID keys.
5.  **Status Tracking**: The status of each notification (`processing`, `sent`, `failed`) is updated in Redis.
6.  **Token Invalidation**: If a push subscription is expired or invalid, the service notifies the User Service to deactivate the token.

```
┌───────────────────┐      Message       ┌────────────────┐      Consume      ┌────────────────────────────┐
│ Other Service     ├───────────────────►│ RabbitMQ Queue ├──────────────────►│ Push Service (Consumer)    │
└───────────────────┘                    └────────────────┘                   └─────────────┬────────────┘
        ▲                                                                                   │
        │                                                                                   │
 Client Subscription Flow                                                                   │ 1. Send to Web Push Gateway
┌───────────────────┐      Subscribe     ┌───────────────────┐                              │ 2. Update Redis Status
│ Browser Client    ├───────────────────►│ Push Service (API)│                              │ 3. Invalidate token via User Service
└───────────────────┘                    └───────────────────┘
```

## Features

- **Asynchronous Processing**: Uses RabbitMQ to queue notification jobs, preventing API blocking and enabling reliable delivery.
- **Resilient Design**: Implements automatic retries with exponential backoff for sending notifications and communicating with other services.
- **Robust Consumer**: The RabbitMQ consumer includes automatic reconnect logic to handle connection drops.
- **Status Tracking**: Utilizes Redis to track the real-time status of each notification sent.
- **Scalability**: The containerized architecture allows for easy scaling of consumer instances.
- **Containerized**: Ships with `Dockerfile` and `docker-compose.yml` for a consistent development and production environment.

## Getting Started

### Prerequisites

- Docker
- Docker Compose

### Installation and Setup

1.  **Clone the repository** and navigate to this service's directory:
    ```sh
    git clone <repository_url>
    cd services/push_service
    ```

2.  **Create an environment file** from the example:
    ```sh
    cp .env.example .env
    ```

3.  **Configure `.env`**:
    -   Update `RABBITMQ_URL` with your RabbitMQ instance credentials.
    -   Update `REDIS_URL` if you are not using the included Dockerized Redis.
    -   Generate VAPID keys and add them to `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`. You can use a library like `pywebpush` to generate these.
    -   Set `VAPID_EMAIL` to your contact email.

4.  **Build and run the services**:
    ```sh
    docker-compose up --build -d
    ```
    This command will build the `push_service` image and start three containers: `push_service`, `redis`, and `rabbitmq`.

## Configuration

The service is configured using environment variables defined in the `.env` file.

| Variable              | Description                                                               | Example                                         |
| --------------------- | ------------------------------------------------------------------------- | ----------------------------------------------- |
| `PORT`                | Port on which the FastAPI server runs.                                    | `3004`                                          |
| `NODE_ENV`            | Environment mode (`development` or `production`).                         | `development`                                   |
| `RABBITMQ_URL`        | Full connection string for the RabbitMQ server.                           | `amqp://guest:guest@rabbitmq:5672/`             |
| `RABBITMQ_QUEUE_NAME` | The name of the queue the consumer listens to.                            | `push.queue`                                    |
| `REDIS_URL`           | Connection URL for the Redis instance.                                    | `redis://redis:6379/0`                          |
| `USER_SERVICE_URL`    | Base URL for the User Service to invalidate tokens.                       | `http://user-service:3000`                      |
| `VAPID_PUBLIC_KEY`    | Public VAPID key sent to clients for subscribing.                         | `your_public_vapid_key`                         |
| `VAPID_PRIVATE_KEY`   | Private VAPID key used by the server to sign push messages.               | `your_private_vapid_key`                        |
| `VAPID_EMAIL`         | Contact email address for VAPID claims.                                   | `mailto:your_email@example.com`                 |
| `LOG_LEVEL`           | The logging level for the application.                                    | `info`                                          |
| `ENABLE_DEBUG`        | Enable detailed debug logs if set to `true`.                              | `false`                                         |

## API Endpoints

The service exposes the following endpoints:

-   `GET /health`
    -   **Description**: A health check endpoint to confirm the service is running.
    -   **Response**:
        ```json
        {
          "status": "healthy",
          "service": "push_service",
          "timestamp": "..."
        }
        ```

-   `GET /vapid_public_key`
    -   **Description**: Provides the public VAPID key required for a browser client to subscribe to push notifications.
    -   **Response**:
        ```json
        {
          "public_key": "your_public_vapid_key"
        }
        ```

-   `POST /subscribe`
    -   **Description**: Receives a push subscription object from a client. The service then queues a welcome notification to the new subscriber.
    -   **Body**: A valid [PushSubscription JSON object](https://developer.mozilla.org/en-US/docs/Web/API/PushSubscription/toJSON).
    -   **Response**:
        ```json
        {
          "status": "ok",
          "message": "Subscription received and queued."
        }
        ```

-   `GET /web_push_test/web_push_test.html`
    -   **Description**: A simple HTML page to test the subscription flow in a browser. Visit `http://localhost:3004/web_push_test/web_push_test.html` after starting the service.

## Usage

### Publishing a Notification

To send a push notification, a message must be published to the RabbitMQ queue specified by `RABBITMQ_QUEUE_NAME` (`push.queue` by default). This is typically done by another service in the system.

**Message Format:**

```json
{
  "notification_id": "unique-id-for-tracking",
  "user_id": "user-identifier",
  "devices": [
    {
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "keys": {
        "p256dh": "...",
        "auth": "..."
      }
    }
  ],
  "title": "Notification Title",
  "body": "This is the notification body text.",
  "action_url": "https://example.com/some/path"
}
```

### Utility Script

A utility script is included to inspect the RabbitMQ queue.

-   `rabbitmq_inspector.py`: Connects to RabbitMQ, checks the message count in the queue, and attempts to read one message without consuming it permanently.

    **How to run:**
    ```sh
    python rabbitmq_inspector.py
