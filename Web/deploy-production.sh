#!/bin/bash

# HiLCoE Production Deployment Script
# This script handles proper deployment with cache busting

echo "🚀 Starting HiLCoE Production Deployment..."

# Set variables
PROJECT_NAME="hilco-web"
BUILD_DIR="dist/$PROJECT_NAME"
DEPLOY_DIR="/var/www/html"
BACKUP_DIR="/var/www/backup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Clean previous builds
print_status "Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.cache/

# Step 2: Install dependencies
print_status "Installing dependencies..."
npm install

# Step 3: Build for production
print_status "Building for production..."
ng build --configuration=production

# Check if build was successful
if [ $? -ne 0 ]; then
    print_error "Build failed! Exiting..."
    exit 1
fi

print_status "Build completed successfully!"

# Step 4: Create backup of current deployment
print_status "Creating backup of current deployment..."
if [ -d "$DEPLOY_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    cp -r "$DEPLOY_DIR" "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S)"
fi

# Step 5: Deploy to production
print_status "Deploying to production..."
if [ -d "$BUILD_DIR" ]; then
    # Copy new files to deployment directory
    cp -r "$BUILD_DIR"/* "$DEPLOY_DIR/"
    
    # Set proper permissions
    chmod -R 755 "$DEPLOY_DIR"
    chown -R www-data:www-data "$DEPLOY_DIR"
    
    print_status "Deployment completed!"
else
    print_error "Build directory not found!"
    exit 1
fi

# Step 6: Verify deployment
print_status "Verifying deployment..."
if [ -f "$DEPLOY_DIR/index.html" ]; then
    print_status "✅ Deployment successful!"
    print_status "🌐 Application is now live at your domain"
else
    print_error "❌ Deployment verification failed!"
    exit 1
fi

# Step 7: Clear server cache (if using nginx/apache)
print_status "Clearing server cache..."
# Uncomment the appropriate line for your server:
# systemctl reload nginx  # For nginx
# systemctl reload apache2  # For apache

print_status "🎉 Deployment completed successfully!"
print_status "📝 Remember to clear browser cache or test in incognito mode"

# Optional: Send notification
# curl -X POST -H 'Content-type: application/json' --data '{"text":"HiLCoE deployment completed successfully!"}' YOUR_SLACK_WEBHOOK_URL

echo ""
echo "🔍 Post-deployment checklist:"
echo "  1. Clear browser cache (Ctrl+Shift+R)"
echo "  2. Test in incognito/private mode"
echo "  3. Verify login functionality"
echo "  4. Check console for any errors"
echo "  5. Test all major features"
echo ""
echo "📞 If issues persist, check:"
echo "  - Browser console (F12)"
echo "  - Server error logs"
echo "  - Network connectivity"
echo "  - SSL certificate validity" 