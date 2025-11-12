# 📄 Template Service

The **Template Service** is a core component of the Distributed Notification System.  
It is responsible for **storing**, **managing**, and **retrieving** message templates used across various communication channels (e.g., email, push notifications, SMS).  
It also supports **variable substitution**, **multi-language templates**, and **version management**.

---

## 🚀 Features

- 🧩 Create, update, delete, and retrieve templates  
- 🔁 Maintain version history for templates  
- 🌍 Multi-language support  
- 🧠 Variable substitution using `{{variable_name}}`  
- ⚡ Redis caching for fast lookups  
- 🗃 PostgreSQL persistence  
- 🔐 Role-based access control (`admin`/`editor` / `user`)  
- 🩺 Health check endpoint (`/health`)

---

## 🏗️ Architecture

This service is part of a **microservices-based notification system** and communicates with others (e.g., `email_service`, `push_service`, `api_gateway`) via REST APIs and internal service keys.

api_gateway
├── template_service
├── email_service
├── push_service
└── user_service



## ⚙️ Tech Stack

- **Framework:** [NestJS](https://nestjs.com/)  
- **Language:** TypeScript  
- **ORM:** Prisma  
- **Database:** PostgreSQL  
- **Cache:** Redis  
- **Containerization:** Docker  
- **API Documentation:** Swagger (auto-generated)  

---

## 🧩 Environment Variables

Create a `.env` file in your `template_service` directory:

```env
# Server
PORT=3003
NODE_ENV=development

# Database
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db_name>

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TTL=300

# Service key (for internal service requests)
SERVICE_KEY=your_service_secret_key
🧱 Installation & Setup
1️⃣ Clone the repository
bash
Copy code
git clone https://github.com/HNG-notification-system/distributed-notification-system.git
cd distributed-notification-system/services/template_service
2️⃣ Install dependencies
bash
Copy code
npm install
3️⃣ Run database migrations
bash
Copy code
npx prisma migrate dev
4️⃣ Start the service
bash
Copy code
npm run start:dev
🐳 Docker Setup
To build and run the service inside Docker:

bash
Copy code
docker compose build template_service
docker compose up template_service
🧪 API Endpoints
Method	Endpoint	Description	Auth
POST	/templates	Create a new template	Admin
PUT	/templates/:id	Update a template	Admin
DELETE	/templates/:id	Delete a template	Admin
GET	/templates/:template_code	Get template by code	User
GET	/templates/:template_code/versions/:version	Get specific version	User
POST	/templates/preview	Preview a template with variables	Internal
GET	/health	Health check	Public

🔐 Headers
x-service-key: Used for internal service requests (e.g., preview or get by code)

x-user-role: Used for identifying user/admin actions

Note:
Use x-service-key only for internal service requests.
For admin/editor actions, include x-user-role as well.

🧰 Example Requests
➕ Create Template
bash
Copy code
POST /templates
Headers:
  x-service-key: your_service_secret_key
  x-user-role: admin
Body:
{
  "template_code": "welcome_email",
  "language": "en",
  "subject": "Welcome, {{name}}!",
  "body": "Hello {{name}}, thank you for joining us.",
  "variables": ["name"]
}
👁️ Preview Template
bash
Copy code
POST /templates/preview
Headers:
  x-service-key: your_service_secret_key
Body:
{
  "template_code": "welcome_email",
  "variables": {
    "name": "Glory"
  }
}
🩺 Health Check
bash
Copy code
GET /health
Response:

json
Copy code
{ "status": "ok", "service": "template_service" }
🧭 Swagger API Documentation
The service includes Swagger UI for easy API testing and documentation.

Access the docs
Once the server is running, open:

👉 http://localhost:3003/api/docs

Swagger Setup Code Snippet
If you’re cloning or modifying the service, ensure Swagger is configured in main.ts:

ts
Copy code
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Template Service API')
  .setDescription('API documentation for Template Service')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
🧑‍💻 Developer Notes
All responses follow a consistent format:

json
Copy code
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
Templates are cached in Redis for performance.

Use template_code + version to maintain version history.

🤝 Contributing
Fork this repository

Create a new branch: git checkout -b feat/add-new-feature

Commit changes: git commit -m "feat: add new feature"

Push and create a PR

🩵 Maintainers
Oparaocha Glory Mmachi – Backend Developer

Team: Distributed Notification System Developers

📜 License
This project is licensed under the MIT License.

