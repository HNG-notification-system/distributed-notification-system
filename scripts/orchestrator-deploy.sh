#!/bin/bash
set -e

echo "=========================================="
echo "Distributed Notification System Deployment"
echo "=========================================="
echo ""

# Load environment variables
if [ -f .env ]; then
    echo "Loading environment from .env..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No .env file found. Using defaults."
    cp .env.example .env
fi

echo ""
echo "Starting services with docker-compose..."
docker-compose up -d --build

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "Waiting for services to be healthy..."

# Wait for services to be ready
for i in {1..30}; do
  if curl -s http://localhost:3000/health > /dev/null 2>&1 && \
     curl -s http://localhost:3001/health > /dev/null 2>&1 && \
     curl -s http://localhost:3002/health > /dev/null 2>&1 && \
     curl -s http://localhost:3003/health > /dev/null 2>&1 && \
     curl -s http://localhost:3005/health > /dev/null 2>&1; then
    echo "✅ All services are healthy!"
    break
  fi
  echo "Waiting for services... ($i/30)"
  sleep 2
done

echo ""
echo "=========================================="
echo "Deployment Summary"
echo "=========================================="
echo "API Gateway:      http://localhost:3000"
echo "User Service:     http://localhost:3001"
echo "Email Service:    http://localhost:3002"
echo "Push Service:     http://localhost:3003"
echo "Template Service: http://localhost:3005"
echo "RabbitMQ UI:      http://localhost:15672"
echo "PostgreSQL:       localhost:5432"
echo "Redis:            localhost:6379"
echo ""
echo "For logs: docker-compose logs -f"
echo "For health check: make health"
echo "=========================================="
