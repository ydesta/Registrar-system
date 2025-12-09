import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
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

  // Cache for user statistics
  private userStatsCache: { data: any, timestamp: number } | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  // Cache for roles
  private rolesCache: { data: Role[], timestamp: number } | null = null;

  // Cache for activity logs
  private activityLogsCache: { data: any, timestamp: number, params: string } | null = null;

  constructor(private http: HttpClient, private authService: AuthService) { }

  createUser(userData: CreateUserRequest): Observable<AdminCreateUserResponse> {
    return this.http.post<AdminCreateUserResponse>(`${this.baseUrl}/Authentication/admin-create-user`, userData)
      .pipe(
        catchError(this.handleError)
      );
  }

  getUsers(
    page: number = 1,
    pageSize: number = 10,
    searchTerm?: string,
    roleFilter?: string,
    isActiveFilter?: boolean,
    sortBy: string = 'CreatedAt',
    sortDescending: boolean = true
  ): Observable<{ users: User[], total: number, page: number, pageSize: number, totalPages: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('sortBy', sortBy)
      .set('sortDescending', sortDescending.toString())
      .set('includeRoles', 'true');

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }
    if (roleFilter) {
      params = params.set('roleFilter', roleFilter);
    }
    if (isActiveFilter !== undefined) {
      params = params.set('isActiveFilter', isActiveFilter.toString());
    }

    return this.http.get<any>(`${this.baseUrl}/UserManagement`, { params })
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
            return {
              users,
              total: response.totalCount,
              page: response.page,
              pageSize: response.pageSize,
              totalPages: response.totalPages
            };
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

  updateUser(userId: string, userData: Partial<User>, skipUsernameUpdate: boolean = false): Observable<any> {
    // Transform User object to UpdateUserCommand structure
    const updateCommand = {
      userId: userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phoneNumber,
      userName: userData.email, // Always pass email as userName
      isActive: userData.isActive
    };
    
    return this.http.put(`${this.baseUrl}/UserManagement/${userId}`, updateCommand)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteUser(userId: string, permanentDelete: boolean = false): Observable<any> {
    let params = new HttpParams();
    if (permanentDelete) {
      params = params.set('permanentDelete', 'true');
    }
    
    return this.http.delete(`${this.baseUrl}/UserManagement/${userId}`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  softDeleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/UserManagement/${userId}`)
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
    // Check cache first
    if (this.rolesCache && (Date.now() - this.rolesCache.timestamp) < this.CACHE_DURATION) {
      return of(this.rolesCache.data);
    }

    return this.http.get<Role[]>(`${this.baseUrl}/RolePermission/roles`)
      .pipe(
        map(roles => {
          // Cache the result
          this.rolesCache = {
            data: roles,
            timestamp: Date.now()
          };
          this.rolesSubject.next(roles);
          return roles;
        }),
        catchError(this.handleError),
        shareReplay(1) // Share the result with multiple subscribers
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
    // Create cache key from parameters
    const cacheKey = JSON.stringify(params);
    
    // Check cache first
    if (this.activityLogsCache && 
        (Date.now() - this.activityLogsCache.timestamp) < this.CACHE_DURATION &&
        this.activityLogsCache.params === cacheKey) {
      return of(this.activityLogsCache.data);
    }

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

            const result = {
              activities: activities,
              total: response.totalCount
            };

            // Cache the result
            this.activityLogsCache = {
              data: result,
              timestamp: Date.now(),
              params: cacheKey
            };

            return result;
          } else {
            throw new Error('Invalid response structure from API');
          }
        }),
        catchError(this.handleError),
        shareReplay(1) // Share the result with multiple subscribers
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

  updateUserRole(userId: string, role: string,email): Observable<any> {
    const payload: any = {
      UserId: userId,
      Role: role,
      Email: email
    };
    return this.http.post(`${this.baseUrl}/UserManagement/UpdateRole/user-role`, payload);
  }
  updateAdminEmail(id: string, model: any): Observable<any> {
    const url = `${this.baseUrl}/UserManagement/admin/${id}/email`;
    return this.http.put<any>(url, model);
  }

  updateUserEmail(userId: string, newEmail: string): Observable<any> {
    const updateEmailModel = {
      newEmail: newEmail
    };
    return this.http.put(`${this.baseUrl}/UserManagement/admin/${userId}/email`, updateEmailModel)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateUserUsername(userId: string, newUsername: string): Observable<any> {
    const updateUsernameModel = {
      newUsername: newUsername
    };
    return this.http.put(`${this.baseUrl}/UserManagement/admin/${userId}/username`, updateUsernameModel)
      .pipe(
        catchError(this.handleError)
      );
  }
  getUserStatistics(): Observable<{ totalUsers: number, activeUsers: number, inactiveUsers: number }> {
    // Check cache first
    if (this.userStatsCache && (Date.now() - this.userStatsCache.timestamp) < this.CACHE_DURATION) {
      return of(this.userStatsCache.data);
    }

    return this.http.get<any>(`${this.baseUrl}/System/statistics`)
      .pipe(
        map(response => {
          if (response.isSuccess && response.response?.userStatistics) {
            const stats = response.response.userStatistics;
            const result = {
              totalUsers: stats.totalUsers || 0,
              activeUsers: stats.activeUsers || 0,
              inactiveUsers: stats.lockedAccounts || 0
            };
            
            // Cache the result
            this.userStatsCache = {
              data: result,
              timestamp: Date.now()
            };
            
            return result;
          } else {
            // Fallback to calculating from current page if API fails
            const fallback = {
              totalUsers: this.usersSubject.value.length,
              activeUsers: this.usersSubject.value.filter(u => u.isActive).length,
              inactiveUsers: this.usersSubject.value.filter(u => !u.isActive).length
            };
            
            // Cache the fallback result
            this.userStatsCache = {
              data: fallback,
              timestamp: Date.now()
            };
            
            return fallback;
          }
        }),
        catchError(error => {
          console.error('API /System/statistics error:', error);
          // Fallback to calculating from current page if API fails
          return this.usersSubject.pipe(
            map(users => {
              const fallback = {
                totalUsers: users.length,
                activeUsers: users.filter(u => u.isActive).length,
                inactiveUsers: users.filter(u => !u.isActive).length
              };
              
              // Cache the fallback result
              this.userStatsCache = {
                data: fallback,
                timestamp: Date.now()
              };
              
              return fallback;
            })
          );
        }),
        shareReplay(1) // Share the result with multiple subscribers
      );
  }

  testApiConnection(): Observable<any> {
    console.log('Testing API connection to:', `${this.baseUrl}/UserManagement/health`);
    return this.http.get<any>(`${this.baseUrl}/UserManagement/health`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getUserCredentials(params: {
    fromDate?: Date | null;
    toDate?: Date | null;
    page?: number;
    pageSize?: number;
    emailFilter?: string | null;
    sortBy?: string;
    sortDescending?: boolean;
  }): Observable<any> {
    let httpParams = new HttpParams();
    
    if (params.fromDate) {
      httpParams = httpParams.set('fromDate', params.fromDate.toISOString());
    }
    if (params.toDate) {
      httpParams = httpParams.set('toDate', params.toDate.toISOString());
    }
    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    if (params.emailFilter) {
      httpParams = httpParams.set('emailFilter', params.emailFilter);
    }
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params.sortDescending !== undefined) {
      httpParams = httpParams.set('sortDescending', params.sortDescending.toString());
    }

    console.log('Making request to:', `${this.baseUrl}/UserManagement/credentials`);
    console.log('With params:', httpParams.toString());
    
    return this.http.get<any>(`${this.baseUrl}/UserManagement/credentials`, { params: httpParams })
      .pipe(
        catchError(this.handleError)
      );
  }

  getUserCredentialsForExport(params: {
    fromDate?: Date | null;
    toDate?: Date | null;
    emailFilter?: string | null;
    sortBy?: string;
    sortDescending?: boolean;
  }): Observable<any> {
    let httpParams = new HttpParams();
    
    if (params.fromDate) {
      httpParams = httpParams.set('fromDate', params.fromDate.toISOString());
    }
    if (params.toDate) {
      httpParams = httpParams.set('toDate', params.toDate.toISOString());
    }
    if (params.emailFilter) {
      httpParams = httpParams.set('emailFilter', params.emailFilter);
    }
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params.sortDescending !== undefined) {
      httpParams = httpParams.set('sortDescending', params.sortDescending.toString());
    }
    // Set a very large page size to get all data
    httpParams = httpParams.set('pageSize', '10000');
    httpParams = httpParams.set('page', '1');

    console.log('Making export request to:', `${this.baseUrl}/UserManagement/credentials`);
    console.log('With export params:', httpParams.toString());

    return this.http.get<any>(`${this.baseUrl}/UserManagement/credentials`, { params: httpParams })
      .pipe(
        catchError(this.handleError)
      );
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