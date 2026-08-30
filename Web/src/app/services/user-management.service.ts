import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { User, Role, Permission } from '../types/user-management.types';
import { AuthService } from './auth.service';
import { CrudService } from './crud.service';
import {
  IUserManagementService,
  CreateUserRequest,
  AdminCreateUserResponse,
  UserStatusUpdate,
  ResetPasswordRequest,
  RolePermissionAssignment,
  BulkUpdateFromExcelResult
} from './user-management.interface';
import { ActivityFilterParams, ActivityLogResponse } from '../user-management/components/user-activity/user-activity.interface';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService implements IUserManagementService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  private rolesSubject = new BehaviorSubject<Role[]>([]);
  private permissionsSubject = new BehaviorSubject<Permission[]>([]);

  public users$ = this.usersSubject.asObservable();
  public roles$ = this.rolesSubject.asObservable();
  public permissions$ = this.permissionsSubject.asObservable();

  private userStatsCache: { data: any; timestamp: number } | null = null;
  private rolesCache: { data: Role[]; timestamp: number } | null = null;
  private activityLogsCache: { data: any; timestamp: number; params: string } | null = null;
  private readonly CACHE_DURATION = 30000;

  constructor(private crud: CrudService, private authService: AuthService) { }

  createUser(userData: CreateUserRequest): Observable<AdminCreateUserResponse> {
    return this.crud.secure.post<AdminCreateUserResponse>('/Authentication/admin-create-user', userData)
      .pipe(catchError(this.handleError));
  }

  getUsers(
    page: number = 1,
    pageSize: number = 10,
    searchTerm?: string,
    roleFilter?: string,
    isActiveFilter?: boolean,
    sortBy: string = 'CreatedAt',
    sortDescending: boolean = true
  ): Observable<{ users: User[]; total: number; page: number; pageSize: number; totalPages: number }> {
    return this.crud.secure.get<any>('/UserManagement', {
      page,
      pageSize,
      sortBy,
      sortDescending,
      includeRoles: true,
      searchTerm,
      roleFilter,
      isActiveFilter
    }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch users');
        }
        const users = (response.users || []).map((user: any) => this.mapUser(user));
        this.usersSubject.next(users);
        return {
          users,
          total: response.totalCount,
          page: response.page,
          pageSize: response.pageSize,
          totalPages: response.totalPages
        };
      }),
      catchError(this.handleError)
    );
  }

  getUserById(userId: string): Observable<User> {
    return this.crud.secure.get<any>(`/UserManagement/${userId}`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch user');
        }
        return this.mapUser(response.user);
      }),
      catchError(this.handleError)
    );
  }

  updateUser(userId: string, userData: Partial<User>, skipUsernameUpdate: boolean = false): Observable<any> {
    return this.crud.secure.put(`/UserManagement/${userId}`, {
      userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phoneNumber,
      userName: userData.email,
      isActive: userData.isActive
    }).pipe(catchError(this.handleError));
  }

  deleteUser(userId: string, permanentDelete: boolean = false): Observable<any> {
    return this.crud.secure.delete(
      `/UserManagement/${userId}`,
      permanentDelete ? { permanentDelete: true } : undefined
    ).pipe(catchError(this.handleError));
  }

  softDeleteUser(userId: string): Observable<any> {
    return this.crud.secure.delete(`/UserManagement/${userId}`).pipe(catchError(this.handleError));
  }

  updateUserStatus(statusUpdate: UserStatusUpdate): Observable<any> {
    return this.crud.secure.put(`/UserManagement/${statusUpdate.userId}/status`, statusUpdate)
      .pipe(catchError(this.handleError));
  }

  activateUser(userId: string): Observable<any> {
    return this.updateUserStatus({ userId, isActive: true });
  }

  deactivateUser(userId: string, reason?: string): Observable<any> {
    return this.updateUserStatus({ userId, isActive: false, reason });
  }

  resetPassword(resetData: ResetPasswordRequest): Observable<any> {
    return this.crud.secure.post(`/UserManagement/users/${resetData.userId}/reset-password`, resetData)
      .pipe(catchError(this.handleError));
  }

  regeneratePassword(userId: string): Observable<any> {
    return this.crud.secure.post(`/UserManagement/users/${userId}/regenerate-password`, {})
      .pipe(catchError(this.handleError));
  }

  confirmUserEmail(userId: string): Observable<any> {
    return this.crud.secure.post(`/UserManagement/users/${userId}/confirm-email`, {})
      .pipe(catchError(this.handleError));
  }

  resendUserEmailVerification(userId: string): Observable<any> {
    return this.crud.secure.post(`/UserManagement/users/${userId}/resend-email-verification`, {})
      .pipe(catchError(this.handleError));
  }

  forcePasswordChange(userId: string): Observable<any> {
    return this.crud.secure.post(`/UserManagement/users/${userId}/force-password-change`, {})
      .pipe(catchError(this.handleError));
  }

  getRoles(): Observable<Role[]> {
    if (this.isFresh(this.rolesCache?.timestamp)) {
      return of(this.rolesCache!.data);
    }
    return this.crud.secure.get<Role[]>('/RolePermission/roles').pipe(
      map(roles => {
        this.rolesCache = { data: roles, timestamp: Date.now() };
        this.rolesSubject.next(roles);
        return roles;
      }),
      catchError(this.handleError),
      shareReplay(1)
    );
  }

  createRole(roleData: any): Observable<any> {
    return this.crud.secure.post('/RolePermission/roles', roleData).pipe(catchError(this.handleError));
  }

  updateRole(roleId: string, roleData: Partial<Role>): Observable<any> {
    return this.crud.secure.put(`/RolePermission/roles/${roleId}`, roleData).pipe(catchError(this.handleError));
  }

  deleteRole(roleId: string): Observable<any> {
    return this.crud.secure.delete(`/RolePermission/roles/${roleId}`).pipe(catchError(this.handleError));
  }

  assignRoleToUser(userId: string, roleId: string): Observable<any> {
    return this.crud.secure.post(`/UserManagement/users/${userId}/roles`, { roleId })
      .pipe(catchError(this.handleError));
  }

  removeRoleFromUser(userId: string, roleId: string): Observable<any> {
    return this.crud.secure.delete(`/UserManagement/users/${userId}/roles/${roleId}`)
      .pipe(catchError(this.handleError));
  }

  updateUserRoles(userId: string, roles: string[]): Observable<any> {
    return this.crud.secure.put(`/UserManagement/users/${userId}/roles`, { roles })
      .pipe(catchError(this.handleError));
  }

  getPermissions(): Observable<Permission[]> {
    return this.crud.secure.get<any>('/RolePermission/permissions').pipe(
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
    return this.crud.secure.post(`/RolePermission/roles/${assignment.roleId}/permissions/bulk`, {
      permissionIds: assignment.permissionIds,
      currentUserId: this.authService.getCurrentUser()?.id || ''
    }).pipe(catchError(this.handleError));
  }

  getAllUserActivity(params: ActivityFilterParams = {}): Observable<ActivityLogResponse> {
    const cacheKey = JSON.stringify(params);
    if (this.isFresh(this.activityLogsCache?.timestamp) && this.activityLogsCache?.params === cacheKey) {
      return of(this.activityLogsCache.data);
    }
    return this.crud.secure.get<any>('/System/activity-logs', params as Record<string, any>).pipe(
      map(response => {
        if (!response?.items) {
          throw new Error('Invalid response structure from API');
        }
        const result = {
          activities: response.items.map((activity: any) => ({
            id: activity.id,
            userId: activity.userId,
            fullName: activity.fullName || 'Unknown User',
            userEmail: activity.userEmail || 'N/A',
            activityType: activity.action,
            description: activity.details,
            ipAddress: activity.ipAddress,
            userAgent: activity.userAgent,
            createdAt: activity.timestamp
          })),
          total: response.totalCount
        };
        this.activityLogsCache = { data: result, timestamp: Date.now(), params: cacheKey };
        return result;
      }),
      catchError(this.handleError),
      shareReplay(1)
    );
  }

  exportUsers(format: 'csv' | 'excel' = 'csv'): Observable<Blob> {
    return this.crud.secure.getBlob('/UserManagement/users/export', { format })
      .pipe(catchError(this.handleError));
  }

  updateUsersFromExcel(file: File): Observable<BulkUpdateFromExcelResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.crud.secure.post<BulkUpdateFromExcelResult>('/UserManagement/users/update-from-excel', formData)
      .pipe(catchError(this.handleError));
  }

  updateUserRole(userId: string, role: string, email): Observable<any> {
    return this.crud.secure.post('/UserManagement/UpdateRole/user-role', {
      UserId: userId,
      Role: role,
      Email: email
    });
  }

  updateAdminEmail(id: string, model: any): Observable<any> {
    return this.crud.secure.put<any>(`/UserManagement/admin/${id}/email`, model);
  }

  updateUserEmail(userId: string, newEmail: string): Observable<any> {
    return this.crud.secure.put(`/UserManagement/admin/${userId}/email`, { newEmail })
      .pipe(catchError(this.handleError));
  }

  updateUserUsername(userId: string, newUsername: string): Observable<any> {
    return this.crud.secure.put(`/UserManagement/admin/${userId}/username`, { newUsername })
      .pipe(catchError(this.handleError));
  }

  getUserStatistics(): Observable<{ totalUsers: number; activeUsers: number; inactiveUsers: number }> {
    if (this.isFresh(this.userStatsCache?.timestamp)) {
      return of(this.userStatsCache!.data);
    }
    return this.crud.secure.get<any>('/System/statistics').pipe(
      map(response => {
        const stats = response.isSuccess ? response.response?.userStatistics : null;
        const result = stats
          ? {
              totalUsers: stats.totalUsers || 0,
              activeUsers: stats.activeUsers || 0,
              inactiveUsers: stats.lockedAccounts || 0
            }
          : this.statsFromUsers();
        this.userStatsCache = { data: result, timestamp: Date.now() };
        return result;
      }),
      catchError(() => {
        const fallback = this.statsFromUsers();
        this.userStatsCache = { data: fallback, timestamp: Date.now() };
        return of(fallback);
      }),
      shareReplay(1)
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
    return this.crud.secure.get<any>('/UserManagement/credentials', this.credentialsQuery(params))
      .pipe(catchError(this.handleError));
  }

  getUserCredentialsForExport(params: {
    fromDate?: Date | null;
    toDate?: Date | null;
    emailFilter?: string | null;
    sortBy?: string;
    sortDescending?: boolean;
  }): Observable<any> {
    return this.crud.secure.get<any>('/UserManagement/credentials', this.credentialsQuery({
      ...params,
      page: 1,
      pageSize: 10000
    })).pipe(catchError(this.handleError));
  }

  private mapUser(user: any): User {
    return {
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
    };
  }

  private credentialsQuery(params: {
    fromDate?: Date | null;
    toDate?: Date | null;
    page?: number;
    pageSize?: number;
    emailFilter?: string | null;
    sortBy?: string;
    sortDescending?: boolean;
  }) {
    return this.crud.params({
      fromDate: params.fromDate?.toISOString(),
      toDate: params.toDate?.toISOString(),
      page: params.page,
      pageSize: params.pageSize,
      emailFilter: params.emailFilter,
      sortBy: params.sortBy,
      sortDescending: params.sortDescending
    });
  }

  private statsFromUsers(): { totalUsers: number; activeUsers: number; inactiveUsers: number } {
    const users = this.usersSubject.value;
    return {
      totalUsers: users.length,
      activeUsers: users.filter(user => user.isActive).length,
      inactiveUsers: users.filter(user => !user.isActive).length
    };
  }

  private isFresh(timestamp?: number): boolean {
    return !!timestamp && Date.now() - timestamp < this.CACHE_DURATION;
  }

  private handleError(error: HttpErrorResponse) {
    const errorMessage = error.error instanceof ErrorEvent
      ? error.error.message
      : error.error?.message || `Server returned code ${error.status}`;
    return throwError(() => new Error(errorMessage));
  }
}
