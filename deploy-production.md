# Production Deployment Guide - Fix 504 Timeout Issues

## 🚨 **Current Issues**
- 504 Gateway Timeout errors on login
- DNS resolution problems
- SSL certificate mismatches
- Cross-domain CORS issues

## 🔧 **Immediate Deployment Steps**

### 1. **Build and Deploy API**
```bash
# Navigate to API directory
cd SecureAuth.API

# Clean previous builds
dotnet clean

# Restore packages
dotnet restore

# Build for production
dotnet build -c Release

# Publish for production
dotnet publish -c Release -o ./publish --self-contained false

# Copy to production server
# (Replace with your actual deployment path)
```

### 2. **Update IIS Configuration**
Add to `web.config` in the API root:
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
    </handlers>
    <aspNetCore processPath="dotnet" arguments=".\SecureAuth.API.dll" stdoutLogEnabled="false" stdoutLogFile=".\logs\stdout" hostingModel="inprocess">
      <environmentVariables>
        <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Production" />
        <environmentVariable name="ASPNETCORE_URLS" value="http://localhost:7123" />
      </environmentVariables>
    </aspNetCore>
    <httpProtocol>
      <customHeaders>
        <add name="X-Frame-Options" value="DENY" />
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-XSS-Protection" value="1; mode=block" />
        <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
      </customHeaders>
    </httpProtocol>
    <httpErrors errorMode="Custom">
      <remove statusCode="504" />
      <error statusCode="504" path="/error/504.html" responseMode="ExecuteURL" />
    </httpErrors>
    <requestFiltering>
      <requestLimits maxAllowedContentLength="10485760" /> <!-- 10MB -->
    </requestFiltering>
  </system.webServer>
</configuration>
```

### 3. **Update Nginx Configuration (if using Nginx)**
```nginx
server {
    listen 443 ssl http2;
    server_name hilcoe.edu.et;
    
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    location /api/ {
        proxy_pass http://localhost:7123;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Extended timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }
    
    location / {
        proxy_pass http://localhost:4200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. **Database Connection Optimization**
```sql
-- Run these on your SQL Server
ALTER DATABASE SecureAuthDbA SET AUTO_CLOSE OFF;
ALTER DATABASE SecureAuthDbA SET AUTO_SHRINK OFF;
ALTER DATABASE SecureAuthDbA SET READ_COMMITTED_SNAPSHOT ON;

-- Check for long-running queries
SELECT 
    session_id,
    start_time,
    status,
    command,
    text,
    wait_type,
    wait_time,
    wait_resource
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.status = 'running'
ORDER BY start_time;
```

### 5. **Monitor and Test**
```bash
# Test API health
curl -X GET https://hilcoe.edu.et:7123/api/health

# Test database connectivity
curl -X GET https://hilcoe.edu.et:7123/api/health/database

# Test detailed health
curl -X GET https://hilcoe.edu.et:7123/api/health/detailed
```

## 📊 **Performance Monitoring**

### **Check Server Resources**
```bash
# CPU Usage
wmic cpu get loadpercentage

# Memory Usage
wmic OS get FreePhysicalMemory,TotalVisibleMemorySize

# Disk Space
wmic logicaldisk get size,freespace,caption

# Network Connectivity
ping hilcoe.edu.et
nslookup hilcoe.edu.et
```

### **Check Application Logs**
```bash
# IIS Logs
C:\inetpub\logs\LogFiles\W3SVC1\

# Application Logs
C:\inetpub\wwwroot\SecureAuth.API\logs\

# Event Viewer
eventvwr.msc
```

## ✅ **Success Criteria**

After deployment:
- ✅ API health endpoint returns 200 OK
- ✅ Database connectivity test passes
- ✅ Login requests complete within 30 seconds
- ✅ No 504 errors in browser console
- ✅ CORS headers are properly set
- ✅ SSL certificate is valid and matches hostname

## 🚨 **Emergency Rollback**

If issues persist:
1. **Revert to previous version**
2. **Check server resources** (CPU, memory, disk)
3. **Verify database connectivity**
4. **Check firewall settings**
5. **Review application logs for specific errors**

## 📞 **Support Contacts**

- **Server Administrator**: Check server status and resources
- **Database Administrator**: Verify SQL Server connectivity  
- **Network Administrator**: Check firewall and DNS settings
- **SSL Certificate Provider**: Verify certificate validity 