🎯 Template Service

A high-performance microservice for managing notification templates across email, push, and SMS channels. Built with NestJS, featuring version control, Redis caching, and Handlebars templating.

✨ Features

🚀 Multi-channel Templates – Email, push notifications, SMS

🔄 Version Control – Full audit trail with rollback capability

⚡ Redis Caching – Fast template retrieval

🎨 Handlebars Engine – Powerful variable substitution with custom helpers

🔐 Role-Based Access – Admin and editor roles with internal service authentication

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
git clone <repository-url>
cd template-service

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Run database migrations
npm run db:migrate

# 5. Start development server
npm run start:dev


Service available at: http://localhost:3000

Swagger API docs: http://localhost:3000/api/docs

Docker Deployment
# Using Docker Compose
docker-compose up -d

# Or build manually
docker build -t template-service .
docker run -d --name template-service -p 3000:3000 template-service

⚙️ Configuration
Environment Variables
Variable	Description	Default
DATABASE_URL	PostgreSQL connection string	postgresql://user:pass@localhost:5432/template_service
REDIS_HOST	Redis server host	localhost
REDIS_PORT	Redis server port	6379
REDIS_PASSWORD	Redis password (optional)	-
INTERNAL_SERVICE_KEY	Key for internal service communication	-
NODE_ENV	Application environment	development
API_PORT	Service port	3000
Docker Compose Example
version: '3.8'
services:
  template-service:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/template_service
      REDIS_HOST: redis
      INTERNAL_SERVICE_KEY: ${INTERNAL_SERVICE_KEY}
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: template_service
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:

📡 API Reference
Authorization

Internal Services: x-service-key: your-internal-service-key

Admin / Editor Users (via API Gateway):

x-user-role: admin | editor
x-auth-verified: true
x-user-id: user-uuid

Key Endpoints
Create Template (Admin Only)

POST /templates

Headers:
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

Preview Template (Internal Services)

POST /templates/preview

Headers:
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

Complete Endpoint List
Method	Endpoint	Description	Auth
POST	/templates	Create new template	Admin
GET	/templates	List templates (paginated)	Admin / Editor
GET	/templates/:id	Get template by ID	Admin / Editor
PATCH	/templates/:id	Update template	Admin / Editor
DELETE	/templates/:id	Soft delete template	Admin
POST	/templates/preview	Render template preview	Internal Service
GET	/templates/code/:code	Get template by code	Internal Service
GET	/templates/:id/versions	Get version history	Admin / Editor
POST	/templates/:id/versions/:version/revert	Revert to version	Admin / Editor
🔐 Authorization Matrix
Role	Create	Read	Update	Delete	Preview
Admin	✅	✅	✅	✅	✅
Editor	❌	✅	✅	❌	✅
Internal Service	❌	✅	❌	❌	✅