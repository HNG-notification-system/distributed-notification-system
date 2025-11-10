.PHONY: help install dev build start test lint format docker-build docker-up docker-down logs clean

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm install

dev: ## Run in development mode
	npm run start:dev

build: ## Build NestJS application
	npm run build

start: ## Start production server
	npm run start:prod

test: ## Run tests
	npm test

lint: ## Run linter
	npm run lint

format: ## Format code with Prettier
	npm run format

docker-build: ## Build Docker image
	docker build -t email-service:latest .

docker-up: ## Start services with Docker Compose
	docker-compose up -d

docker-down: ## Stop services
	docker-compose down

docker-restart: ## Restart services
	docker-compose restart

logs: ## View service logs
	docker-compose logs -f email-service

logs-rabbitmq: ## View RabbitMQ logs
	docker-compose logs -f rabbitmq

send-test: ## Send test message to queue
	node scripts/send-test-message.js

health: ## Check service health
	curl http://localhost:3002/health | jq

status: ## Get detailed status
	curl http://localhost:3002/status | jq

clean: ## Clean build artifacts and logs
	rm -rf dist node_modules logs/*.log

rabbitmq-ui: ## Open RabbitMQ Management UI
	@echo "Opening RabbitMQ Management UI..."
	@echo "URL: http://localhost:15672"
	@echo "Username: admin"
	@echo "Password: admin123"
