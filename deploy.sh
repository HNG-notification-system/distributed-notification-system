#!/bin/bash

# ============================================================================
# DEPLOYMENT SCRIPT FOR DISTRIBUTED NOTIFICATION SYSTEM
# ============================================================================
# This script automates the entire deployment process including:
# - Environment setup
# - Docker image building
# - Service startup with health verification
# - Post-deployment configuration
#
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production
# ============================================================================

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
PROJECT_NAME="distributed-notification-system"
COMPOSE_FILE="docker-compose.yml"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    log_success "Docker is installed"
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    log_success "Docker Compose is installed"
    
    # Check Docker daemon
    if ! docker ps &> /dev/null; then
        log_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    log_success "Docker daemon is running"
}

setup_environment() {
    log_info "Setting up environment for $ENVIRONMENT..."
    
    if [ -f ".env" ]; then
        log_warning ".env file already exists. Backing up to .env.bak"
        cp .env .env.bak
    fi
    
    if [ -f ".env.$ENVIRONMENT" ]; then
        log_info "Loading environment from .env.$ENVIRONMENT"
        cp .env.$ENVIRONMENT .env
    elif [ -f ".env.example" ]; then
        log_warning ".env.$ENVIRONMENT not found. Using .env.example as template"
        cp .env.example .env
    else
        log_error ".env.example not found. Cannot setup environment."
        exit 1
    fi
    
    log_success "Environment configured"
}

build_images() {
    log_info "Building Docker images..."
    
    docker-compose build --no-cache
    
    log_success "Docker images built successfully"
}

start_services() {
    log_info "Starting services with docker-compose..."
    
    docker-compose up -d
    
    log_success "Services started"
}

wait_for_services() {
    log_info "Waiting for services to be healthy..."
    
    declare -a services=(
        "http://localhost:3000/health:API Gateway"
        "http://localhost:3001/health:User Service"
        "http://localhost:3002/health:Email Service"
        "http://localhost:3003/health:Push Service"
        "http://localhost:3005/health:Template Service"
    )
    
    max_attempts=60
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        all_healthy=true
        
        for service in "${services[@]}"; do
            url="${service%:*}"
            name="${service#*:}"
            
            if curl -sf "$url" > /dev/null 2>&1; then
                log_success "$name is healthy"
            else
                all_healthy=false
            fi
        done
        
        if [ "$all_healthy" = true ]; then
            log_success "All services are healthy!"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo "Waiting for services... ($attempt/$max_attempts)"
        sleep 2
    done
    
    log_warning "Services did not become healthy within timeout. Showing logs:"
    docker-compose logs
    return 1
}

display_summary() {
    log_info "Displaying deployment summary..."
    
    echo ""
    echo "=========================================="
    echo "🎉 Deployment Complete!"
    echo "=========================================="
    echo ""
    echo "📍 Service Endpoints:"
    echo "  • API Gateway:      http://localhost:3000"
    echo "  • User Service:     http://localhost:3001"
    echo "  • Email Service:    http://localhost:3002"
    echo "  • Push Service:     http://localhost:3003"
    echo "  • Template Service: http://localhost:3005"
    echo ""
    echo "🔧 Management UIs:"
    echo "  • RabbitMQ:         http://localhost:15672 (guest/guest)"
    echo "  • API Docs:         http://localhost:3000/api/docs"
    echo ""
    echo "💾 Infrastructure:"
    echo "  • PostgreSQL:       localhost:5432"
    echo "  • Redis:            localhost:6379"
    echo ""
    echo "📋 Useful Commands:"
    echo "  • View logs:        docker-compose logs -f"
    echo "  • Check health:     make health"
    echo "  • Stop services:    docker-compose down"
    echo "  • Restart services: docker-compose restart"
    echo ""
    echo "📚 Documentation:"
    echo "  • Project README:   ./README.md"
    echo "  • Makefile help:    make help"
    echo ""
    echo "=========================================="
}

cleanup_on_error() {
    log_error "Deployment failed. Cleaning up..."
    docker-compose down
    exit 1
}

# Main execution
trap cleanup_on_error EXIT

main() {
    echo ""
    echo "╔========================================╗"
    echo "║ 🚀 DEPLOYMENT AUTOMATION SCRIPT       ║"
    echo "║ Distributed Notification System       ║"
    echo "╚========================================╝"
    echo ""
    
    check_prerequisites
    setup_environment
    build_images
    start_services
    
    if wait_for_services; then
        display_summary
        trap - EXIT
        exit 0
    else
        trap cleanup_on_error EXIT
        exit 1
    fi
}

main "$@"
