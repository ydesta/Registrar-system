
export interface PwaInstallConfig {
  readonly appName?: string;
  readonly installText?: string;
  readonly dismissText?: string;
  readonly primaryColor?: string;
  readonly textColor?: string;
  readonly showIcon?: boolean;
  readonly autoDismiss?: boolean;
  readonly dismissDelay?: number;
  readonly position?: 'top' | 'bottom';
  readonly standaloneOnly?: boolean;
}

/**
 * Configuration options for PWA update component
 */
export interface PwaUpdateConfig {
  readonly appName?: string;
  readonly updateText?: string;
  readonly dismissText?: string;
  readonly primaryColor?: string;
  readonly textColor?: string;
  readonly showVersion?: boolean;
  readonly autoDismiss?: boolean;
  readonly dismissDelay?: number;
  readonly showUpdateDetails?: boolean;
  readonly position?: 'top' | 'bottom';
  readonly forceUpdate?: boolean;
}

/**
 * Default configuration for PWA install component
 */
export const DEFAULT_PWA_INSTALL_CONFIG: Required<PwaInstallConfig> = {
  appName: 'HiLCoE HSiS',
  installText: 'Install HiLCoE HSiS for a better experience',
  dismissText: 'Not now',
  primaryColor: '#093e96',
  textColor: '#ffffff',
  showIcon: true,
  autoDismiss: false,
  dismissDelay: 10000,
  position: 'bottom',
  standaloneOnly: false
};

/**
 * Default configuration for PWA update component
 */
export const DEFAULT_PWA_UPDATE_CONFIG: Required<PwaUpdateConfig> = {
  appName: 'HiLCoE HSiS',
  updateText: 'New version available',
  dismissText: 'Later',
  primaryColor: '#52c41a',
  textColor: '#ffffff',
  showVersion: true,
  autoDismiss: false,
  dismissDelay: 15000,
  showUpdateDetails: false,
  position: 'top',
  forceUpdate: false
};

/**
 * Validation function for PWA install configuration
 */
export function validatePwaInstallConfig(config: Partial<PwaInstallConfig>): PwaInstallConfig {
  const validated = { ...config };
  
  // Validate dismiss delay
  if (validated.dismissDelay !== undefined) {
    if (typeof validated.dismissDelay !== 'number' || validated.dismissDelay < 1000 || validated.dismissDelay > 60000) {
      console.warn('PWA Install: dismissDelay must be between 1000 and 60000 milliseconds');
      validated.dismissDelay = DEFAULT_PWA_INSTALL_CONFIG.dismissDelay;
    }
  }
  
  // Validate colors
  if (validated.primaryColor && !isValidColor(validated.primaryColor)) {
    console.warn('PWA Install: Invalid primaryColor format');
    validated.primaryColor = DEFAULT_PWA_INSTALL_CONFIG.primaryColor;
  }
  
  if (validated.textColor && !isValidColor(validated.textColor)) {
    console.warn('PWA Install: Invalid textColor format');
    validated.textColor = DEFAULT_PWA_INSTALL_CONFIG.textColor;
  }
  
  return validated as PwaInstallConfig;
}

/**
 * Validation function for PWA update configuration
 */
export function validatePwaUpdateConfig(config: Partial<PwaUpdateConfig>): PwaUpdateConfig {
  const validated = { ...config };
  
  // Validate dismiss delay
  if (validated.dismissDelay !== undefined) {
    if (typeof validated.dismissDelay !== 'number' || validated.dismissDelay < 1000 || validated.dismissDelay > 60000) {
      console.warn('PWA Update: dismissDelay must be between 1000 and 60000 milliseconds');
      validated.dismissDelay = DEFAULT_PWA_UPDATE_CONFIG.dismissDelay;
    }
  }
  
  // Validate colors
  if (validated.primaryColor && !isValidColor(validated.primaryColor)) {
    console.warn('PWA Update: Invalid primaryColor format');
    validated.primaryColor = DEFAULT_PWA_UPDATE_CONFIG.primaryColor;
  }
  
  if (validated.textColor && !isValidColor(validated.textColor)) {
    console.warn('PWA Update: Invalid textColor format');
    validated.textColor = DEFAULT_PWA_UPDATE_CONFIG.textColor;
  }
  
  return validated as PwaUpdateConfig;
}

/**
 * Helper function to validate color formats
 */
function isValidColor(color: string): boolean {
  // Check for hex colors
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return true;
  }
  
  // Check for rgb/rgba colors
  if (/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/.test(color) || 
      /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*([0-9]*[.]?[0-9]+)\)$/.test(color)) {
    return true;
  }
  
  // Check for named colors
  const namedColors = [
    'red', 'green', 'blue', 'yellow', 'black', 'white', 'gray', 'grey',
    'orange', 'purple', 'pink', 'brown', 'cyan', 'magenta', 'lime', 'navy',
    'teal', 'silver', 'gold', 'maroon', 'olive', 'aqua', 'fuchsia'
  ];
  
  return namedColors.includes(color.toLowerCase());
}

/**
 * Type for PWA component positions
 */
export type PwaPosition = 'top' | 'bottom';

/**
 * Type for PWA component themes
 */
export type PwaTheme = 'light' | 'dark' | 'auto';

/**
 * Extended configuration with theme support
 */
export interface PwaThemeConfig {
  /** Theme mode for the component */
  readonly theme?: PwaTheme;
  
  /** Light theme colors */
  readonly light?: {
    readonly primaryColor?: string;
    readonly textColor?: string;
    readonly backgroundColor?: string;
  };
  
  /** Dark theme colors */
  readonly dark?: {
    readonly primaryColor?: string;
    readonly textColor?: string;
    readonly backgroundColor?: string;
  };
}

/**
 * Complete PWA install configuration with theme support
 */
export interface PwaInstallConfigExtended extends PwaInstallConfig, PwaThemeConfig {}

/**
 * Complete PWA update configuration with theme support
 */
export interface PwaUpdateConfigExtended extends PwaUpdateConfig, PwaThemeConfig {} 