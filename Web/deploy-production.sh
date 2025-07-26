#!/bin/bash

# Production Deployment Script for Hilcoe SIS
# This script builds and prepares the Angular application for production deployment

echo "🚀 Starting production deployment..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the Web directory."
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.cache/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build for production
echo "🔨 Building for production..."
ng build --configuration=production

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    
    # Verify service worker files
    echo "🔍 Verifying service worker files..."
    if [ -f "dist/hilco-web/ngsw-worker.js" ]; then
        echo "✅ Service worker file found"
    else
        echo "⚠️ Warning: Service worker file not found"
    fi
    
    if [ -f "dist/hilco-web/ngsw-config.json" ]; then
        echo "✅ Service worker config found"
    else
        echo "⚠️ Warning: Service worker config not found"
    fi
    
    if [ -f "dist/hilco-web/manifest.webmanifest" ]; then
        echo "✅ Manifest file found"
    else
        echo "⚠️ Warning: Manifest file not found"
    fi
    
    # List important files
    echo "📋 Important files in dist/hilco-web/:"
    ls -la dist/hilco-web/ | grep -E "(ngsw|manifest|index|favicon)"
    
    echo ""
    echo "🎉 Deployment package ready!"
    echo "📁 Output directory: dist/hilco-web/"
    echo ""
    echo "📝 Next steps:"
    echo "1. Upload the contents of dist/hilco-web/ to your web server"
    echo "2. Ensure your web server serves manifest.webmanifest with correct MIME type"
    echo "3. Test the application in production environment"
    echo "4. Clear browser cache if experiencing issues"
    
else
    echo "❌ Build failed!"
    exit 1
fi 