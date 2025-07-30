#!/bin/bash

# Second Brain Server - Production Deployment Script

set -e

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_SERVER="your-production-server.com"
PRODUCTION_USER="deploy"
APP_NAME="second-brain-server"
PRODUCTION_DIR="/var/www/second-brain-production"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Pre-deployment checks
log_step "Running pre-deployment checks..."

# Check if we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    log_error "Production deployments must be from 'main' branch. Current branch: $CURRENT_BRANCH"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    log_error "You have uncommitted changes. Please commit them first."
    exit 1
fi

# Check if we're up to date with remote
git fetch origin main
if [ $(git rev-list HEAD...origin/main --count) != 0 ]; then
    log_error "Your local main branch is not up to date with origin/main"
    exit 1
fi

# Confirmation prompt
log_warn "⚠️  You are about to deploy to PRODUCTION!"
log_warn "This will affect live users and data."
echo
read -p "Are you sure you want to continue? Type 'DEPLOY' to confirm: " -r
if [ "$REPLY" != "DEPLOY" ]; then
    log_error "Deployment cancelled"
    exit 1
fi

# Run comprehensive validation
log_step "Running comprehensive validation..."
yarn validate

# Security checks
log_step "Running security checks..."
yarn audit --audit-level moderate

# Build the application
log_step "Building application for production..."
NODE_ENV=production yarn build

# Create deployment package
log_step "Creating deployment package..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
VERSION=$(node -p "require('./package.json').version")
PACKAGE_NAME="second-brain-production-v${VERSION}-${TIMESTAMP}.tar.gz"

tar -czf "$PACKAGE_NAME" \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=coverage \
    --exclude=tests \
    --exclude="*.log" \
    --exclude=".env*" \
    --exclude="scripts/" \
    dist/ package.json yarn.lock

# Upload to production server
log_step "Uploading to production server..."
scp "$PACKAGE_NAME" "${PRODUCTION_USER}@${PRODUCTION_SERVER}:/tmp/"

# Deploy on production server
log_step "Deploying on production server..."
ssh "${PRODUCTION_USER}@${PRODUCTION_SERVER}" << EOF
    set -e
    
    echo "🔄 Starting production deployment on server..."
    
    # Create backup of current deployment
    if [ -d "$PRODUCTION_DIR" ]; then
        sudo cp -r "$PRODUCTION_DIR" "${PRODUCTION_DIR}_backup_${TIMESTAMP}"
        echo "✅ Backup created: ${PRODUCTION_DIR}_backup_${TIMESTAMP}"
    fi
    
    # Create production directory
    sudo mkdir -p "$PRODUCTION_DIR"
    cd "$PRODUCTION_DIR"
    
    # Extract new deployment
    sudo tar -xzf "/tmp/$PACKAGE_NAME"
    echo "✅ New deployment extracted"
    
    # Install dependencies
    sudo yarn install --production --frozen-lockfile --silent
    echo "✅ Dependencies installed"
    
    # Set up environment
    sudo cp .env.production .env
    echo "✅ Environment configured"
    
    # Run database migrations if needed
    # sudo yarn db:migrate
    
    # Graceful restart with zero downtime
    echo "🔄 Performing graceful restart..."
    
    # Start new instance on different port
    sudo pm2 start dist/index.js --name $APP_NAME-new --env production -- --port 5001
    
    # Wait for new instance to be ready
    sleep 15
    
    # Health check on new instance
    if curl -f http://localhost:5001/health; then
        echo "✅ New instance health check passed"
        
        # Switch traffic to new instance (update load balancer/nginx config)
        # This step depends on your infrastructure setup
        
        # Stop old instance
        sudo pm2 stop $APP_NAME || true
        sudo pm2 delete $APP_NAME || true
        
        # Rename new instance
        sudo pm2 stop $APP_NAME-new
        sudo pm2 delete $APP_NAME-new
        sudo pm2 start dist/index.js --name $APP_NAME --env production
        
        echo "✅ Production deployment successful!"
        
        # Clean up old backups (keep only last 5)
        sudo ls -t ${PRODUCTION_DIR}_backup_* | tail -n +6 | sudo xargs rm -rf
        
        # Save PM2 configuration
        sudo pm2 save
        
    else
        echo "❌ Health check failed, rolling back..."
        
        # Stop failed new instance
        sudo pm2 stop $APP_NAME-new || true
        sudo pm2 delete $APP_NAME-new || true
        
        # Restore backup
        sudo rm -rf "$PRODUCTION_DIR"
        sudo mv "${PRODUCTION_DIR}_backup_${TIMESTAMP}" "$PRODUCTION_DIR"
        
        # Restart old instance
        cd "$PRODUCTION_DIR"
        sudo pm2 restart $APP_NAME || sudo pm2 start dist/index.js --name $APP_NAME --env production
        
        echo "❌ Deployment failed and rolled back"
        exit 1
    fi
    
    # Clean up
    rm "/tmp/$PACKAGE_NAME"
EOF

# Clean up local package
rm "$PACKAGE_NAME"

# Tag the release
log_step "Tagging release..."
git tag -a "v${VERSION}-${TIMESTAMP}" -m "Production deployment v${VERSION} - ${TIMESTAMP}"
git push origin "v${VERSION}-${TIMESTAMP}"

# Notify team (you can integrate with Slack, Discord, etc.)
log_step "Sending deployment notification..."
# curl -X POST -H 'Content-type: application/json' \
#     --data '{"text":"🚀 Second Brain Server v'${VERSION}' deployed to production successfully!"}' \
#     YOUR_SLACK_WEBHOOK_URL

log_info "🎉 Production deployment completed successfully!"
log_info "Version: v${VERSION}"
log_info "Production URL: https://$PRODUCTION_SERVER"
log_info "Deployment time: $(date)"

echo
log_warn "📋 Post-deployment checklist:"
echo "  ✅ Verify application is running: https://$PRODUCTION_SERVER/health"
echo "  ✅ Check logs: ssh $PRODUCTION_USER@$PRODUCTION_SERVER 'pm2 logs $APP_NAME'"
echo "  ✅ Monitor error rates and performance"
echo "  ✅ Verify critical user flows"
