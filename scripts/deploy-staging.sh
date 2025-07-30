#!/bin/bash

# Second Brain Server - Staging Deployment Script

set -e

echo "🚀 Starting staging deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STAGING_SERVER="your-staging-server.com"
STAGING_USER="deploy"
APP_NAME="second-brain-server"
STAGING_DIR="/var/www/second-brain-staging"

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

# Pre-deployment checks
log_info "Running pre-deployment checks..."

# Check if we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "develop" ] && [ "$CURRENT_BRANCH" != "staging" ]; then
    log_warn "You're not on develop or staging branch. Current branch: $CURRENT_BRANCH"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_error "Deployment cancelled"
        exit 1
    fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    log_error "You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

# Run tests and validation
log_info "Running tests and validation..."
yarn validate

# Build the application
log_info "Building application..."
yarn build

# Create deployment package
log_info "Creating deployment package..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="second-brain-staging-${TIMESTAMP}.tar.gz"

tar -czf "$PACKAGE_NAME" \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=coverage \
    --exclude=tests \
    --exclude="*.log" \
    --exclude=".env*" \
    dist/ package.json yarn.lock

# Upload to staging server
log_info "Uploading to staging server..."
scp "$PACKAGE_NAME" "${STAGING_USER}@${STAGING_SERVER}:/tmp/"

# Deploy on staging server
log_info "Deploying on staging server..."
ssh "${STAGING_USER}@${STAGING_SERVER}" << EOF
    set -e
    
    # Create backup of current deployment
    if [ -d "$STAGING_DIR" ]; then
        sudo cp -r "$STAGING_DIR" "${STAGING_DIR}_backup_${TIMESTAMP}"
    fi
    
    # Create staging directory
    sudo mkdir -p "$STAGING_DIR"
    cd "$STAGING_DIR"
    
    # Extract new deployment
    sudo tar -xzf "/tmp/$PACKAGE_NAME"
    
    # Install dependencies
    sudo yarn install --production --frozen-lockfile
    
    # Set up environment
    sudo cp .env.staging .env
    
    # Restart the application
    sudo pm2 restart $APP_NAME-staging || sudo pm2 start dist/index.js --name $APP_NAME-staging
    
    # Health check
    sleep 10
    if curl -f http://localhost:5000/health; then
        echo "✅ Staging deployment successful!"
        # Clean up old backup (keep only last 3)
        sudo ls -t ${STAGING_DIR}_backup_* | tail -n +4 | sudo xargs rm -rf
    else
        echo "❌ Health check failed, rolling back..."
        sudo pm2 stop $APP_NAME-staging
        sudo rm -rf "$STAGING_DIR"
        sudo mv "${STAGING_DIR}_backup_${TIMESTAMP}" "$STAGING_DIR"
        sudo pm2 start $APP_NAME-staging
        exit 1
    fi
    
    # Clean up
    rm "/tmp/$PACKAGE_NAME"
EOF

# Clean up local package
rm "$PACKAGE_NAME"

log_info "🎉 Staging deployment completed successfully!"
log_info "Staging URL: https://$STAGING_SERVER"
