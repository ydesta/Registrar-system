# Troubleshooting Guide

## Service Worker and Authentication Issues

### Issues Fixed

1. **"Unknown strategy: networkFirst" Error**
   - **Problem**: Angular Service Worker doesn't recognize `"networkFirst"` strategy
   - **Solution**: Changed to `"freshness"` and `"performance"` strategies in `ngsw-config.json`

2. **Manifest 404 Error**
   - **Problem**: `manifest.webmanifest` not being served correctly
   - **Solution**: Verified manifest file exists and web.config has correct MIME type

3. **Login Loop Issues**
   - **Problem**: Service worker caching causing authentication problems
   - **Solution**: Added error handling and cache clearing mechanisms

### Quick Fix Commands

#### For Users Experiencing Issues:

1. **Clear Browser Cache and Service Worker**:
   ```javascript
   // Run this in browser console
   window.clearSWCache();
   ```

2. **Manual Cache Clear**:
   ```javascript
   // Alternative manual approach
   caches.keys().then(names => names.forEach(name => caches.delete(name)));
   navigator.serviceWorker.getRegistrations().then(registrations => 
     registrations.forEach(registration => registration.unregister())
   );
   ```

3. **Clear Authentication Data**:
   ```javascript
   // Clear auth data only
   window.clearAuthData();
   ```

#### For Developers:

1. **Rebuild Application**:
   ```bash
   cd Web
   npm install
   ng build --configuration=production
   ```

2. **Deploy with Script**:
   ```bash
   cd Web
   chmod +x deploy-production.sh
   ./deploy-production.sh
   ```

### Common Issues and Solutions

#### 1. Service Worker Strategy Error
**Error**: `Unknown strategy: networkFirst`
**Solution**: 
- ✅ Fixed in `ngsw-config.json`
- Changed `"networkFirst"` to `"freshness"` and `"performance"`

#### 2. Manifest 404 Error
**Error**: `Failed to load resource: manifest.webmanifest`
**Solution**:
- ✅ Manifest file exists at `Web/src/manifest.webmanifest`
- ✅ Web.config has correct MIME type: `application/manifest+json`
- Ensure web server serves the file correctly

#### 3. Login Loop
**Problem**: User gets redirected back to login page after authentication
**Solutions**:
- Clear service worker cache
- Clear browser cache
- Check authentication token validity
- Verify API endpoints are accessible

#### 4. Network Errors
**Error**: `ERROR error in a request 404`
**Solutions**:
- Check API server is running
- Verify CORS configuration
- Check network connectivity
- Verify production URLs in environment files

### Debugging Steps

1. **Check Console Errors**:
   - Open browser developer tools
   - Look for service worker errors
   - Check network tab for failed requests

2. **Verify Service Worker**:
   ```javascript
   // Check if service worker is registered
   navigator.serviceWorker.getRegistration().then(reg => console.log(reg));
   ```

3. **Check Cache Status**:
   ```javascript
   // List all caches
   caches.keys().then(names => console.log('Caches:', names));
   ```

4. **Test API Endpoints**:
   - Check if API server is accessible
   - Verify authentication endpoints work
   - Test with Postman or similar tool

### Production Deployment Checklist

- [ ] Build application with production configuration
- [ ] Verify service worker files are generated
- [ ] Check manifest file is included in build
- [ ] Upload to web server
- [ ] Test in production environment
- [ ] Clear browser cache if needed

### Environment Configuration

**Production Environment** (`environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  baseUrl: 'https://hilcoe.edu.et:7123/api',
  fileUrl: 'https://hilcoe.edu.et:7123',
  secureUrl: "https://hilcoe.edu.et:7123/api",
};
```

### Service Worker Configuration

**Fixed Configuration** (`ngsw-config.json`):
```json
{
  "dataGroups": [
    {
      "name": "api-freshness",
      "urls": ["/api/**"],
      "cacheConfig": {
        "strategy": "freshness",
        "maxSize": 50,
        "maxAge": "1h",
        "timeout": "30s"
      }
    },
    {
      "name": "api-performance", 
      "urls": ["https://hilcoe.edu.et:7123/api/**"],
      "cacheConfig": {
        "strategy": "performance",
        "maxSize": 50,
        "maxAge": "1h",
        "timeout": "30s"
      }
    }
  ]
}
```

### Emergency Recovery

If the application is completely broken:

1. **Clear Everything**:
   ```javascript
   // Run in browser console
   localStorage.clear();
   sessionStorage.clear();
   caches.keys().then(names => names.forEach(name => caches.delete(name)));
   navigator.serviceWorker.getRegistrations().then(registrations => 
     registrations.forEach(registration => registration.unregister())
   );
   window.location.reload();
   ```

2. **Hard Refresh**:
   - Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or open in incognito/private mode

3. **Contact Support**:
   - Provide console error logs
   - Describe the exact steps to reproduce
   - Include browser and OS information

### Prevention

1. **Regular Cache Clearing**: Implement automatic cache clearing on version updates
2. **Error Monitoring**: Add error tracking for service worker issues
3. **Graceful Degradation**: Ensure app works without service worker
4. **Testing**: Test in multiple browsers and devices before deployment 