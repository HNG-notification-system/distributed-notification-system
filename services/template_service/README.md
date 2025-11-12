🎯 Template Service

A high-performance microservice for managing notification templates across email, push, and SMS channels.
Built with NestJS, featuring version control, Redis caching, and Handlebars templating.

📑 Table of Contents

✨ Features

🏗️ Architecture

🚀 Quick Start

Prerequisites

Local Development

🐳 Docker Deployment (Recommended)

⚙️ Configuration

Environment Variables

🐋 Docker Compose Services

🔐 Authentication & Authorization

Dual-Layer Security

Access Matrix

📡 API Reference

Complete Endpoint List

Request Examples

🛠️ Development

📊 Health Monitoring

🔧 Troubleshooting

🚨 Security Notes

✨ Features

🚀 Multi-channel Templates – Email, push notifications, SMS

🔄 Version Control – Full audit trail with rollback capability

⚡ Redis Caching – Fast template retrieval

🎨 Handlebars Engine – Powerful variable substitution with custom helpers

🔐 Dual-Layer Authentication – Internal service keys + role-based access

📚 OpenAPI Documentation – Interactive API docs via Swagger UI

🐳 Docker Ready – Containerized deployment with Docker Compose

🏗️ Enterprise Ready – Built with NestJS for scalability and maintainability

🏗️ Architecture

NestJS microservice architecture with PostgreSQL persistence and Redis caching.

🚀 Quick Start
Prerequisites

Node.js 18+

PostgreSQL 14+

Redis 7+

Local Development
# 1. Clone the repository
git clone <https://github.com/HNG-notification-system/distributed-notification-system.git
cd template-service

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Run database migrations
npx prisma migrate deploy

# 5. (Optional) Seed the database
npx prisma db seed

# 6. Start the development server
npm run start:dev


Service available at: http://localhost:3003

Swagger API docs: http://localhost:3003/api/docs

🐳 Docker Deployment 
# Start all services (PostgreSQL, Redis, and Template Service)
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f template-service

# Stop services
docker-compose down


Service available at: http://localhost:3003

Health check: http://localhost:3003/api/v1/health

⚙️ Configuration
Environment Variables
Variable	Description	Default
DATABASE_URL	PostgreSQL connection string	postgresql://user:pass@localhost:5432/template_service
REDIS_HOST	Redis server host	localhost
REDIS_PORT	Redis server port	6379
REDIS_PASSWORD	Redis password (optional)	-
INTERNAL_SERVICE_KEY	Key for internal service communication	-
NODE_ENV	Application environment	development
PORT	Service port	3003
ALLOWED_ORIGINS	CORS allowed origins	http://localhost:3000,http://localhost:3001
🐋 Docker Compose Services

The docker-compose.yml includes:

PostgreSQL 15 – Database with health checks

Redis 7 – Cache with persistence and health checks

Template Service – NestJS app with auto-migrations and integrated health checks

🔐 Authentication & Authorization
Dual-Layer Security

All routes require at least one of the following authentication methods:

1. Internal Service Authentication (Required for all routes)
x-service-key: your-internal-service-key

2. Role-Based Access (For user actions via API Gateway)
x-user-role: admin | editor

Access Matrix
Route Type	Internal Service Key	Admin Role	Editor Role
All Routes	✅ Required	-	-
Read Operations	✅ Required	✅ Optional	✅ Optional
Write Operations	✅ Required	✅ Required	⚠️ Limited
Admin Operations	✅ Required	✅ Required	❌ Denied
📡 API Reference
Complete Endpoint List
Method	Endpoint	Description	Auth Requirements
HEALTH & MONITORING			
GET	/api/v1/health	Basic health check	Internal Key Only
GET	/api/v1/health/detailed	Detailed health with dependencies	Internal Key Only
TEMPLATE MANAGEMENT			
POST	/api/v1/templates	Create new template	Internal Key + Admin Role
GET	/api/v1/templates	List templates (paginated)	Internal Key + (Admin/Editor Role)
GET	/api/v1/templates/:id	Get template by ID	Internal Key + (Admin/Editor Role)
PATCH	/api/v1/templates/:id	Update template	Internal Key + (Admin/Editor Role)
DELETE	/api/v1/templates/:id	Soft delete template	Internal Key + Admin Role
TEMPLATE RENDERING			
POST	/api/v1/templates/preview	Render template preview	Internal Key Only
GET	/api/v1/templates/code/:code	Get template by code	Internal Key Only
VERSION CONTROL			
GET	/api/v1/templates/:id/versions	Get version history	Internal Key + (Admin/Editor Role)
POST	/api/v1/templates/:id/versions/:version/revert	Revert to version	Internal Key + Admin Role
🧩 Request Examples
All Requests Require Internal Service Key
GET /api/v1/templates
x-service-key: your-internal-service-key

Admin-Only Endpoint
POST /api/v1/templates
x-service-key: your-internal-service-key
x-user-role: admin

Body Example:

{
  "template_code": "welcome_email",
  "name": "Welcome Email",
  "type": "email",
  "subject": "Welcome, {{name}}!",
  "body": "Hi {{name}}, click {{link}} to get started",
  "variables": ["name", "link"],
  "language": "en"
}

Template Preview (Internal Service Only)
POST /api/v1/templates/preview
x-service-key: your-service-key


Body Example:

{
  "template_code": "welcome_email",
  "variables": {
    "name": "Glory",
    "link": "https://app.com"
  }
}


Response:

{
  "success": true,
  "data": {
    "subject": "Welcome, Glory!",
    "body": "Hi Glory, click https://app.com to get started"
  },
  "message": "Template rendered successfully"
}

🛠️ Development
Database Operations
# Generate Prisma client
npx prisma generate

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

Testing
# Unit tests
npm run test

# End-to-End tests
npm run test:e2e

# Test coverage
npm run test:cov

📊 Health Monitoring

Basic Health: GET /api/v1/health (Internal key required)

Detailed Health: GET /api/v1/health/detailed (Includes PostgreSQL and Redis status)

🔧 Troubleshooting
Issue	Possible Fix
Authentication errors	Ensure x-service-key header is present for all requests
Authorization errors	Check role headers for restricted routes
Port 3003 in use	Run docker-compose down to stop existing containers
Database issues	Ensure PostgreSQL and Redis are running
Migration errors	Run npx prisma migrate reset
🐳 Docker Commands
# Check service logs
docker-compose logs -f template-service

# Execute Prisma commands inside container
docker-compose exec template-service npx prisma migrate status

# Restart specific service
docker-compose restart template-service

# Check environment variables
docker-compose exec template-service printenv INTERNAL_SERVICE_KEY

🚨 Security Notes

x-service-key is required for all API endpoints

Role-based headers are managed via API Gateway or Auth Service

Never commit keys to version control

Use different keys for development, staging, and production environments