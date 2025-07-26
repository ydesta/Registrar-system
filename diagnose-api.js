const https = require('https');
const http = require('http');

// Test endpoints for cross-domain setup
const endpoints = [
  'https://hilcoe.edu.et:7123/api/health',
  'https://hilcoe.edu.et:7123/api/health/ping',
  'https://hilcoe.edu.et:7123/api/authentication/health',
  'https://staging.hilcoe.edu.et:7123/api/health',
  'https://staging.hilcoe.edu.et:7123/api/authentication/health'
];

function testEndpoint(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const timeout = setTimeout(() => {
      resolve({ url, status: 'TIMEOUT', error: 'Request timed out after 30 seconds' });
    }, 30000);

    const req = client.get(url, (res) => {
      clearTimeout(timeout);
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          headers: res.headers,
          data: data.substring(0, 200) // First 200 chars
        });
      });
    });

    req.on('error', (error) => {
      clearTimeout(timeout);
      resolve({ url, status: 'ERROR', error: error.message });
    });

    req.setTimeout(30000, () => {
      clearTimeout(timeout);
      req.destroy();
      resolve({ url, status: 'TIMEOUT', error: 'Request timed out' });
    });
  });
}

async function diagnoseAPI() {
  console.log('🔍 Diagnosing cross-domain API connectivity...\n');
  console.log('Setup: Frontend (staging.hilcoe.edu.et) -> API (hilcoe.edu.et:7123)\n');
  
  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint}`);
    const result = await testEndpoint(endpoint);
    
    if (result.status === 200) {
      console.log(`✅ SUCCESS (${result.status})`);
    } else if (result.status === 504) {
      console.log(`❌ GATEWAY TIMEOUT (${result.status})`);
    } else if (result.status === 'TIMEOUT') {
      console.log(`⏰ TIMEOUT: ${result.error}`);
    } else if (result.status === 'ERROR') {
      console.log(`❌ ERROR: ${result.error}`);
    } else {
      console.log(`⚠️  OTHER (${result.status}): ${result.error || 'Unknown error'}`);
    }
    
    if (result.data) {
      console.log(`   Response: ${result.data}`);
    }
    console.log('');
  }
  
  console.log('📋 Cross-Domain Setup Summary:');
  console.log('- Frontend: https://staging.hilcoe.edu.et');
  console.log('- API: https://hilcoe.edu.et:7123');
  console.log('- CORS should allow staging.hilcoe.edu.et to access hilcoe.edu.et:7123');
  console.log('- JWT Audience: staging.hilcoe.edu.et');
  console.log('- JWT Issuer: hilcoe.edu.et:7123');
  console.log('');
  console.log('🔧 Troubleshooting:');
  console.log('- Check CORS policy allows cross-domain requests');
  console.log('- Verify JWT configuration for cross-domain setup');
  console.log('- Ensure both domains are accessible');
  console.log('- Check firewall settings for both domains');
}

diagnoseAPI().catch(console.error); 