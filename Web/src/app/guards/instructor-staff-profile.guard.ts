import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { StaffService } from '../services/staff.service';

@Injectable({
  providedIn: 'root'
})
export class InstructorStaffProfileGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private staffService: StaffService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    if (!this.authService.hasRole('Instructor')) {
      return of(true);
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      return of(this.router.createUrlTree(['/staffs/staff-profile']));
    }

    return this.staffService.getStaffByUserId(userId).pipe(
      map((res) => {
        if (res?.status === 'success' && res?.data) {
          return true;
        }
        return this.router.createUrlTree(['/staffs/staff-profile']);
      }),
      catchError(() => of(this.router.createUrlTree(['/staffs/staff-profile'])))
    );
  }
}
