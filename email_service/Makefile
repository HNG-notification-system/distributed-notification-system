.PHONY: help install dev build start test lint format docker-build docker-up docker-down logs clean docker-restart send-test health status cloudamqp-info

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
	docker-compose restart email-service

logs: ## View service logs
	docker-compose logs -f email-service

send-test: ## Send test message to CloudAMQP queue
	node scripts/send-test-message.js

health: ## Check service health
	curl -sS http://localhost:3002/health | jq

status: ## Get detailed status
	curl -sS http://localhost:3002/status | jq

clean: ## Clean build artifacts and logs
	rm -rf dist node_modules logs/*.log

cloudamqp-info: ## Show CloudAMQP connection info
	@echo "CloudAMQP Dashboard: https://customer.cloudamqp.com/"
	@echo "Connection URL stored in: .env (CLOUDAMQP_URL)"
	@echo ""
	@echo "To view your queues and stats, login to CloudAMQP dashboard"