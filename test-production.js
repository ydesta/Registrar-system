const https = require('https');
const http = require('http');

console.log('�� Testing production cross-domain setup...\n');

const domains = [
  'https://hilcoe.edu.et:7123/api/health',
  'https://hilcoe.edu.et:7123/api/authentication/login',
  'https://hilcoe.edu.et:5000/api/health'
];

async function testDomain(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const timeout = 15000;
    
    // For HTTPS requests, ignore SSL certificate issues for testing
    const options = url.startsWith('https') ? {
      timeout,
      rejectUnauthorized: false // Ignore SSL certificate issues
    } : { timeout };
    
    const req = client.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          data: data.substring(0, 200),
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
  console.log('Frontend: https://staging.hilcoe.edu.et');
  console.log('API: https://hilcoe.edu.et:7123/api\n');
  
  for (const url of domains) {
    console.log(`Testing: ${url}`);
    const result = await testDomain(url);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    } else {
      console.log(`✅ Status: ${result.status} ${result.statusText}`);
      console.log(`📋 CORS Origin: ${result.headers['access-control-allow-origin'] || 'N/A'}`);
      console.log(`📋 Content-Type: ${result.headers['content-type'] || 'N/A'}`);
    }
    console.log('---');
  }
  
  console.log('\n🔍 Cross-domain CORS test...');
  console.log('Testing if staging.hilcoe.edu.et can access hilcoe.edu.et:7123');
}

runTests().catch(console.error);
