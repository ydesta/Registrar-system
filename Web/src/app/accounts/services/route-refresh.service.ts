import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class RouteRefreshService {

  constructor(private router: Router) { }

  /**
   * Force refresh the current route by navigating to the same URL
   */
  refreshCurrentRoute(): void {
    const currentUrl = this.router.url;
    console.log('RouteRefreshService: Refreshing route:', currentUrl);
    
    // Navigate to the same route to force refresh
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  /**
   * Navigate to a route with forced refresh
   */
  navigateWithRefresh(route: string[]): void {
    console.log('RouteRefreshService: Navigating with refresh to:', route);
    
    // First navigate to root, then to target route
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(route);
    });
  }
}
