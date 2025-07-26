// Mobile Debug Script
// Add this to your HTML for mobile debugging

function debugMobileIssues() {
  console.log('🔍 Mobile Debug Information:');
  
  // Device detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  console.log('Device Info:', {
    userAgent: navigator.userAgent,
    isMobile: isMobile,
    isIOS: isIOS,
    isAndroid: isAndroid,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight
  });
  
  // Connection info
  if ('connection' in navigator) {
    const connection = navigator.connection;
    console.log('Connection Info:', {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    });
  }
  
  // Test API connectivity
  testAPIConnectivity();
}

function testAPIConnectivity() {
  const endpoints = [
    'https://staging.hilcoe.edu.et:7123/api/health',
    'https://staging.hilcoe.edu.et:7123/api/health/ping',
    'https://staging.hilcoe.edu.et:7123/api/authentication/health'
  ];
  
  console.log('🌐 Testing API Connectivity...');
  
  endpoints.forEach(endpoint => {
    fetch(endpoint, { 
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      console.log(`✅ ${endpoint}: ${response.status} ${response.statusText}`);
    })
    .catch(error => {
      console.error(`❌ ${endpoint}: ${error.message}`);
    });
  });
}

// Service Worker Debug
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('📱 Service Worker Message:', event.data);
  });
  
  navigator.serviceWorker.addEventListener('error', (error) => {
    console.error('📱 Service Worker Error:', error);
  });
}

// Network Status
window.addEventListener('online', () => {
  console.log('🌐 Device is online');
});

window.addEventListener('offline', () => {
  console.log('📴 Device is offline');
});

// Run debug on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', debugMobileIssues);
} else {
  debugMobileIssues();
}

// Export for use in console
window.debugMobileIssues = debugMobileIssues;
window.testAPIConnectivity = testAPIConnectivity; 