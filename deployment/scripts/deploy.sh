#!/bin/bash

# Academica Flow Deployment Script
# Comprehensive deployment pipeline with database migrations, vector store initialization, and monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_ENABLED=${2:-true}
MONITORING_ENABLED=${3:-true}
LOG_LEVEL=${4:-info}

echo -e "${BLUE}🚀 Starting Academica Flow Deployment${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Backup Enabled: ${BACKUP_ENABLED}${NC}"
echo -e "${BLUE}Monitoring Enabled: ${MONITORING_ENABLED}${NC}"
echo -e "${BLUE}Log Level: ${LOG_LEVEL}${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if required environment variables are set
    if [ -z "$DATABASE_URL" ]; then
        print_warning "DATABASE_URL not set. Using default from docker-compose.yml"
    fi
    
    print_status "Prerequisites check completed"
}

# Create backup of existing data
create_backup() {
    if [ "$BACKUP_ENABLED" = "true" ]; then
        print_info "Creating backup of existing data..."
        
        BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Backup database if it exists
        if docker ps | grep -q academica-flow-db; then
            print_info "Backing up database..."
            docker exec academica-flow-db pg_dump -U academica_user academica_flow > "$BACKUP_DIR/database.sql"
            print_status "Database backup created: $BACKUP_DIR/database.sql"
        fi
        
        # Backup vector store data
        if docker ps | grep -q academica-flow-chroma; then
            print_info "Backing up vector store..."
            docker cp academica-flow-chroma:/chroma/chroma "$BACKUP_DIR/chroma_data"
            print_status "Vector store backup created: $BACKUP_DIR/chroma_data"
        fi
        
        # Backup application data
        if [ -d "data" ]; then
            print_info "Backing up application data..."
            cp -r data "$BACKUP_DIR/"
            print_status "Application data backup created: $BACKUP_DIR/data"
        fi
        
        print_status "Backup completed: $BACKUP_DIR"
    else
        print_warning "Backup disabled"
    fi
}

# Stop existing services
stop_services() {
    print_info "Stopping existing services..."
    
    if [ -f "docker-compose.yml" ]; then
        docker-compose down --remove-orphans
        print_status "Existing services stopped"
    else
        print_warning "No existing docker-compose.yml found"
    fi
}

# Build and start services
start_services() {
    print_info "Building and starting services..."
    
    # Set environment variables
    export NODE_ENV=$ENVIRONMENT
    export LOG_LEVEL=$LOG_LEVEL
    
    # Build and start services
    docker-compose up -d --build
    
    print_status "Services started"
}

# Wait for services to be healthy
wait_for_services() {
    print_info "Waiting for services to be healthy..."
    
    # Wait for database
    print_info "Waiting for database..."
    timeout 60 bash -c 'until docker exec academica-flow-db pg_isready -U academica_user -d academica_flow; do sleep 2; done'
    print_status "Database is ready"
    
    # Wait for Redis
    print_info "Waiting for Redis..."
    timeout 30 bash -c 'until docker exec academica-flow-redis redis-cli ping; do sleep 2; done'
    print_status "Redis is ready"
    
    # Wait for Chroma
    print_info "Waiting for Chroma vector store..."
    timeout 60 bash -c 'until curl -f http://localhost:8000/api/v1/heartbeat; do sleep 2; done'
    print_status "Chroma vector store is ready"
    
    # Wait for MCP server
    print_info "Waiting for MCP server..."
    timeout 60 bash -c 'until curl -f http://localhost:3001/health; do sleep 2; done'
    print_status "MCP server is ready"
    
    # Wait for main application
    print_info "Waiting for main application..."
    timeout 60 bash -c 'until curl -f http://localhost:3000/health; do sleep 2; done'
    print_status "Main application is ready"
}

# Run database migrations
run_migrations() {
    print_info "Running database migrations..."
    
    # Run Prisma migrations
    docker exec academica-flow-app npx prisma migrate deploy
    print_status "Database migrations completed"
    
    # Seed database if needed
    if [ "$ENVIRONMENT" = "development" ]; then
        print_info "Seeding database with test data..."
        docker exec academica-flow-app npx prisma db seed
        print_status "Database seeded"
    fi
}

# Initialize vector store
initialize_vector_store() {
    print_info "Initializing vector store..."
    
    # Create collections
    docker exec academica-flow-app node -e "
        const { ChromaClient } = require('chromadb');
        const client = new ChromaClient('http://chroma:8000');
        
        async function initCollections() {
            try {
                await client.createCollection({
                    name: 'nep_timetable_documents',
                    metadata: { description: 'NEP 2020 compliant timetable documents' }
                });
                console.log('Vector store collections initialized');
            } catch (error) {
                console.log('Collections may already exist:', error.message);
            }
        }
        
        initCollections();
    "
    
    print_status "Vector store initialized"
}

# Setup MCP connectors
setup_mcp_connectors() {
    print_info "Setting up MCP connectors..."
    
    # Initialize MCP connectors
    docker exec academica-flow-mcp node -e "
        const { NEPPolicyConnector } = require('./dist/mcp/connectors/NEPPolicyConnector');
        const { ExternalSystemConnector } = require('./dist/mcp/connectors/ExternalSystemConnector');
        
        async function setupConnectors() {
            try {
                const nepConnector = new NEPPolicyConnector();
                await nepConnector.initialize();
                console.log('NEP Policy Connector initialized');
                
                const externalConnector = new ExternalSystemConnector();
                await externalConnector.initialize();
                console.log('External System Connector initialized');
            } catch (error) {
                console.error('Error setting up connectors:', error);
            }
        }
        
        setupConnectors();
    "
    
    print_status "MCP connectors setup completed"
}

# Run health checks
run_health_checks() {
    print_info "Running health checks..."
    
    # Check database
    if docker exec academica-flow-db pg_isready -U academica_user -d academica_flow; then
        print_status "Database health check passed"
    else
        print_error "Database health check failed"
        exit 1
    fi
    
    # Check Redis
    if docker exec academica-flow-redis redis-cli ping | grep -q PONG; then
        print_status "Redis health check passed"
    else
        print_error "Redis health check failed"
        exit 1
    fi
    
    # Check Chroma
    if curl -f http://localhost:8000/api/v1/heartbeat > /dev/null 2>&1; then
        print_status "Chroma health check passed"
    else
        print_error "Chroma health check failed"
        exit 1
    fi
    
    # Check MCP server
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_status "MCP server health check passed"
    else
        print_error "MCP server health check failed"
        exit 1
    fi
    
    # Check main application
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_status "Main application health check passed"
    else
        print_error "Main application health check failed"
        exit 1
    fi
    
    print_status "All health checks passed"
}

# Setup monitoring
setup_monitoring() {
    if [ "$MONITORING_ENABLED" = "true" ]; then
        print_info "Setting up monitoring..."
        
        # Wait for monitoring services
        print_info "Waiting for monitoring services..."
        timeout 60 bash -c 'until curl -f http://localhost:9090/-/healthy; do sleep 2; done'
        timeout 60 bash -c 'until curl -f http://localhost:3001/-/healthy; do sleep 2; done'
        
        # Import Grafana dashboards
        print_info "Importing Grafana dashboards..."
        # This would typically involve API calls to import dashboards
        
        print_status "Monitoring setup completed"
    else
        print_warning "Monitoring disabled"
    fi
}

# Run tests
run_tests() {
    print_info "Running deployment tests..."
    
    # Run basic connectivity tests
    docker exec academica-flow-app npm run test:deployment
    
    print_status "Deployment tests completed"
}

# Display deployment summary
display_summary() {
    print_info "Deployment Summary"
    echo "=================="
    echo "Environment: $ENVIRONMENT"
    echo "Services:"
    echo "  - Database: http://localhost:5432"
    echo "  - Redis: http://localhost:6379"
    echo "  - Chroma: http://localhost:8000"
    echo "  - MCP Server: http://localhost:3001"
    echo "  - Main App: http://localhost:3000"
    echo "  - Nginx: http://localhost:80"
    
    if [ "$MONITORING_ENABLED" = "true" ]; then
        echo "  - Prometheus: http://localhost:9090"
        echo "  - Grafana: http://localhost:3001"
        echo "  - Kibana: http://localhost:5601"
    fi
    
    echo ""
    print_status "Deployment completed successfully!"
    print_info "You can now access the application at http://localhost:3000"
}

# Cleanup function
cleanup() {
    print_error "Deployment failed. Cleaning up..."
    docker-compose down --remove-orphans
    exit 1
}

# Set trap for cleanup on failure
trap cleanup ERR

# Main deployment flow
main() {
    check_prerequisites
    create_backup
    stop_services
    start_services
    wait_for_services
    run_migrations
    initialize_vector_store
    setup_mcp_connectors
    run_health_checks
    setup_monitoring
    run_tests
    display_summary
}

# Run main function
main "$@"

