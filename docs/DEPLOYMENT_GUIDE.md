# Academica Flow - Deployment Guide

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7+
- Chroma Vector Store

### 1. Clone and Setup

```bash
git clone <repository-url>
cd academica-flow
npm install
```

### 2. Environment Configuration

Create `.env` file:

```env
# Database
DATABASE_URL="postgresql://academica_user:academica_password@localhost:5432/academica_flow"
TEST_DATABASE_URL="postgresql://test:test@localhost:5432/academica_flow_test"

# Redis
REDIS_URL="redis://localhost:6379"

# Vector Store
CHROMA_URL="http://localhost:8000"

# MCP Server
MCP_URL="http://localhost:3001"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# JWT
JWT_SECRET="your-jwt-secret"

# Environment
NODE_ENV="production"
LOG_LEVEL="info"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate:deploy

# Seed database (optional)
npm run db:seed
```

### 4. Deploy with Docker

```bash
# Deploy all services
npm run deploy

# Or manually with Docker Compose
docker-compose up -d
```

### 5. Verify Deployment

```bash
# Check service health
curl http://localhost:3000/health
curl http://localhost:3001/health

# Check logs
npm run docker:logs
```

## Detailed Deployment

### Production Deployment

1. **Prepare Production Environment**
   ```bash
   # Set production environment
   export NODE_ENV=production
   export LOG_LEVEL=info
   
   # Deploy with backup and monitoring
   ./deployment/scripts/deploy.sh production true true info
   ```

2. **Configure Monitoring**
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3001 (admin/admin)
   - Kibana: http://localhost:5601

3. **Setup SSL (Optional)**
   ```bash
   # Add SSL certificates to nginx/ssl/
   # Update nginx/nginx.conf for HTTPS
   ```

### Development Deployment

```bash
# Deploy development environment
./deployment/scripts/deploy.sh development false false debug
```

### Testing Deployment

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:nep-compliance
npm run test:performance
npm run test:e2e
```

## Backup and Recovery

### Create Backup

```bash
# Create full backup
npm run backup

# List available backups
npm run backup:list
```

### Restore from Backup

```bash
# Restore from specific backup
npm run backup:recover backups/20241201_120000.tar.gz
```

## Monitoring and Maintenance

### Health Checks

```bash
# Application health
curl http://localhost:3000/health

# Database health
docker exec academica-flow-db pg_isready -U academica_user -d academica_flow

# Redis health
docker exec academica-flow-redis redis-cli ping

# Vector store health
curl http://localhost:8000/api/v1/heartbeat
```

### Log Management

```bash
# View application logs
docker logs academica-flow-app

# View all service logs
npm run docker:logs

# View specific service logs
docker logs academica-flow-mcp
```

### Performance Monitoring

- **Grafana Dashboards**: http://localhost:3001
- **Prometheus Metrics**: http://localhost:9090
- **Kibana Logs**: http://localhost:5601

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database status
   docker exec academica-flow-db pg_isready -U academica_user -d academica_flow
   
   # Restart database
   docker-compose restart postgres
   ```

2. **Vector Store Issues**
   ```bash
   # Check Chroma status
   curl http://localhost:8000/api/v1/heartbeat
   
   # Restart Chroma
   docker-compose restart chroma
   ```

3. **MCP Server Issues**
   ```bash
   # Check MCP server
   curl http://localhost:3001/health
   
   # Restart MCP server
   docker-compose restart mcp-server
   ```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=debug
docker-compose up

# Run tests in debug mode
npm run test:debug
```

## Scaling

### Horizontal Scaling

1. **Load Balancer Configuration**
   ```yaml
   # nginx/nginx.conf
   upstream app_servers {
       server app1:3000;
       server app2:3000;
       server app3:3000;
   }
   ```

2. **Database Scaling**
   - Read replicas for read-heavy workloads
   - Connection pooling
   - Query optimization

3. **Vector Store Scaling**
   - Chroma cluster deployment
   - Index sharding
   - Caching strategies

### Vertical Scaling

1. **Resource Allocation**
   ```yaml
   # docker-compose.yml
   services:
     app:
       deploy:
         resources:
           limits:
             memory: 2G
             cpus: '1.0'
   ```

2. **Performance Tuning**
   - JVM heap size optimization
   - Database connection pool tuning
   - Cache size optimization

## Security

### Security Checklist

- [ ] SSL/TLS certificates configured
- [ ] Environment variables secured
- [ ] Database credentials encrypted
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers set
- [ ] Regular security updates

### Security Configuration

```yaml
# nginx/nginx.conf
server {
    listen 443 ssl;
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
```

## Maintenance

### Regular Maintenance Tasks

1. **Daily**
   - Check service health
   - Monitor error logs
   - Verify backup completion

2. **Weekly**
   - Review performance metrics
   - Update dependencies
   - Clean up old logs

3. **Monthly**
   - Security updates
   - Database optimization
   - Capacity planning

### Update Procedures

1. **Application Updates**
   ```bash
   # Pull latest changes
   git pull origin main
   
   # Rebuild and deploy
   docker-compose build
   docker-compose up -d
   ```

2. **Database Updates**
   ```bash
   # Run migrations
   npm run db:migrate:deploy
   ```

3. **Configuration Updates**
   ```bash
   # Update environment variables
   # Restart services
   docker-compose restart
   ```

## Support

### Getting Help

- **Documentation**: See `docs/` directory
- **Issues**: Create GitHub issue
- **Logs**: Check application logs for errors
- **Monitoring**: Use Grafana dashboards

### Contact Information

- **Technical Support**: support@academica-flow.com
- **Documentation**: docs@academica-flow.com
- **Security Issues**: security@academica-flow.com

