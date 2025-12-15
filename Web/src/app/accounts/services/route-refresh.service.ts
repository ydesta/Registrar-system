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
    
    // Navigate to the same route to force refresh
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }

  /**
   * Navigate to a route with forced refresh
   */
  navigateWithRefresh(route: string[]): void {
    // First navigate to root, then to target route
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate(route);
    });
  }
}
