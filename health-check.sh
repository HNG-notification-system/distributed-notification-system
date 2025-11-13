#!/bin/bash

# ============================================================================
# HEALTH CHECK AND MONITORING SCRIPT
# ============================================================================
# This script monitors the health of all services and provides detailed status
#
# Usage: ./health-check.sh [options]
# Example: ./health-check.sh --continuous --interval=30
# ============================================================================

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
GRAY='\033[0;37m'
NC='\033[0m'

# Configuration
CONTINUOUS=false
INTERVAL=5
TIMEOUT=10
VERBOSE=false

# Service definitions
declare -A SERVICES=(
    [API_Gateway]="http://localhost:3000/health"
    [User_Service]="http://localhost:3001/health"
    [Email_Service]="http://localhost:3002/health"
    [Push_Service]="http://localhost:3003/health"
    [Template_Service]="http://localhost:3005/health"
)

declare -A INFRASTRUCTURE=(
    [PostgreSQL]="localhost:5432"
    [Redis]="localhost:6379"
    [RabbitMQ]="localhost:5672"
)

# Functions
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Service Health Check & Monitoring     ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
}

log_healthy() {
    echo -e "${GREEN}✅${NC} $1"
}

log_unhealthy() {
    echo -e "${RED}❌${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠️ ${NC} $1"
}

log_info() {
    echo -e "${BLUE}ℹ️ ${NC} $1"
}

check_service_health() {
    local service_name=$1
    local url=$2
    
    if [ "$VERBOSE" = true ]; then
        log_info "Checking $service_name..."
    fi
    
    local response=$(curl -s -w "\n%{http_code}" --connect-timeout 5 "$url" 2>/dev/null || echo -e "\n000")
    local http_code=$(echo "$response" | tail -n 1)
    local body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        log_healthy "$service_name (HTTP $http_code)"
        return 0
    else
        log_unhealthy "$service_name (HTTP $http_code)"
        if [ "$VERBOSE" = true ] && [ -n "$body" ]; then
            echo -e "${GRAY}  Response: $body${NC}"
        fi
        return 1
    fi
}

check_infrastructure() {
    local name=$1
    local host=$2
    local port=$3
    
    if [ "$VERBOSE" = true ]; then
        log_info "Checking $name ($host:$port)..."
    fi
    
    if timeout 5 bash -c "echo > /dev/tcp/$host/$port" 2>/dev/null; then
        log_healthy "$name ($host:$port)"
        return 0
    else
        log_unhealthy "$name ($host:$port)"
        return 1
    fi
}

check_docker_containers() {
    log_info "Docker Container Status:"
    echo ""
    
    docker-compose ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || log_warning "Docker Compose not available"
}

check_disk_space() {
    log_info "Disk Space Usage:"
    echo ""
    
    local usage=$(df -h . | awk 'NR==2 {print $5}')
    local available=$(df -h . | awk 'NR==2 {print $4}')
    
    echo "  Used: $usage"
    echo "  Available: $available"
}

check_memory_usage() {
    log_info "Memory Usage:"
    echo ""
    
    docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null || log_warning "Docker not available"
}

display_summary() {
    local healthy=0
    local unhealthy=0
    
    echo ""
    echo "═════════════════════════════════════════"
    echo "Health Check Summary"
    echo "═════════════════════════════════════════"
    echo ""
    
    # Check services
    log_info "Checking Microservices..."
    for service in "${!SERVICES[@]}"; do
        if check_service_health "$service" "${SERVICES[$service]}"; then
            ((healthy++))
        else
            ((unhealthy++))
        fi
    done
    
    echo ""
    log_info "Checking Infrastructure..."
    for infra in "${!INFRASTRUCTURE[@]}"; do
        local host_port="${INFRASTRUCTURE[$infra]}"
        local host="${host_port%:*}"
        local port="${host_port##*:}"
        
        if check_infrastructure "$infra" "$host" "$port"; then
            ((healthy++))
        else
            ((unhealthy++))
        fi
    done
    
    echo ""
    echo "═════════════════════════════════════════"
    echo "Summary: ${GREEN}$healthy healthy${NC} | ${RED}$unhealthy unhealthy${NC}"
    echo "═════════════════════════════════════════"
}

display_extended() {
    echo ""
    check_docker_containers
    echo ""
    check_disk_space
    echo ""
    check_memory_usage
}

show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

OPTIONS:
  -c, --continuous         Run continuous monitoring
  -i, --interval SECONDS   Set check interval (default: 5)
  -t, --timeout SECONDS    Set connection timeout (default: 10)
  -v, --verbose            Enable verbose output
  -e, --extended           Show extended information
  -h, --help              Show this help message

EXAMPLES:
  # One-time health check
  $0
  
  # Continuous monitoring every 10 seconds
  $0 --continuous --interval=10
  
  # Verbose output with extended info
  $0 --verbose --extended

EOF
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -c|--continuous)
                CONTINUOUS=true
                shift
                ;;
            -i|--interval)
                INTERVAL=$2
                shift 2
                ;;
            -t|--timeout)
                TIMEOUT=$2
                shift 2
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -e|--extended)
                EXTENDED=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

main() {
    parse_arguments "$@"
    
    print_header
    
    if [ "$CONTINUOUS" = true ]; then
        log_info "Starting continuous monitoring (interval: ${INTERVAL}s)"
        echo ""
        
        while true; do
            clear
            print_header
            display_summary
            
            if [ "$EXTENDED" = true ]; then
                display_extended
            fi
            
            log_info "Next check in $INTERVAL seconds... (Press Ctrl+C to stop)"
            sleep "$INTERVAL"
        done
    else
        display_summary
        
        if [ "$EXTENDED" = true ]; then
            display_extended
        fi
    fi
}

main "$@"
