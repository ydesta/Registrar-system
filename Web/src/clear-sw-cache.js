// Utility script to clear service worker cache and fix authentication issues
// Run this in the browser console if you experience login loops or service worker errors

(function() {
  'use strict';
  
  console.log('🔧 Starting service worker cache cleanup...');
  
  // Clear all caches
  async function clearAllCaches() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        console.log('📦 Found caches:', cacheNames);
        
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log('🗑️ Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
        
        console.log('✅ All caches cleared successfully');
        return true;
      } catch (error) {
        console.error('❌ Error clearing caches:', error);
        return false;
      }
    } else {
      console.warn('⚠️ Cache API not supported');
      return false;
    }
  }
  
  // Unregister service workers
  async function unregisterServiceWorkers() {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('🔧 Found service worker registrations:', registrations.length);
        
        for (const registration of registrations) {
          console.log('🗑️ Unregistering service worker:', registration.scope);
          await registration.unregister();
        }
        
        console.log('✅ All service workers unregistered');
        return true;
      } catch (error) {
        console.error('❌ Error unregistering service workers:', error);
        return false;
      }
    } else {
      console.warn('⚠️ Service Worker API not supported');
      return false;
    }
  }
  
  // Clear authentication data
  function clearAuthData() {
    console.log('🔐 Clearing authentication data...');
    
    // Clear localStorage
    const authKeys = ['access_token', 'refresh_token', 'user', 'auth_data'];
    authKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log('🗑️ Removed from localStorage:', key);
      }
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    console.log('🗑️ Cleared sessionStorage');
    
    // Clear cookies (if any)
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    console.log('🗑️ Cleared cookies');
  }
  
  // Main cleanup function
  async function performCleanup() {
    console.log('🚀 Starting comprehensive cleanup...');
    
    // Clear authentication data first
    clearAuthData();
    
    // Clear caches
    const cacheCleared = await clearAllCaches();
    
    // Unregister service workers
    const swUnregistered = await unregisterServiceWorkers();
    
    console.log('📊 Cleanup Summary:');
    console.log('   Cache cleared:', cacheCleared ? '✅' : '❌');
    console.log('   Service workers unregistered:', swUnregistered ? '✅' : '❌');
    console.log('   Auth data cleared: ✅');
    
    if (cacheCleared && swUnregistered) {
      console.log('🎉 Cleanup completed successfully! Reloading page...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      console.log('⚠️ Some cleanup steps failed, but continuing...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }
  
  // Execute cleanup
  performCleanup().catch(error => {
    console.error('💥 Cleanup failed:', error);
    console.log('🔄 Forcing page reload anyway...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  });
  
  // Make functions available globally for manual execution
  window.clearSWCache = performCleanup;
  window.clearAuthData = clearAuthData;
  window.clearAllCaches = clearAllCaches;
  window.unregisterServiceWorkers = unregisterServiceWorkers;
  
  console.log('💡 Manual cleanup functions available:');
  console.log('   window.clearSWCache() - Full cleanup');
  console.log('   window.clearAuthData() - Clear auth data only');
  console.log('   window.clearAllCaches() - Clear caches only');
  console.log('   window.unregisterServiceWorkers() - Unregister SW only');
})(); 