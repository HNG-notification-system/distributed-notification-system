Overview

This PR introduces the User Service, a dedicated microservice responsible for managing user data, device tokens, and notification preferences within the distributed notification system.

The service ensures each user’s contact information and delivery preferences (email or push) are properly stored, validated, and made accessible to other services (like the API Gateway, Email Service, and Push Service) through well-defined REST APIs.

Features
User Management

Register new users with validation and hashed passwords

Retrieve user profiles by ID

Update and manage user contact details (email, phone)

Notification Preferences

Store and manage user notification preferences for each channel (email, push)

Support opt-in/opt-out behavior per channel (e.g., only email, only push, both)

Handle quiet hours configuration (quiet_hours_start and quiet_hours_end)

Automatically create default preferences on user creation

Device Management

Register, activate, and deactivate user devices

Store push tokens for web, iOS, and Android platforms

Prevent duplicate device tokens through unique constraints

Infrastructure & Performance

PostgreSQL for persistent user and preference storage

Redis caching layer for fast retrieval of frequently accessed user data

Built-in cache invalidation when user data or preferences are updated

Health check endpoint (/health) for service monitoring and uptime verification

Configurable via .env file with Dockerized environment setup

Architecture Alignment

Follows  API structure (/api/v1/...)

Uses async SQLAlchemy and FastAPI for high performance

Includes proper request/response validation using Pydantic v2

Structured error handling and consistent response format (success, data, message, error)

Fully compatible with the distributed message queue flow via the API Gateway

API Endpoints
Method	Endpoint	Description
POST	/api/v1/users/	Register a new user with preferences
GET	/api/v1/users/{id}	Retrieve user details
PUT	/api/v1/users/{id}/preferences	Update notification preferences
POST	/api/v1/users/{id}/devices	Register or update a device token
GET	/health	Service health and dependency check


Technical Stack

Framework: FastAPI (Python 3.11)

Database: PostgreSQL (async SQLAlchemy)

Cache: Redis (for user data and rate limiting)

Containerization: Docker & Docker Compose

Validation: Pydantic v2 models with pattern constraints

Documentation: Auto-generated Swagger/OpenAPI via FastAPI

Testing & Async Handling: asyncio for concurrent request processing

Running Locally

Clone the repository:

git clone <your-repo-url>
cd services/user_service


Copy the environment variables template:

cp .env.example .env


Build and start the service using Docker Compose:

docker-compose up --build


This will start:

User Service on port 3001

PostgreSQL and Redis dependencies

Sample Requests
Register a new user
curl -X POST http://localhost:3001/api/v1/users/ \
-H "Content-Type: application/json" \
-d '{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPass123!",
  "preferences": {"email": true, "push": false}
}'

Retrieve a user by ID
curl -X GET http://localhost:3001/api/v1/users/<user_id>

Update notification preferences
curl -X PUT http://localhost:3001/api/v1/users/<user_id>/preferences \
-H "Content-Type: application/json" \
-d '{
  "email": false,
  "push": true,
  "quiet_hours_start": "22:00",
  "quiet_hours_end": "07:00"
}'

Register or update a device token
curl -X POST http://localhost:3001/api/v1/users/<user_id>/devices \
-H "Content-Type: application/json" \
-d '{
  "token": "fcm_device_token_123",
  "platform": "android",
  "active": true
}'

Health Check
curl -X GET http://localhost:3001/health

Testing & Development Tips

Use async SQLAlchemy sessions for database interactions.

Redis caching ensures high performance; always invalidate cache after updates.

Ensure device tokens are unique to avoid duplicate notifications.

All API requests/responses are validated using Pydantic models.

Auto-generated API docs are available at:

http://localhost:3001/docs

Environment Configuration

The service is configurable via a .env file:

PORT=3001
DATABASE_URL=postgresql+asyncpg://user:password@postgres:5432/users
REDIS_URL=redis://redis:6379/0
SECRET_KEY=<your-secret-key>

Conclusion

The User Service provides a reliable foundation for user management and notification preference handling in a distributed microservices architecture.
It integrates seamlessly with the Push Service, Email Service, and other components, ensuring consistent, secure, and performant delivery of notifications.