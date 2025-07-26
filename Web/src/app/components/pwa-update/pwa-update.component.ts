import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { PwaService } from '../../services/pwa.service';
import { Subscription } from 'rxjs';
import { 
  PwaUpdateConfig, 
  DEFAULT_PWA_UPDATE_CONFIG, 
  validatePwaUpdateConfig 
} from '../../Models/pwa-config.model';

@Component({
  selector: 'app-pwa-update',
  templateUrl: './pwa-update.component.html',
  styleUrls: ['./pwa-update.component.scss']
})
export class PwaUpdateComponent implements OnInit, OnDestroy, OnChanges {
  /** Configuration for the PWA update component */
  @Input() config: Partial<PwaUpdateConfig> = {};
  
  /** Whether to show the update notification */
  showUpdateNotification = false;
  
  /** Whether the update is currently being applied */
  isUpdating = false;
  
  /** Current app name */
  appName = DEFAULT_PWA_UPDATE_CONFIG.appName;
  
  /** Current update text */
  updateText = DEFAULT_PWA_UPDATE_CONFIG.updateText;
  
  /** Current dismiss text */
  dismissText = DEFAULT_PWA_UPDATE_CONFIG.dismissText;
  
  /** Current position */
  position = DEFAULT_PWA_UPDATE_CONFIG.position;
  
  /** Whether to show version */
  showVersion = DEFAULT_PWA_UPDATE_CONFIG.showVersion;
  
  /** Whether to auto-dismiss */
  autoDismiss = DEFAULT_PWA_UPDATE_CONFIG.autoDismiss;
  
  /** Dismiss delay in milliseconds */
  dismissDelay = DEFAULT_PWA_UPDATE_CONFIG.dismissDelay;
  
  /** Whether to show update details */
  showUpdateDetails = DEFAULT_PWA_UPDATE_CONFIG.showUpdateDetails;
  
  /** Whether to force update */
  forceUpdate = DEFAULT_PWA_UPDATE_CONFIG.forceUpdate;
  
  /** Current update version */
  updateVersion = '';
  
  private subscription: Subscription = new Subscription();
  private dismissTimer?: number;
  private validatedConfig: PwaUpdateConfig = DEFAULT_PWA_UPDATE_CONFIG;

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
    this.validatedConfig = validatePwaUpdateConfig({
      ...DEFAULT_PWA_UPDATE_CONFIG,
      ...this.config
    });

    // Update component properties
    this.appName = this.validatedConfig.appName || DEFAULT_PWA_UPDATE_CONFIG.appName;
    this.updateText = this.validatedConfig.updateText || DEFAULT_PWA_UPDATE_CONFIG.updateText;
    this.dismissText = this.validatedConfig.dismissText || DEFAULT_PWA_UPDATE_CONFIG.dismissText;
    this.position = this.validatedConfig.position || DEFAULT_PWA_UPDATE_CONFIG.position;
    this.showVersion = this.validatedConfig.showVersion ?? DEFAULT_PWA_UPDATE_CONFIG.showVersion;
    this.autoDismiss = this.validatedConfig.autoDismiss ?? DEFAULT_PWA_UPDATE_CONFIG.autoDismiss;
    this.dismissDelay = this.validatedConfig.dismissDelay || DEFAULT_PWA_UPDATE_CONFIG.dismissDelay;
    this.showUpdateDetails = this.validatedConfig.showUpdateDetails ?? DEFAULT_PWA_UPDATE_CONFIG.showUpdateDetails;
    this.forceUpdate = this.validatedConfig.forceUpdate ?? DEFAULT_PWA_UPDATE_CONFIG.forceUpdate;
    
    // Apply CSS custom properties for theming
    this.applyTheme();
  }

  /**
   * Apply theme colors to CSS custom properties
   */
  private applyTheme(): void {
    if (this.validatedConfig.primaryColor) {
      document.documentElement.style.setProperty('--pwa-update-bg', this.validatedConfig.primaryColor);
    }
    if (this.validatedConfig.textColor) {
      document.documentElement.style.setProperty('--pwa-update-text', this.validatedConfig.textColor);
    }
  }

  /**
   * Setup subscriptions for PWA service events
   */
  private setupSubscriptions(): void {
    this.subscription.add(
      this.pwaService.updateAvailable$.subscribe(show => {
        this.showUpdateNotification = show;
        
        if (show) {
          this.updateVersion = this.pwaService.getUpdateVersion();
          
          // Auto-dismiss functionality
          if (this.autoDismiss) {
            this.setupAutoDismiss();
          }
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
      this.dismissNotification();
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
   * Apply the update
   */
  async applyUpdate(): Promise<void> {
    if (this.isUpdating) {
      return;
    }

    try {
      this.isUpdating = true;
      await this.pwaService.activateUpdate();
    } catch (error) {
      console.error('Failed to apply update:', error);
      this.isUpdating = false;
    }
  }

  /**
   * Dismiss the update notification
   */
  dismissNotification(): void {
    if (this.forceUpdate) {
      return; // Don't allow dismissal if force update is enabled
    }
    
    this.showUpdateNotification = false;
    this.clearDismissTimer();
    this.pwaService.dismissUpdateNotification();
  }

  /**
   * Public method to manually show the notification (for testing)
   */
  public showNotification(): void {
    this.showUpdateNotification = true;
  }

  /**
   * Public method to manually hide the notification
   */
  public hideNotification(): void {
    this.dismissNotification();
  }

  /**
   * Get the current configuration
   */
  public getCurrentConfig(): PwaUpdateConfig {
    return { ...this.validatedConfig };
  }

  /**
   * Check if the dismiss button should be shown
   */
  public shouldShowDismissButton(): boolean {
    return !this.forceUpdate;
  }
} 