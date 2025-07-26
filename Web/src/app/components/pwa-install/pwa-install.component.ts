import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { PwaService } from '../../services/pwa.service';
import { Subscription } from 'rxjs';
import { 
  PwaInstallConfig, 
  DEFAULT_PWA_INSTALL_CONFIG, 
  validatePwaInstallConfig 
} from '../../Models/pwa-config.model';

@Component({
  selector: 'app-pwa-install',
  templateUrl: './pwa-install.component.html',
  styleUrls: ['./pwa-install.component.scss']
})
export class PwaInstallComponent implements OnInit, OnDestroy, OnChanges {
  /** Configuration for the PWA install component */
  @Input() config: Partial<PwaInstallConfig> = {};
  
  /** Whether to show the install prompt */
  showInstallPrompt = false;
  
  /** Whether the PWA is currently being installed */
  isInstalling = false;
  
  /** Current app name */
  appName = DEFAULT_PWA_INSTALL_CONFIG.appName;
  
  /** Current install text */
  installText = DEFAULT_PWA_INSTALL_CONFIG.installText;
  
  /** Current dismiss text */
  dismissText = DEFAULT_PWA_INSTALL_CONFIG.dismissText;
  
  /** Current position */
  position = DEFAULT_PWA_INSTALL_CONFIG.position;
  
  /** Whether to show icon */
  showIcon = DEFAULT_PWA_INSTALL_CONFIG.showIcon;
  
  /** Whether to auto-dismiss */
  autoDismiss = DEFAULT_PWA_INSTALL_CONFIG.autoDismiss;
  
  /** Dismiss delay in milliseconds */
  dismissDelay = DEFAULT_PWA_INSTALL_CONFIG.dismissDelay;
  
  /** Whether to show only in standalone mode */
  standaloneOnly = DEFAULT_PWA_INSTALL_CONFIG.standaloneOnly;
  
  private subscription: Subscription = new Subscription();
  private dismissTimer?: number;
  private validatedConfig: PwaInstallConfig = DEFAULT_PWA_INSTALL_CONFIG;

  constructor(private pwaService: PwaService) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.setupSubscriptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && changes['config'].currentValue) {
      this.updateConfiguration();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.clearDismissTimer();
  }

  /**
   * Initialize the component with validated configuration
   */
  private initializeComponent(): void {
    this.updateConfiguration();
  }

  /**
   * Update component configuration with validation
   */
  private updateConfiguration(): void {
    // Validate and merge configuration
    this.validatedConfig = validatePwaInstallConfig({
      ...DEFAULT_PWA_INSTALL_CONFIG,
      ...this.config
    });

    // Update component properties
    this.appName = this.validatedConfig.appName || DEFAULT_PWA_INSTALL_CONFIG.appName;
    this.installText = this.validatedConfig.installText || 
      `Install ${this.appName} for a better experience`;
    this.dismissText = this.validatedConfig.dismissText || DEFAULT_PWA_INSTALL_CONFIG.dismissText;
    this.position = this.validatedConfig.position || DEFAULT_PWA_INSTALL_CONFIG.position;
    this.showIcon = this.validatedConfig.showIcon ?? DEFAULT_PWA_INSTALL_CONFIG.showIcon;
    this.autoDismiss = this.validatedConfig.autoDismiss ?? DEFAULT_PWA_INSTALL_CONFIG.autoDismiss;
    this.dismissDelay = this.validatedConfig.dismissDelay || DEFAULT_PWA_INSTALL_CONFIG.dismissDelay;
    this.standaloneOnly = this.validatedConfig.standaloneOnly ?? DEFAULT_PWA_INSTALL_CONFIG.standaloneOnly;
    
    // Apply CSS custom properties for theming
    this.applyTheme();
  }

  /**
   * Apply theme colors to CSS custom properties
   */
  private applyTheme(): void {
    if (this.validatedConfig.primaryColor) {
      document.documentElement.style.setProperty('--pwa-install-bg', this.validatedConfig.primaryColor);
    }
    if (this.validatedConfig.textColor) {
      document.documentElement.style.setProperty('--pwa-install-text', this.validatedConfig.textColor);
    }
  }

  /**
   * Setup subscriptions for PWA service events
   */
  private setupSubscriptions(): void {
    this.subscription.add(
      this.pwaService.installPrompt$.subscribe(show => {
        const shouldShow = show && 
          !this.pwaService.isPWAInstalled() && 
          (!this.standaloneOnly || this.pwaService.isStandalone());
        
        this.showInstallPrompt = shouldShow;
        
        // Auto-dismiss functionality
        if (this.showInstallPrompt && this.autoDismiss) {
          this.setupAutoDismiss();
        }
      })
    );
  }

  /**
   * Setup auto-dismiss timer
   */
  private setupAutoDismiss(): void {
    this.clearDismissTimer();
    
    this.dismissTimer = window.setTimeout(() => {
      this.dismissPrompt();
    }, this.dismissDelay);
  }

  /**
   * Clear the dismiss timer
   */
  private clearDismissTimer(): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = undefined;
    }
  }

  /**
   * Install the PWA
   */
  async installPWA(): Promise<void> {
    if (this.isInstalling) {
      return;
    }

    try {
      this.isInstalling = true;
      await this.pwaService.installPWA();
      this.dismissPrompt();
    } catch (error) {
      console.error('Failed to install PWA:', error);
      // Could add error handling UI here
    } finally {
      this.isInstalling = false;
    }
  }

  /**
   * Dismiss the install prompt
   */
  dismissPrompt(): void {
    this.showInstallPrompt = false;
    this.clearDismissTimer();
  }

  /**
   * Public method to manually show the prompt (for testing)
   */
  public showPrompt(): void {
    this.showInstallPrompt = true;
  }

  /**
   * Public method to manually hide the prompt
   */
  public hidePrompt(): void {
    this.dismissPrompt();
  }

  /**
   * Get the current configuration
   */
  public getCurrentConfig(): PwaInstallConfig {
    return { ...this.validatedConfig };
  }
} 