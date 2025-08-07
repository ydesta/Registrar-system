import { Observable } from 'rxjs';
import { User, Role, Permission } from '../types/user-management.types';
import { ActivityFilterParams, ActivityLogResponse } from '../user-management/components/user-activity/user-activity.interface';

// Request/Response Interfaces
export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  roleNames: string[];
  isActive: boolean;
  requireEmailConfirmation?: boolean;
  requirePhoneConfirmation?: boolean;
  password?: string;
  confirmPassword?: string;
}

export interface AdminCreateUserResponse {
  success: boolean;
  message: string;
  userId?: string;
  username?: string;
  generatedPassword?: string;
  assignedRoles?: string[];
  credentialsSent: boolean;
  verificationSent: boolean;
}

export interface UserStatusUpdate {
  userId: string;
  isActive: boolean;
  reason?: string;
}

export interface ResetPasswordRequest {
  userId: string;
  newPassword: string;
  confirmPassword: string;
  forceChangeOnNextLogin?: boolean;
}

export interface RolePermissionAssignment {
  roleId: string;
  permissionIds: string[];
}

export interface UserActivity {
  id: string;
  userId: string;
  fullName?: string;
  userEmail?: string;
  activityType: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface UserManagementStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalRoles: number;
  totalPermissions: number;
  recentActivities: number;
}

export interface UsersListResponse {
  Success: boolean;
  Message?: string;
  Users: {
    Id: string;
    FirstName: string;
    LastName: string;
    Email: string;
    PhoneNumber?: string;
    EmailConfirmed: boolean;
    PhoneNumberConfirmed: boolean;
    CreatedAt: string;
    LastLoginAt?: string;
    IsActive: boolean;
    Roles: string[];
    Permissions: string[];
  }[];
  TotalCount: number;
  Page: number;
  PageSize: number;
  TotalPages: number;
}
interface UpdateUserRoleRequest {
  UserId: string;
  Role: string;
}
// Main Service Interface
export interface IUserManagementService {
  // Observable properties
  readonly users$: Observable<User[]>;
  readonly roles$: Observable<Role[]>;
  readonly permissions$: Observable<Permission[]>;

  // User Management
  createUser(userData: CreateUserRequest): Observable<AdminCreateUserResponse>;
  getUsers(
    page?: number,
    pageSize?: number,
    searchTerm?: string,
    roleFilter?: string,
    isActiveFilter?: boolean,
    sortBy?: string,
    sortDescending?: boolean
  ): Observable<{ users: User[], total: number, page: number, pageSize: number, totalPages: number }>;
  getUserById(userId: string): Observable<User>;
  updateUser(userId: string, userData: Partial<User>): Observable<any>;
  deleteUser(userId: string, permanentDelete?: boolean): Observable<any>;
  softDeleteUser(userId: string): Observable<any>;

  // User Status Management
  updateUserStatus(statusUpdate: UserStatusUpdate): Observable<any>;
  activateUser(userId: string): Observable<any>;
  deactivateUser(userId: string, reason?: string): Observable<any>;

  // Password Management
  resetPassword(resetData: ResetPasswordRequest): Observable<any>;
  regeneratePassword(userId: string): Observable<any>;
  forcePasswordChange(userId: string): Observable<any>;

  // Role Management
  getRoles(): Observable<Role[]>;
  createRole(roleData: any): Observable<any>;
  updateRole(roleId: string, roleData: Partial<Role>): Observable<any>;
  deleteRole(roleId: string): Observable<any>;
  assignRoleToUser(userId: string, roleId: string): Observable<any>;
  removeRoleFromUser(userId: string, roleId: string): Observable<any>;

  // Permission Management
  getPermissions(): Observable<Permission[]>;
  assignPermissionsToRole(assignment: RolePermissionAssignment): Observable<any>;

  // Activity Management
  getAllUserActivity(params?: ActivityFilterParams): Observable<ActivityLogResponse>;

  // Export
  exportUsers(format?: 'csv' | 'excel'): Observable<Blob>;
  
  // Statistics
  getUserStatistics(): Observable<{ totalUsers: number, activeUsers: number, inactiveUsers: number }>;
} 