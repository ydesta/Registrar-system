/**
 * Development SSL Helper
 * 
 * WARNING: This script ONLY works in development mode (localhost)
 * It is automatically disabled in production builds.
 * 
 * Purpose: Helps with development when using self-signed certificates
 * Security: Only affects localhost connections, never production domains
 * 
 * Note: Browser-level SSL validation cannot be truly bypassed by JavaScript.
 * This helper only suppresses console errors and provides guidance.
 * Developers must still accept self-signed certificates in their browser for development.
 */
(function() {
    'use strict';
    
    // Only run in development (localhost)
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname.startsWith('192.168.') ||
                         window.location.hostname.startsWith('10.') ||
                         window.location.hostname.startsWith('172.');
    
    // CRITICAL: Never run in production
    if (!isDevelopment) {
        return; // Exit immediately if not in development
    }
    
    // Only log in development
    console.warn('🔧 Development SSL Helper: Active (localhost only)');
    console.warn('⚠️  This helper is ONLY for development with self-signed certificates');
    console.warn('✅ SSL validation is enforced in production');
    console.info('💡 For development: Accept self-signed certificates in your browser when prompted');
    
    // Override console.error to suppress SSL certificate errors ONLY in development
    // This is cosmetic only - browser still enforces SSL validation
    const originalConsoleError = console.error;
    console.error = function(...args) {
        const message = args.join(' ');
        
        // Only suppress SSL errors for localhost connections
        if ((message.includes('SSL') || 
             message.includes('certificate') || 
             message.includes('NET::ERR_CERT') ||
             message.includes('Your connection isn\'t private') ||
             message.includes('ERR_CERT') ||
             message.includes('certificate error'))) {
            // Check if it's a localhost error
            if (message.includes('localhost') || message.includes('127.0.0.1')) {
                console.warn('[DEV] SSL Certificate Warning (localhost) - Accept certificate in browser to proceed');
                return; // Suppress the error message
            }
        }
        
        // Call original console.error for non-SSL errors or non-localhost errors
        originalConsoleError.apply(console, args);
    };
    
    // Note: We cannot truly bypass SSL validation at the browser level
    // The browser enforces SSL validation before JavaScript can intercept
    // This helper only provides better error messaging for development
    
    console.warn('Development SSL Helper: Initialized (localhost only)');
    console.info('📝 Note: You may need to accept self-signed certificates in your browser for localhost HTTPS connections');
})();
