import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Interface for quick link items
 */
interface QuickLinkItem {
  title: string;
  description: string;
  route: string;
  icon: string;
}

/**
 * User Management Home Component
 * 
 * This component serves as the main entry point for the user management system.
 * It provides navigation to various user management features.
 */
@Component({
  selector: 'app-user-management-home',
  templateUrl: './user-management-home.component.html',
  styleUrls: ['./user-management-home.component.scss']
})
export class UserManagementHomeComponent implements OnInit, OnDestroy {
  
  /**
   * Subject for managing component lifecycle
   */
  private destroy$ = new Subject<void>();

  /**
   * Array of quick link items for navigation
   */
  public quickLinks: QuickLinkItem[] = [
    {
      title: 'Manage Users',
      description: 'View, create, and manage user accounts',
      route: '/user-management/users',
      icon: 'team'
    },
    {
      title: 'Manage Roles',
      description: 'Create and configure user roles',
      route: '/user-management/roles',
      icon: 'safety-certificate'
    },
    {
      title: 'Manage Permissions',
      description: 'Configure system permissions',
      route: '/user-management/permissions',
      icon: 'key'
    },
    {
      title: 'User Activity',
      description: 'Monitor user activity logs',
      route: '/user-management/activity',
      icon: 'audit'
    },
    {
      title: 'Suspicious Activity',
      description: 'Monitor and analyze suspicious activities',
      route: '/user-management/suspicious-activity',
      icon: 'warning'
    },
    {
      title: 'User Credentials',
      description: 'View and manage user credentials',
      route: '/user-management/credentials',
      icon: 'database'
    }
  ];

  /**
   * Component loading state
   */
  public isLoading = false;

  constructor(private router: Router) {}

  /**
   * Lifecycle hook that is called after data-bound properties are initialized
   */
  ngOnInit(): void {
    this.initializeComponent();
    // Redirect to users list by default
    this.router.navigate(['/user-management/users']);
  }

  /**
   * Lifecycle hook that is called when the component is destroyed
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the component
   */
  private initializeComponent(): void {
    this.isLoading = true;
    
    // Simulate loading time for better UX
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  /**
   * Navigate to a specific route
   * @param route - The route to navigate to
   */
  public navigateToRoute(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Handle quick link click
   * @param link - The quick link item that was clicked
   */
  public onQuickLinkClick(link: any): void {
    // For now, show a message that this feature is coming soon
    console.log(`${link.title} feature is coming soon!`);
    // You can add a toast notification here later
  }

  /**
   * Get the current page title
   * @returns The page title
   */
  public getPageTitle(): string {
    return 'User Management';
  }

  /**
   * Get the current page description
   * @returns The page description
   */
  public getPageDescription(): string {
    return 'Welcome to the User Management system. Please select an option from the sidebar or use the navigation below.';
  }
} 