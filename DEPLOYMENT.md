# 🚀 Deployment Automation Guide

This document provides comprehensive instructions for deploying the Distributed Notification System using automated Docker deployment.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Deployment Methods](#deployment-methods)
4. [Configuration](#configuration)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)
7. [Production Deployment](#production-deployment)

---

## Quick Start

### Option 1: Automated Script (Recommended)

```bash
# Make the script executable
chmod +x deploy.sh

# Run deployment for development environment
./deploy.sh development

# Or for production
./deploy.sh production
```

### Option 2: Docker Compose Direct

```bash
# Copy environment file
cp .env.example .env

# Build and start all services
docker-compose up -d

# Check health
docker-compose ps
```

### Option 3: Using Makefile

```bash
# Build all services
make build-all

# Start all services
make up

# Check health
make health
```

---

## Prerequisites

### System Requirements

- **OS**: Linux, macOS, or Windows (with WSL2)
- **RAM**: Minimum 8GB (16GB recommended)
- **Disk Space**: Minimum 20GB
- **CPU**: 4 cores minimum

### Required Software

1. **Docker** (v20.10+)

   ```bash
   # Verify installation
   docker --version
   ```

2. **Docker Compose** (v1.29+)

   ```bash
   # Verify installation
   docker-compose --version
   ```

3. **curl** (for health checks)
   ```bash
   curl --version
   ```

### Installation

#### macOS (using Homebrew)

```bash
brew install docker docker-compose
```

#### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose curl
sudo usermod -aG docker $USER
```

#### Windows (with WSL2)

- Install WSL2: https://docs.microsoft.com/en-us/windows/wsl/install
- Install Docker Desktop with WSL2 support

---

## Deployment Methods

### Method 1: Automated Script (Recommended)

The `deploy.sh` script handles the entire deployment process:

```bash
./deploy.sh [environment]
```

**Features:**

- ✅ Prerequisite checking
- ✅ Environment configuration
- ✅ Docker image building
- ✅ Service startup
- ✅ Health verification
- ✅ Deployment summary

**Supported Environments:**

- `development` (default)
- `staging`
- `production`

**Example:**

```bash
./deploy.sh production
```

### Method 2: Docker Compose

Direct deployment using Docker Compose:

```bash
# Setup environment
cp .env.example .env
nano .env  # Edit as needed

# Build images
docker-compose build

# Start services
docker-compose up -d

# Verify
docker-compose ps
docker-compose logs -f
```

### Method 3: Makefile Commands

Using the provided Makefile:

```bash
# View all available commands
make help

# Build all services
make build-all

# Start all services
make up

# Check service health
make health

# View logs
make logs-follow

# Restart services
make restart

# Clean everything
make clean
```

### Method 4: Manual Dockerfile Build

For specific services:

```bash
# Build a specific service
docker build -t api-gateway:latest ./services/api_gateway

# Run the service
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  --name api-gateway \
  api-gateway:latest
```

---

## Configuration

### Environment Variables

#### Create .env file

```bash
cp .env.example .env
```

#### Key Variables

**Database:**

```env
POSTGRES_USER=admin
POSTGRES_PASSWORD=secure_password_here
POSTGRES_DB=notification_system
```

**Message Queue:**

```env
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

**Redis:**

```env
REDIS_URL=redis://localhost:6379
```

**JWT:**

```env
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=24h
```

**Email Service:**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=noreply@yourdomain.com
```

**Push Service:**

```env
FCM_SERVER_KEY=your_fcm_key
FCM_PROJECT_ID=your_project_id
```

**Node Environment:**

```env
NODE_ENV=production
LOG_LEVEL=info
```

### Port Configuration

| Service          | Port    | Purpose              |
| ---------------- | ------- | -------------------- |
| API Gateway      | 3000    | Main API entry point |
| User Service     | 3001    | User management      |
| Email Service    | 3002    | Email processing     |
| Push Service     | 3003    | Push notifications   |
| Template Service | 3005    | Template management  |
| PostgreSQL       | 5432    | Primary database     |
| Redis            | 6379    | Caching layer        |
| RabbitMQ         | 5672    | Message queue        |
| RabbitMQ UI      | 15672   | Management interface |
| Nginx            | 80, 443 | Reverse proxy        |

### Volume Configuration

```bash
# Check volumes
docker volume ls

# Inspect specific volume
docker volume inspect postgres_data

# Backup volume
docker run --rm -v postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz -C / data
```

---

## Post-Deployment

### 1. Verify All Services Are Running

```bash
docker-compose ps
```

**Expected Output:**

```
NAME                    STATUS              PORTS
postgres                Up (healthy)        5432/tcp
redis                   Up (healthy)        6379/tcp
rabbitmq                Up (healthy)        5672/tcp, 15672/tcp
api-gateway             Up (healthy)        3000/tcp
user-service            Up (healthy)        3001/tcp
email-service           Up (healthy)        3002/tcp
push-service            Up (healthy)        3003/tcp
template-service        Up (healthy)        3005/tcp
nginx                   Up (healthy)        80/tcp, 443/tcp
```

### 2. Check Health Status

```bash
# Check all services
make health

# Or manually check individual services
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3005/health
```

### 3. Access Management UIs

- **RabbitMQ Management**: http://localhost:15672

  - Username: `guest`
  - Password: `guest`

- **API Documentation**: http://localhost:3000/api/docs

- **PostgreSQL**: `localhost:5432`

  - Username: `admin`
  - Password: (from .env)

- **Redis**: `localhost:6379`

### 4. Run Database Migrations

```bash
# Migrations run automatically on template-service startup
# To manually run migrations:
docker-compose exec template-service npx prisma migrate deploy

# Seed database
docker-compose exec template-service npx prisma db seed
```

### 5. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway
docker-compose logs -f email-service
docker-compose logs -f user-service

# Last N lines
docker-compose logs --tail=100 api-gateway
```

### 6. Send Test Notification

```bash
curl -X POST http://localhost:3000/api/v1/notifications \
  -H "Content-Type: application/json" \
  -d '{
    "notification_type": "email",
    "user_id": "user-123",
    "template_code": "welcome_email",
    "variables": {
      "name": "John Doe",
      "verification_link": "https://app.com/verify/abc123"
    },
    "request_id": "req-123456",
    "priority": "high"
  }'
```

---

## Troubleshooting

### Common Issues

#### 1. Docker Daemon Not Running

```bash
# macOS
open -a Docker

# Linux
sudo systemctl start docker

# Windows - Start Docker Desktop
```

#### 2. Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change ports in docker-compose.yml
```

#### 3. Service Fails to Start

```bash
# Check logs
docker-compose logs api-gateway

# Restart service
docker-compose restart api-gateway

# Rebuild specific service
docker-compose build --no-cache api-gateway
```

#### 4. Database Connection Error

```bash
# Verify PostgreSQL is running
docker-compose exec postgres psql -U admin -d notification_system -c "SELECT 1"

# Check database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

#### 5. Out of Disk Space

```bash
# Check disk usage
docker system df

# Clean up unused resources
docker system prune -a

# Remove specific images
docker rmi <image_id>
```

#### 6. High Memory Usage

```bash
# Check resource usage
docker stats

# Limit container memory
# Edit docker-compose.yml and add:
# deploy:
#   resources:
#     limits:
#       memory: 512M
```

#### 7. Network Issues

```bash
# Check network
docker network ls

# Inspect notification-network
docker network inspect notification-network

# Restart network
docker-compose down
docker network prune
docker-compose up -d
```

### Debug Commands

```bash
# Enter container shell
docker-compose exec api-gateway sh

# Check environment variables
docker-compose exec api-gateway env

# Run one-off command
docker-compose run --rm api-gateway npm test

# View resource usage
docker stats

# Check network connectivity between containers
docker-compose exec api-gateway ping template-service
```

---

## Production Deployment

### Pre-Production Checklist

- [ ] All environment variables configured in `.env.production`
- [ ] SSL certificates configured in nginx
- [ ] Database backups configured
- [ ] Log aggregation setup
- [ ] Monitoring and alerting configured
- [ ] Rate limiting configured
- [ ] API keys and secrets rotated
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Load testing completed

### Production Environment Setup

```bash
# Copy production environment
cp .env.example .env.production

# Edit production variables
nano .env.production

# Run with production environment
./deploy.sh production
```

### Production Configuration

```env
# security
NODE_ENV=production
LOG_LEVEL=error
RATE_LIMIT_MAX=1000

# JWT
JWT_SECRET=very_secure_random_key_at_least_32_chars

# Database
POSTGRES_PASSWORD=very_strong_password_here

# Enable SSL in nginx
SSL_ENABLED=true
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

### Monitoring

```bash
# Setup continuous monitoring
watch -n 5 'docker-compose ps && echo && make health'

# Integrate with monitoring tools:
# - Prometheus for metrics
# - Grafana for dashboards
# - ELK Stack for logs
# - DataDog or New Relic for APM
```

### Backup Strategy

```bash
# Database backup
make backup-db

# Automated daily backup
0 2 * * * cd /path/to/app && make backup-db

# Volume backup
docker run --rm -v postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/db-$(date +\%Y\%m\%d).tar.gz -C / data
```

### Scaling

```bash
# Scale email service to 3 instances
make scale-email COUNT=3

# Scale push service to 5 instances
make scale-push COUNT=5

# Manual scaling
docker-compose up -d --scale email-service=3 --scale push-service=5
```

### Zero-Downtime Deployment

```bash
# 1. Build new images
docker-compose build

# 2. Create new containers without stopping old ones
docker-compose up -d --no-deps --build [service_name]

# 3. Remove old containers
docker-compose down

# 4. Start updated services
docker-compose up -d
```

---

## Advanced Topics

### Custom Docker Registry

```bash
# Tag image for registry
docker tag api-gateway:latest registry.example.com/api-gateway:latest

# Push to registry
docker push registry.example.com/api-gateway:latest

# Update docker-compose.yml to use registry
image: registry.example.com/api-gateway:latest
```

### Docker Compose Override

```yaml
# docker-compose.override.yml (for local development)
version: "3.8"

services:
  api-gateway:
    ports:
      - "3000:3000"
    environment:
      DEBUG: "true"
    volumes:
      - ./services/api_gateway/src:/app/src
```

### Health Check Configuration

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

---

## Support and Resources

- **Project README**: [README.md](./README.md)
- **Makefile Help**: `make help`
- **Docker Documentation**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **NestJS**: https://docs.nestjs.com/
- **FastAPI**: https://fastapi.tiangolo.com/

---

**Last Updated**: 2025-11-13
