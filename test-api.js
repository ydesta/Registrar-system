const http = require('http');

console.log('🔍 Testing if API is running...');

const req = http.get('http://localhost:7123/api/health', (res) => {
  console.log(`✅ API is running! Status: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`📋 Response: ${chunk.toString()}`);
  });
});

req.on('error', (error) => {
  console.log(`❌ API not running: ${error.message}`);
  console.log('💡 Make sure to run: dotnet run --project SecureAuth.API');
});

req.setTimeout(5000, () => {
  console.log('⏰ Request timeout - API might not be running');
});
