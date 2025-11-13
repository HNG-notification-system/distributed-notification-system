# User Service for Distributed Notification System

This document provides a comprehensive overview of the User Service, a dedicated microservice within the HNG Distributed Notification System. It manages user data, notification preferences, and device tokens, serving as a foundational component for ensuring that notifications are accurately routed and personalized.

  

* * *

## Overview

The User Service ensures that each user’s contact information and delivery preferences (email or push) are properly stored, validated, and made accessible to other services (e.g., API Gateway, Email Service, Push Service) via RESTful APIs. It is built with FastAPI, providing a highly performant, asynchronous, and easily maintainable architecture.

* * *

##   

## Features

###   

### User Management

*   Register new users with validation and hashed passwords.
    
*   Retrieve user profiles by ID.
    
*   Update and manage user contact details (email, phone, etc.).
    

### Notification Preferences

*   Store and manage user notification preferences for each channel (email, push).
    
*   Support opt-in/opt-out behavior per channel.
    
*   Handle quiet hours configuration (`quiet_hours_start` and `quiet_hours_end`).
    
*   Automatically create default preferences upon user registration.
    

### Device Management

*   Register, activate, and deactivate user devices.
    
*   Store push tokens for web, iOS, and Android platforms.
    
*   Prevent duplicate tokens using unique constraints.
    

### Infrastructure & Performance

*   **PostgreSQL** for persistent user and preference storage.
    
*   **Redis** caching for rapid access to frequently used user data.
    
*   Built-in cache invalidation on updates.
    
*   Health check endpoint (`/health`) for service monitoring.
    
*   Configurable through `.env` and Dockerized for deployment ease.
    

### Architecture Alignment

*   Follows API structure (`/api/v1/...`).
    
*   Uses async SQLAlchemy and FastAPI for concurrency and performance.
    
*   Validates requests/responses with Pydantic v2.
    
*   Structured error handling and standardized response formats.
    
*   Integrates seamlessly with the distributed message queue through the API Gateway.
    

* * *

## Tech Stack

| Component | Technology |
| --- | --- |
| Framework | FastAPI |
| Language | Python 3.11 |
| Database | PostgreSQL (async SQLAlchemy + asyncpg) |
| Cache | Redis |
| Containerization | Docker & Docker Compose |
| Validation | Pydantic v2 |
| Docs | Auto-generated Swagger/OpenAPI |

* * *

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | /api/v1/users/ | Register a new user with preferences |
| GET | /api/v1/users/{id} | Retrieve user details |
| PUT | /api/v1/users/{id}/preferences | Update notification preferences |
| POST | /api/v1/users/{id}/devices | Register or update a device token |
| GET | /health | Check service and dependency health |

### Interactive Docs

Available automatically via FastAPI at:  
`http://localhost:3001/docs`

* * *

## Running Locally

### Clone the Repository

    git clone https://github.com/hng-notification-system/distributed-notification-system.git
    cd distributed-notification-system/services/user_service
    

### Copy Environment Variables

    cp .env.example .env
    

### Build and Start with Docker Compose

    docker-compose up --build
    

This will start:

*   **User Service** → port **3001**
    
*   **PostgreSQL** and **Redis** dependencies
    

Access at:  
`http://localhost:3001`

* * *

## Sample Requests

### Register a New User

    curl -X POST http://localhost:3001/api/v1/users/ \
    -H "Content-Type: application/json" \
    -d '{
      "name": "John Doe",
      "email": "john@example.com",
      "password": "StrongPass123!",
      "preferences": {"email": true, "push": false}
    }'
    

### Retrieve a User by ID

    curl -X GET http://localhost:3001/api/v1/users/<user_id>
    

### Update Notification Preferences

    curl -X PUT http://localhost:3001/api/v1/users/<user_id>/preferences \
    -H "Content-Type: application/json" \
    -d '{
      "email": false,
      "push": true,
      "quiet_hours_start": "22:00",
      "quiet_hours_end": "07:00"
    }'
    

### Register or Update a Device Token

    curl -X POST http://localhost:3001/api/v1/users/<user_id>/devices \
    -H "Content-Type: application/json" \
    -d '{
      "token": "fcm_device_token_123",
      "platform": "android",
      "active": true
    }'
    

### Health Check

    curl -X GET http://localhost:3001/health
    

* * *

## Environment Configuration

| Variable | Description | Default Value |
| --- | --- | --- |
| PORT | Application port | 3001 |
| DATABASE_URL | PostgreSQL connection string | postgresql+asyncpg://postgres:postgres@db:5432/user_service_db |
| REDIS_URL | Redis connection | redis://redis:6379/0 |
| SECRET_KEY | Secret key for encryption/auth | your_super_secret_key_here |
| IDEMPOTENCY_TTL | TTL for idempotency keys | 3600 |

* * *

## Testing & Development Tips

*   Use async SQLAlchemy sessions for database queries.
    
*   Invalidate Redis cache whenever user data changes.
    
*   Ensure device tokens are unique to avoid duplicate pushes.
    
*   API requests/responses are validated using Pydantic models.
    
*   Auto-generated API docs available at:  
    `http://localhost:3001/docs`
    

* * *

## Conclusion

The User Service is a reliable, scalable, and modular backbone for user and notification management within the Distributed Notification System. It integrates seamlessly with other microservices such as the Gateway, Email, and Push Services, ensuring consistent, secure, and efficient notification delivery across platforms.
