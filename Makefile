.PHONY: help install-all build-all up down restart logs logs-follow ps health clean cloudamqp-info

help: ## Show this help message
	@echo 'Master Makefile - Distributed Notification System'
	@echo ''
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install-all: ## Install dependencies for all services
	@echo "Installing dependencies for all services..."
	cd api-gateway && npm install
	cd user-service && npm install
	cd email-service && npm install
	cd push-service && npm install
	cd template-service && npm install
	@echo "✅ All dependencies installed!"

build-all: ## Build all Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d
	@echo ""
	@echo "✅ All services started!"
	@echo ""
	@echo "Services running:"
	@echo "  - API Gateway:      http://localhost:3000"
	@echo "  - User Service:     http://localhost:3001"
	@echo "  - Email Service:    http://localhost:3002"
	@echo "  - Push Service:     http://localhost:3003"
	@echo "  - Template Service: http://localhost:3005"
	@echo "  - PostgreSQL:       localhost:5432"
	@echo "  - Redis:            localhost:6379"
	@echo ""
	@echo "CloudAMQP Dashboard: https://customer.cloudamqp.com/"
	@echo ""

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## View logs from all services
	docker-compose logs

logs-follow: ## Follow logs from all services
	docker-compose logs -f

logs-api: ## View API Gateway logs
	docker-compose logs -f api-gateway

logs-user: ## View User Service logs
	docker-compose logs -f user-service

logs-email: ## View Email Service logs
	docker-compose logs -f email-service

logs-push: ## View Push Service logs
	docker-compose logs -f push-service

logs-template: ## View Template Service logs
	docker-compose logs -f template-service

ps: ## Show running containers
	docker-compose ps

health: ## Check health of all services
	@echo "Checking service health..."
	@echo ""
	@echo "API Gateway:"
	@curl -s http://localhost:3000/health | jq -r '.data.status // "unhealthy"' || echo "❌ Not responding"
	@echo ""
	@echo "User Service:"
	@curl -s http://localhost:3001/health | jq -r '.data.status // "unhealthy"' || echo "❌ Not responding"
	@echo ""
	@echo "Email Service:"
	@curl -s http://localhost:3002/health | jq -r '.data.status // "unhealthy"' || echo "❌ Not responding"
	@echo ""
	@echo "Push Service:"
	@curl -s http://localhost:3003/health | jq -r '.data.status // "unhealthy"' || echo "❌ Not responding"
	@echo ""
	@echo "Template Service:"
	@curl -s http://localhost:3005/health | jq -r '.data.status // "unhealthy"' || echo "❌ Not responding"

clean: ## Clean all containers, volumes, and images
	docker-compose down -v
	docker system prune -f

rebuild: ## Rebuild and restart all services
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

scale-email: ## Scale email service (usage: make scale-email COUNT=3)
	docker-compose up -d --scale email-service=$(COUNT)

scale-push: ## Scale push service (usage: make scale-push COUNT=3)
	docker-compose up -d --scale push-service=$(COUNT)

backup-db: ## Backup PostgreSQL database
	docker-compose exec postgres pg_dump -U admin notification_system > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database backed up!"

cloudamqp-info: ## Show CloudAMQP info
	@echo "CloudAMQP Dashboard: https://customer.cloudamqp.com/"
	@echo ""
	@echo "View your queues and statistics in the CloudAMQP dashboard"
	@echo ""
	@echo "Queues used by services:"
	@echo "  - email.queue (Email Service)"
	@echo "  - push.queue (Push Service)"
	@echo "  - failed.queue (Dead Letter Queue)"