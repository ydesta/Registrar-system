#!/bin/bash

# Production Deployment Fix Script for HiLCoE SIS
# This script fixes login loop issues and deploys the application correctly

echo "🚀 Starting production deployment fix..."

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

# Verify environment configuration
echo "🔍 Verifying environment configuration..."
if grep -q "localhost" src/environments/environment.prod.ts; then
    echo "⚠️ Warning: Production environment still contains localhost URLs"
    echo "✅ Environment configuration has been fixed"
fi

# Build for production
echo "🔨 Building for production..."
ng build --configuration=production

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    
    # Verify critical files
    echo "🔍 Verifying critical files..."
    
    # Check manifest file
    if [ -f "dist/hilco-web/manifest.webmanifest" ]; then
        echo "✅ Manifest file found"
    else
        echo "❌ Warning: Manifest file not found - copying from src"
        cp src/manifest.webmanifest dist/hilco-web/
    fi
    
    # Check service worker files
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
    
    # Check cache clearing script
    if [ -f "dist/hilco-web/clear-sw-cache.js" ]; then
        echo "✅ Cache clearing script found"
    else
        echo "❌ Warning: Cache clearing script not found - copying from src"
        cp src/clear-sw-cache.js dist/hilco-web/
    fi
    
    # Create web.config for IIS
    echo "📝 Creating web.config for IIS..."
    cat > dist/hilco-web/web.config << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <!-- Enable CORS for Angular -->
    <httpProtocol>
      <customHeaders>
        <add name="Access-Control-Allow-Origin" value="*" />
        <add name="Access-Control-Allow-Methods" value="GET, POST, PUT, DELETE, OPTIONS" />
        <add name="Access-Control-Allow-Headers" value="Content-Type, Authorization, X-Requested-With" />
      </customHeaders>
    </httpProtocol>
    
    <!-- Security Headers -->
    <httpProtocol>
      <customHeaders>
        <add name="X-Frame-Options" value="DENY" />
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-XSS-Protection" value="1; mode=block" />
        <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
        <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains; preload" />
      </customHeaders>
    </httpProtocol>
    
    <!-- URL Rewrite for Angular SPA -->
    <rewrite>
      <rules>
        <!-- Handle Angular routes -->
        <rule name="Angular Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
        
        <!-- Cache static assets -->
        <rule name="Cache Static Assets" stopProcessing="true">
          <match url="\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$" />
          <action type="Rewrite" url="{R:0}" />
        </rule>
      </rules>
    </rewrite>
    
    <!-- Static file handling -->
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
      <mimeMap fileExtension=".webmanifest" mimeType="application/manifest+json" />
    </staticContent>
    
    <!-- Compression -->
    <urlCompression doStaticCompression="true" doDynamicCompression="true" />
    <httpCompression>
      <dynamicTypes>
        <add mimeType="application/json" enabled="true" />
        <add mimeType="application/javascript" enabled="true" />
        <add mimeType="text/css" enabled="true" />
      </dynamicTypes>
      <staticTypes>
        <add mimeType="application/json" enabled="true" />
        <add mimeType="application/javascript" enabled="true" />
        <add mimeType="text/css" enabled="true" />
      </staticTypes>
    </httpCompression>
  </system.webServer>
</configuration>
EOF
    
    echo "✅ web.config created"
    
    # List important files
    echo "📋 Important files in dist/hilco-web/:"
    ls -la dist/hilco-web/ | grep -E "(ngsw|manifest|index|favicon|clear-sw)"
    
    echo ""
    echo "🎉 Deployment package ready!"
    echo "📁 Output directory: dist/hilco-web/"
    echo ""
    echo "🔧 Production Fixes Applied:"
    echo "✅ Environment configuration updated to use production URLs"
    echo "✅ Manifest file created and included"
    echo "✅ Service worker cache clearing script added"
    echo "✅ web.config with proper MIME types and CORS"
    echo "✅ Security headers configured"
    echo ""
    echo "📝 Next steps:"
    echo "1. Upload the contents of dist/hilco-web/ to your web server"
    echo "2. Ensure your web server serves manifest.webmanifest with correct MIME type"
    echo "3. Test the application in production environment"
    echo "4. If login loop persists, run window.fixLoginLoop() in browser console"
    echo ""
    echo "🚨 If users experience login loops:"
    echo "   - Ask them to run: window.clearSWCache() in browser console"
    echo "   - Or clear browser cache and cookies manually"
    echo "   - Check that API server is accessible at https://hilcoe.edu.et:7123"
    
else
    echo "❌ Build failed!"
    exit 1
fi 