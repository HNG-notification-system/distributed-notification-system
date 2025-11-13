# ============================================================================
# DISTRIBUTED NOTIFICATION SYSTEM - PRODUCTION DOCKERFILE
# ============================================================================
# This Dockerfile builds and deploys the entire distributed notification system
# using Docker Compose orchestration. It includes all services with optimized
# layers, security hardening, and automated startup procedures.
#
# Build: docker build -t notification-system:latest .
# Run: docker-compose up -d (recommended)
# ============================================================================

# Stage 1: API Gateway Builder (Node.js/NestJS)
# ============================================================================
FROM node:18-alpine AS api-gateway-builder

WORKDIR /build/api-gateway

COPY services/api_gateway/package*.json ./
RUN npm ci

COPY services/api_gateway/ .

RUN npm run build


# Stage 2: Email Service Builder (Node.js/NestJS)
# ============================================================================
FROM node:18-alpine AS email-service-builder

WORKDIR /build/email-service

COPY services/email_service/package*.json ./
RUN npm ci

COPY services/email_service/ .

RUN npm run build


# Stage 3: Template Service Builder (Node.js/NestJS)
# ============================================================================
FROM node:18-alpine AS template-service-builder

WORKDIR /build/template-service

COPY services/template_service/package*.json ./
COPY services/template_service/prisma ./prisma/

RUN npm ci && npx prisma generate

COPY services/template_service/ .

RUN npm run build


# Stage 4: API Gateway Production
# ============================================================================
FROM node:18-alpine AS api-gateway-prod

WORKDIR /app

RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY services/api_gateway/package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=api-gateway-builder /build/api-gateway/dist ./dist

RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]


# Stage 5: Email Service Production
# ============================================================================
FROM node:18-alpine AS email-service-prod

WORKDIR /app

RUN apk add --no-cache dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY services/email_service/package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=email-service-builder /build/email-service/dist ./dist

RUN mkdir -p logs && chown -R nodejs:nodejs logs
USER nodejs

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]


# Stage 6: Template Service Production
# ============================================================================
FROM node:20-alpine AS template-service-prod

WORKDIR /app

RUN apk add --no-cache dumb-init curl postgresql-client && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY services/template_service/package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY services/template_service/prisma ./prisma/
COPY --from=template-service-builder /build/template-service/dist ./dist

# Create startup script for database migrations
COPY scripts/template-service-start.sh /app/start.sh
RUN chmod +x /app/start.sh && chown nodejs:nodejs /app/start.sh

USER nodejs

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:3005/api/v1/health || exit 1

ENTRYPOINT ["/app/start.sh"]


# Stage 7: User Service Production (Python)
# ============================================================================
FROM python:3.11-slim AS user-service-prod

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

COPY services/user_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services/user_service/ .

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3001"]


# Stage 8: Push Service Production (Python)
# ============================================================================
FROM python:3.11-slim AS push-service-prod

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

COPY services/push_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY services/push_service/ .

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3003/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3003"]


# Stage 9: Main Orchestrator/Deployment Stage
# ============================================================================
# This stage uses docker-compose for full system orchestration
# Build all services at once for efficient multi-architecture builds
FROM alpine:3.18 AS orchestrator

WORKDIR /app

# Install Docker Compose and essential tools
RUN apk add --no-cache docker-cli docker-compose curl bash

# Copy all service configurations
COPY docker-compose.yml ./
COPY .env.example ./.env.example
COPY Makefile ./
COPY services ./services
COPY nginx.conf ./

# Copy deployment script
COPY scripts/orchestrator-deploy.sh /app/deploy.sh
RUN chmod +x /app/deploy.sh

# Expose documentation port
EXPOSE 80 443

CMD ["/app/deploy.sh"]
