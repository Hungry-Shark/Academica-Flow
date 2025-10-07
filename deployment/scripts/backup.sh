#!/bin/bash

# Academica Flow Backup Script
# Comprehensive backup and recovery procedures

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
RETENTION_DAYS=${1:-30}
COMPRESS_BACKUP=${2:-true}

echo -e "${BLUE}💾 Starting Academica Flow Backup${NC}"
echo -e "${BLUE}Backup Directory: ${BACKUP_DIR}${NC}"
echo -e "${BLUE}Retention Days: ${RETENTION_DAYS}${NC}"
echo -e "${BLUE}Compress Backup: ${COMPRESS_BACKUP}${NC}"

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

# Create backup directory
create_backup_dir() {
    print_info "Creating backup directory..."
    mkdir -p "$BACKUP_DIR"
    print_status "Backup directory created: $BACKUP_DIR"
}

# Backup database
backup_database() {
    print_info "Backing up database..."
    
    if docker ps | grep -q academica-flow-db; then
        # Create database dump
        docker exec academica-flow-db pg_dump -U academica_user -d academica_flow > "$BACKUP_DIR/database.sql"
        
        # Create schema dump
        docker exec academica-flow-db pg_dump -U academica_user -d academica_flow --schema-only > "$BACKUP_DIR/schema.sql"
        
        # Create data dump
        docker exec academica-flow-db pg_dump -U academica_user -d academica_flow --data-only > "$BACKUP_DIR/data.sql"
        
        print_status "Database backup completed"
    else
        print_warning "Database container not running. Skipping database backup."
    fi
}

# Backup vector store
backup_vector_store() {
    print_info "Backing up vector store..."
    
    if docker ps | grep -q academica-flow-chroma; then
        # Create vector store backup
        docker cp academica-flow-chroma:/chroma/chroma "$BACKUP_DIR/chroma_data"
        print_status "Vector store backup completed"
    else
        print_warning "Chroma container not running. Skipping vector store backup."
    fi
}

# Backup Redis data
backup_redis() {
    print_info "Backing up Redis data..."
    
    if docker ps | grep -q academica-flow-redis; then
        # Create Redis backup
        docker exec academica-flow-redis redis-cli BGSAVE
        docker cp academica-flow-redis:/data/dump.rdb "$BACKUP_DIR/redis_dump.rdb"
        print_status "Redis backup completed"
    else
        print_warning "Redis container not running. Skipping Redis backup."
    fi
}

# Backup application data
backup_application_data() {
    print_info "Backing up application data..."
    
    # Backup configuration files
    if [ -f "docker-compose.yml" ]; then
        cp docker-compose.yml "$BACKUP_DIR/"
    fi
    
    if [ -f ".env" ]; then
        cp .env "$BACKUP_DIR/"
    fi
    
    # Backup Prisma schema
    if [ -f "prisma/schema.prisma" ]; then
        cp -r prisma "$BACKUP_DIR/"
    fi
    
    # Backup deployment scripts
    if [ -d "deployment" ]; then
        cp -r deployment "$BACKUP_DIR/"
    fi
    
    # Backup monitoring configuration
    if [ -d "monitoring" ]; then
        cp -r monitoring "$BACKUP_DIR/"
    fi
    
    print_status "Application data backup completed"
}

# Backup logs
backup_logs() {
    print_info "Backing up application logs..."
    
    # Create logs directory
    mkdir -p "$BACKUP_DIR/logs"
    
    # Backup container logs
    if docker ps | grep -q academica-flow-app; then
        docker logs academica-flow-app > "$BACKUP_DIR/logs/app.log" 2>&1
    fi
    
    if docker ps | grep -q academica-flow-mcp; then
        docker logs academica-flow-mcp > "$BACKUP_DIR/logs/mcp.log" 2>&1
    fi
    
    if docker ps | grep -q academica-flow-db; then
        docker logs academica-flow-db > "$BACKUP_DIR/logs/database.log" 2>&1
    fi
    
    if docker ps | grep -q academica-flow-redis; then
        docker logs academica-flow-redis > "$BACKUP_DIR/logs/redis.log" 2>&1
    fi
    
    if docker ps | grep -q academica-flow-chroma; then
        docker logs academica-flow-chroma > "$BACKUP_DIR/logs/chroma.log" 2>&1
    fi
    
    print_status "Logs backup completed"
}

# Create backup manifest
create_backup_manifest() {
    print_info "Creating backup manifest..."
    
    cat > "$BACKUP_DIR/manifest.json" << EOF
{
  "backup_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "backup_version": "1.0.0",
  "environment": "production",
  "components": {
    "database": {
      "included": true,
      "files": ["database.sql", "schema.sql", "data.sql"]
    },
    "vector_store": {
      "included": true,
      "files": ["chroma_data/"]
    },
    "redis": {
      "included": true,
      "files": ["redis_dump.rdb"]
    },
    "application_data": {
      "included": true,
      "files": ["docker-compose.yml", ".env", "prisma/", "deployment/", "monitoring/"]
    },
    "logs": {
      "included": true,
      "files": ["logs/"]
    }
  },
  "backup_size": "$(du -sh "$BACKUP_DIR" | cut -f1)",
  "retention_days": $RETENTION_DAYS
}
EOF
    
    print_status "Backup manifest created"
}

# Compress backup
compress_backup() {
    if [ "$COMPRESS_BACKUP" = "true" ]; then
        print_info "Compressing backup..."
        
        cd "$(dirname "$BACKUP_DIR")"
        tar -czf "$(basename "$BACKUP_DIR").tar.gz" "$(basename "$BACKUP_DIR")"
        
        # Remove uncompressed directory
        rm -rf "$(basename "$BACKUP_DIR")"
        
        print_status "Backup compressed: $(basename "$BACKUP_DIR").tar.gz"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    print_info "Cleaning up old backups..."
    
    # Find and remove backups older than retention period
    find backups -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
    find backups -name "20*" -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \;
    
    print_status "Old backups cleaned up (retention: $RETENTION_DAYS days)"
}

# Verify backup integrity
verify_backup() {
    print_info "Verifying backup integrity..."
    
    # Check if backup directory exists
    if [ ! -d "$BACKUP_DIR" ]; then
        print_error "Backup directory not found"
        exit 1
    fi
    
    # Check if essential files exist
    if [ ! -f "$BACKUP_DIR/database.sql" ]; then
        print_warning "Database backup not found"
    fi
    
    if [ ! -d "$BACKUP_DIR/chroma_data" ]; then
        print_warning "Vector store backup not found"
    fi
    
    if [ ! -f "$BACKUP_DIR/manifest.json" ]; then
        print_warning "Backup manifest not found"
    fi
    
    print_status "Backup verification completed"
}

# Display backup summary
display_backup_summary() {
    print_info "Backup Summary"
    echo "=============="
    echo "Backup Directory: $BACKUP_DIR"
    echo "Backup Size: $(du -sh "$BACKUP_DIR" | cut -f1)"
    echo "Files:"
    find "$BACKUP_DIR" -type f | wc -l | xargs echo "  Total files:"
    echo "  - Database: $(ls -la "$BACKUP_DIR"/*.sql 2>/dev/null | wc -l) files"
    echo "  - Vector Store: $(find "$BACKUP_DIR/chroma_data" -type f 2>/dev/null | wc -l) files"
    echo "  - Logs: $(find "$BACKUP_DIR/logs" -type f 2>/dev/null | wc -l) files"
    echo ""
    print_status "Backup completed successfully!"
}

# Recovery function
recover_from_backup() {
    local backup_path=$1
    
    if [ -z "$backup_path" ]; then
        print_error "Backup path not specified"
        exit 1
    fi
    
    print_info "Recovering from backup: $backup_path"
    
    # Extract backup if compressed
    if [[ "$backup_path" == *.tar.gz ]]; then
        print_info "Extracting compressed backup..."
        tar -xzf "$backup_path"
        backup_path="${backup_path%.tar.gz}"
    fi
    
    # Stop services
    print_info "Stopping services..."
    docker-compose down
    
    # Restore database
    if [ -f "$backup_path/database.sql" ]; then
        print_info "Restoring database..."
        docker-compose up -d postgres
        sleep 10
        docker exec -i academica-flow-db psql -U academica_user -d academica_flow < "$backup_path/database.sql"
        print_status "Database restored"
    fi
    
    # Restore vector store
    if [ -d "$backup_path/chroma_data" ]; then
        print_info "Restoring vector store..."
        docker-compose up -d chroma
        sleep 10
        docker cp "$backup_path/chroma_data" academica-flow-chroma:/chroma/
        print_status "Vector store restored"
    fi
    
    # Restore Redis
    if [ -f "$backup_path/redis_dump.rdb" ]; then
        print_info "Restoring Redis data..."
        docker-compose up -d redis
        sleep 5
        docker cp "$backup_path/redis_dump.rdb" academica-flow-redis:/data/
        print_status "Redis data restored"
    fi
    
    # Start all services
    print_info "Starting all services..."
    docker-compose up -d
    
    print_status "Recovery completed successfully!"
}

# List available backups
list_backups() {
    print_info "Available backups:"
    echo "==================="
    
    if [ -d "backups" ]; then
        ls -la backups/ | grep -E "(^d|\.tar\.gz$)" | awk '{print $9, $6, $7, $8}' | while read -r name date time; do
            if [ -n "$name" ] && [ "$name" != "." ] && [ "$name" != ".." ]; then
                echo "  $name ($date $time)"
            fi
        done
    else
        print_warning "No backups found"
    fi
}

# Main function
main() {
    case "${1:-backup}" in
        "backup")
            create_backup_dir
            backup_database
            backup_vector_store
            backup_redis
            backup_application_data
            backup_logs
            create_backup_manifest
            compress_backup
            cleanup_old_backups
            verify_backup
            display_backup_summary
            ;;
        "recover")
            recover_from_backup "$2"
            ;;
        "list")
            list_backups
            ;;
        *)
            echo "Usage: $0 [backup|recover <backup_path>|list]"
            echo "  backup: Create a new backup"
            echo "  recover <backup_path>: Recover from a backup"
            echo "  list: List available backups"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

