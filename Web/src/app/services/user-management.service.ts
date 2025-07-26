import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { User, Role, Permission } from '../types/user-management.types';
import { AuthService } from './auth.service';
import {
  IUserManagementService,
  CreateUserRequest,
  AdminCreateUserResponse,
  UserStatusUpdate,
  ResetPasswordRequest,
  RolePermissionAssignment
} from './user-management.interface';
import { ActivityFilterParams, ActivityLogResponse } from '../user-management/components/user-activity/user-activity.interface';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService implements IUserManagementService {
  private baseUrl = environment.secureUrl;
  private usersSubject = new BehaviorSubject<User[]>([]);
  private rolesSubject = new BehaviorSubject<Role[]>([]);
  private permissionsSubject = new BehaviorSubject<Permission[]>([]);

  public users$ = this.usersSubject.asObservable();
  public roles$ = this.rolesSubject.asObservable();
  public permissions$ = this.permissionsSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) { }

  createUser(userData: CreateUserRequest): Observable<AdminCreateUserResponse> {
    return this.http.post<AdminCreateUserResponse>(`${this.baseUrl}/Authentication/admin-create-user`, userData)
      .pipe(
        catchError(this.handleError)
      );
  }

  getUsers(): Observable<User[]> {
    return this.http.get<any>(`${this.baseUrl}/UserManagement`)
      .pipe(
        map(response => {
          if (response.success) {
            const users: User[] = response.users.map((user: any) => ({
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phoneNumber: user.phoneNumber,
              isActive: user.isActive,
              isEmailConfirmed: user.emailConfirmed,
              isPhoneConfirmed: user.phoneNumberConfirmed,
              createdAt: user.createdAt?.toString(),
              lastLoginAt: user.lastLoginAt?.toString(),
              roles: (user.roles || []).map((roleName: string) => ({
                id: '',
                name: roleName,
                description: '',
                permissions: [],
                isActive: true,
                createdAt: new Date().toISOString()
              })),
              permissions: (user.permissions || []).map((permissionName: string) => ({
                id: '',
                name: permissionName,
                description: '',
                category: '',
                isActive: true
              }))
            }));
            this.usersSubject.next(users);
            return users;
          } else {
            throw new Error(response.message || 'Failed to fetch users');
          }
        }),
        catchError(error => {
          console.error('API /UserManagement error:', error); // Debug log
          return this.handleError(error);
        })
      );
  }

  getUserById(userId: string): Observable<User> {
    return this.http.get<any>(`${this.baseUrl}/UserManagement/${userId}`)
      .pipe(
        map(response => {
          if (response.success) {
            const userData = response.user;
            return {
              id: userData.id,
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              phoneNumber: userData.phoneNumber,
              isActive: userData.isActive,
              isEmailConfirmed: userData.emailConfirmed,
              isPhoneConfirmed: userData.phoneNumberConfirmed,
              createdAt: userData.createdAt?.toString(),
              lastLoginAt: userData.lastLoginAt?.toString(),
              roles: (userData.roles || []).map((roleName: string) => ({
                id: '',
                name: roleName,
                description: '',
                permissions: [],
                isActive: true,
                createdAt: new Date().toISOString()
              })),
              permissions: (userData.permissions || []).map((permissionName: string) => ({
                id: '',
                name: permissionName,
                description: '',
                category: '',
                isActive: true
              }))
            };
          } else {
            throw new Error(response.message || 'Failed to fetch user');
          }
        }),
        catchError(error => {
          console.error('API /UserManagement/{id} error:', error); // Debug log
          return this.handleError(error);
        })
      );
  }

  updateUser(userId: string, userData: Partial<User>): Observable<any> {
    return this.http.put(`${this.baseUrl}/UserManagement/users/${userId}`, userData)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/UserManagement/users/${userId}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  updateUserStatus(statusUpdate: UserStatusUpdate): Observable<any> {
    return this.http.put(`${this.baseUrl}/UserManagement/${statusUpdate.userId}/status`, statusUpdate)
      .pipe(
        catchError(this.handleError)
      );
  }

  activateUser(userId: string): Observable<any> {
    return this.updateUserStatus({ userId, isActive: true });
  }

  deactivateUser(userId: string, reason?: string): Observable<any> {
    return this.updateUserStatus({ userId, isActive: false, reason });
  }

  resetPassword(resetData: ResetPasswordRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/UserManagement/users/${resetData.userId}/reset-password`, resetData)
      .pipe(
        catchError(this.handleError)
      );
  }

  regeneratePassword(userId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/UserManagement/users/${userId}/regenerate-password`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  forcePasswordChange(userId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/UserManagement/users/${userId}/force-password-change`, {})
      .pipe(
        catchError(this.handleError)
      );
  }
  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.baseUrl}/RolePermission/roles`)
      .pipe(
        map(roles => {
          this.rolesSubject.next(roles);
          return roles;
        }),
        catchError(this.handleError)
      );
  }

  createRole(roleData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/RolePermission/roles`, roleData)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateRole(roleId: string, roleData: Partial<Role>): Observable<any> {
    return this.http.put(`${this.baseUrl}/RolePermission/roles/${roleId}`, roleData)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteRole(roleId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/RolePermission/roles/${roleId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  assignRoleToUser(userId: string, roleId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/UserManagement/users/${userId}/roles`, { roleId })
      .pipe(
        catchError(this.handleError)
      );
  }

  removeRoleFromUser(userId: string, roleId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/UserManagement/users/${userId}/roles/${roleId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getPermissions(): Observable<Permission[]> {
    return this.http.get<any>(`${this.baseUrl}/RolePermission/permissions`)
      .pipe(
        map(response => {
          const permissions: Permission[] = response.map((permission: any) => ({
            id: permission.id,
            name: permission.name,
            description: permission.description,
            category: permission.category || 'General',
            isActive: true
          }));
          this.permissionsSubject.next(permissions);
          return permissions;
        }),
        catchError(this.handleError)
      );
  }

  assignPermissionsToRole(assignment: RolePermissionAssignment): Observable<any> {
    const currentUser = this.authService.getCurrentUser();
    const currentUserId = currentUser?.id || '';
    const requestBody = {
      permissionIds: assignment.permissionIds,
      currentUserId: currentUserId
    };
    return this.http.post(`${this.baseUrl}/RolePermission/roles/${assignment.roleId}/permissions/bulk`, requestBody)
      .pipe(
        catchError(this.handleError)
      );
  }

  getAllUserActivity(params: ActivityFilterParams = {}): Observable<ActivityLogResponse> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });
    return this.http.get<any>(`${this.baseUrl}/System/activity-logs`, { params: httpParams })
      .pipe(
        map(response => {
          if (response && response.items) {
            const activities = response.items.map((activity: any) => ({
              id: activity.id,
              userId: activity.userId,
              fullName: activity.fullName || 'Unknown User',
              userEmail: activity.userEmail || 'N/A',
              activityType: activity.action,
              description: activity.details,
              ipAddress: activity.ipAddress,
              userAgent: activity.userAgent,
              createdAt: activity.timestamp
            }));

            return {
              activities: activities,
              total: response.totalCount
            };
          } else {
            throw new Error('Invalid response structure from API');
          }
        }),
        catchError(this.handleError)
      );
  }

  exportUsers(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/UserManagement/users/export?format=${format}`, {
      responseType: 'blob'
    })
      .pipe(
        catchError(this.handleError)
      );
  }

  updateUserRole(userId: string, role: string): Observable<any> {
    const payload: any = {
      UserId: userId,
      Role: role
    };
    return this.http.post(`${this.baseUrl}/UserManagement/UpdateRole/user-role`, payload);
  }
  updateAdminEmail(id: string, model: any): Observable<any> {
    const url = `${this.baseUrl}/UserManagement/admin/${id}/email`;
    return this.http.put<any>(url, model);
  }
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || `Server returned code ${error.status}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}