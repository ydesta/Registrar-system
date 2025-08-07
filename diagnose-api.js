const https = require('https');
const http = require('http');

// Test configuration - using localhost for development
const testUrls = [
  'https://localhost:7123/api/authentication/login',
  'https://localhost:7123/api/health',
  'https://localhost:7123/swagger',
  'http://localhost:5000/api/authentication/login',
  'http://localhost:5000/api/health'
];

console.log('🔍 Diagnosing API connectivity issues...\n');

async function testUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const timeout = 10000; // 10 seconds
    
    const req = client.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          data: data.substring(0, 200) + (data.length > 200 ? '...' : ''),
          error: null
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        status: null,
        statusText: null,
        headers: null,
        data: null,
        error: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: null,
        statusText: null,
        headers: null,
        data: null,
        error: 'Request timeout'
      });
    });
  });
}

async function runTests() {
  console.log('Testing localhost API endpoints...\n');
  
  for (const url of testUrls) {
    console.log(`Testing: ${url}`);
    const result = await testUrl(url);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    } else {
      console.log(`✅ Status: ${result.status} ${result.statusText}`);
      console.log(`📋 Content-Type: ${result.headers['content-type'] || 'N/A'}`);
      console.log(`🔒 CORS Headers: ${result.headers['access-control-allow-origin'] || 'N/A'}`);
    }
    console.log('---');
  }
  
  console.log('\n🔍 SSL Certificate Test...');
  
  // Test SSL certificate
  const sslTest = await testUrl('https://localhost:7123');
  if (sslTest.error) {
    console.log(`❌ SSL Error: ${sslTest.error}`);
  } else {
    console.log('✅ SSL certificate appears valid');
  }
  
  console.log('\n🔍 CORS Preflight Test...');
  
  // Test CORS preflight
  const corsTest = await testUrl('https://localhost:7123/api/authentication/login');
  if (corsTest.error) {
    console.log(`❌ CORS Error: ${corsTest.error}`);
  } else {
    console.log(`✅ CORS Status: ${corsTest.status}`);
    console.log(`📋 CORS Headers: ${JSON.stringify(corsTest.headers, null, 2)}`);
  }
}

runTests().catch(console.error); 