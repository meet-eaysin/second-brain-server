# 🐳 Docker Setup Guide

This guide explains how to run the Second Brain Server using Docker.

## 📋 Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose (usually included with Docker Desktop)

### Install Docker

**Windows/Mac:**
1. Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)
2. Install and start Docker Desktop
3. Verify installation: `docker --version`

**Linux:**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

## 🚀 Quick Start

### Development Environment

```bash
# Start development server with hot reload
yarn docker:dev

# View logs
docker-compose logs -f

# Stop services
yarn docker:down
```

### Production Environment

```bash
# Start production server
yarn docker:prod

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## 📁 Docker Configuration

### Development (`docker-compose.yml`)
- **Hot reload**: Code changes reflect immediately
- **Debug port**: 9229 for debugging
- **Volume mounts**: Source code mounted for development

### Production (`docker-compose.prod.yml`)
- **Optimized build**: Multi-stage build with minimal image size
- **Security**: Non-root user, health checks
- **Resource limits**: Memory constraints for production

## 🔧 Environment Variables

Create `.env` file for development:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
```

Create `.env.production` file for production:
```env
NODE_ENV=production
PORT=5000
MONGO_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
```

## 🛠️ Docker Commands

### Basic Commands
```bash
# Build and start development
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Clean up
docker system prune -f
```

### Production Commands
```bash
# Build and start production
docker-compose -f docker-compose.prod.yml up --build

# Start production in background
docker-compose -f docker-compose.prod.yml up -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### Debugging
```bash
# Access container shell
docker exec -it second-brain-dev sh

# View container stats
docker stats

# Inspect container
docker inspect second-brain-dev
```

## 🔍 Health Checks

The containers include health checks that monitor:
- HTTP endpoint availability (`/health`)
- Response time and status codes
- Container restart on failure

## 📊 Monitoring

### View Container Status
```bash
docker ps
```

### View Resource Usage
```bash
docker stats
```

### View Logs
```bash
# All logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Specific service logs
docker-compose logs app
```

## 🚨 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find process using port 5000
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Mac/Linux

# Kill process or change port in docker-compose.yml
```

**Build failures:**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

**Permission issues (Linux):**
```bash
# Fix Docker permissions
sudo usermod -aG docker $USER
newgrp docker
```

### Performance Optimization

**For development:**
- Use volume mounts for hot reload
- Exclude `node_modules` from volume mounts
- Use `.dockerignore` to reduce build context

**For production:**
- Multi-stage builds for smaller images
- Non-root user for security
- Health checks for reliability
- Resource limits for stability

## 🔐 Security Best Practices

1. **Non-root user**: Production container runs as non-root
2. **Minimal base image**: Alpine Linux for smaller attack surface
3. **No secrets in Dockerfile**: Use environment variables
4. **Health checks**: Monitor container health
5. **Resource limits**: Prevent resource exhaustion

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale to 3 instances
docker-compose up --scale app=3

# Use load balancer (nginx, traefik, etc.)
```

### Vertical Scaling
```yaml
# In docker-compose.prod.yml
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '0.5'
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
- name: Build Docker image
  run: docker build -t second-brain-server .

- name: Run tests in Docker
  run: docker run --rm second-brain-server yarn test
```

### Production Deployment
```bash
# Build production image
docker build --target production -t second-brain-server:latest .

# Push to registry
docker push your-registry/second-brain-server:latest
```
