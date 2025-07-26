# Quick Fix for 504 Gateway Timeout Errors

## 🔧 **Immediate Actions**

### 1. **Deploy the Updated API**
```bash
# Build and deploy the API with timeout fixes
cd SecureAuth.API
dotnet publish -c Release -o ./publish
```

### 2. **Test API Connectivity**
```bash
# Run the diagnostic script
node diagnose-api.js
```

### 3. **Check These Endpoints**
- `https://hilcoe.edu.et:7123/api/health` - Main health check
- `https://hilcoe.edu.et:7123/api/health/ping` - Simple ping
- `https://hilcoe.edu.et:7123/api/authentication/health` - Auth health

## 🚨 **Common Causes of 504 Errors**

### **Server Issues:**
1. **API not running** - Check if the API service is started
2. **Wrong port** - Verify API is running on port 7123
3. **Firewall blocking** - Check firewall settings
4. **Server overloaded** - Monitor CPU/memory usage

### **Database Issues:**
1. **Database connection timeout** - Fixed with new connection string
2. **Database server down** - Check SQL Server status
3. **Network connectivity** - Test database connectivity

### **Network Issues:**
1. **DNS resolution** - Check domain resolution
2. **Load balancer timeout** - Check proxy settings
3. **SSL/TLS issues** - Verify certificates

## 🔍 **Diagnostic Steps**

### **Step 1: Check API Status**
```bash
curl -X GET https://hilcoe.edu.et:7123/api/health
```

### **Step 2: Check Database**
```bash
curl -X GET https://hilcoe.edu.et:7123/api/health/database
```

### **Step 3: Test Simple Endpoint**
```bash
curl -X GET https://hilcoe.edu.et:7123/api/health/ping
```

## 🛠️ **Server Configuration**

### **IIS Configuration (if using IIS)**
```xml
<system.webServer>
  <httpProtocol>
    <customHeaders>
      <add name="X-Frame-Options" value="DENY" />
    </customHeaders>
  </httpProtocol>
  <httpErrors errorMode="Custom">
    <remove statusCode="504" />
    <error statusCode="504" path="/error/504.html" responseMode="ExecuteURL" />
  </httpErrors>
</system.webServer>
```

### **Nginx Configuration (if using Nginx)**
```nginx
proxy_connect_timeout 30s;
proxy_send_timeout 30s;
proxy_read_timeout 30s;
```

## 📊 **Monitoring**

### **Check Server Logs**
- Application logs: `SecureAuth.API/logs/`
- IIS logs: `C:\inetpub\logs\LogFiles\`
- Event Viewer: Application and System logs

### **Monitor Resources**
- CPU usage should be < 80%
- Memory usage should be < 90%
- Disk space should have > 10% free
- Network connectivity to database server

## ✅ **Success Criteria**

After deploying the fixes:
- ✅ API health endpoint returns 200 OK
- ✅ Login requests complete within 30 seconds
- ✅ No 504 errors in browser console
- ✅ Database connectivity test passes
- ✅ All endpoints respond within timeout limits

## 🚨 **If Issues Persist**

1. **Check server resources** - CPU, memory, disk space
2. **Verify database connectivity** - Test SQL Server connection
3. **Check network connectivity** - Test DNS and firewall
4. **Review application logs** - Look for specific error messages
5. **Test with different browsers** - Rule out browser-specific issues

## 📞 **Emergency Contacts**

- **Server Administrator**: Check server status and resources
- **Database Administrator**: Verify SQL Server connectivity
- **Network Administrator**: Check firewall and DNS settings 