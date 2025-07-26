export const SESSION_CONSTANTS = {
  DEFAULT_CONFIG: {
    inactivityTimeoutMinutes: 30,
    sessionTimeoutMinutes: 480, // 8 hours
    warningTimeMinutes: 5,
    enableActivityTracking: true,
    enableTabSync: true,
    enableBrowserCloseDetection: true
  },
  
  STORAGE_KEYS: {
    SESSION_CONFIG: 'sessionConfig',
    SESSION_DATA: 'sessionData',
    BROWSER_CLOSING: 'browserClosing'
  },
  
  ACTIVITY_EVENTS: ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'],
  
  TIMERS: {
    ACTIVITY_DEBOUNCE_MS: 1000,
    BROWSER_CLOSE_DELAY_MS: 100
  },
  
  API_ENDPOINTS: {
    BEACON_LOGOUT: '/api/authentication/beacon-logout'
  }
} as const; 