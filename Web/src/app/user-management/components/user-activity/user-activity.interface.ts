export interface ActivityFilters {
  userEmail: string;
  activityType: string;
  dateRange: Date[];
}

export interface ActivityFilterParams {
  page?: number;
  pageSize?: number;
  userEmail?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

export interface ActivityLogResponse {
  activities: UserActivity[];
  total: number;
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

export interface ActivityTypeOption {
  value: string;
  label: string;
  color: string;
}

export const ACTIVITY_TYPE_OPTIONS: ActivityTypeOption[] = [
  { value: 'login', label: 'Login', color: 'green' },
  { value: 'logout', label: 'Logout', color: 'orange' },
  { value: 'create', label: 'Create', color: 'blue' },
  { value: 'update', label: 'Update', color: 'cyan' },
  { value: 'delete', label: 'Delete', color: 'red' },
  { value: 'password_change', label: 'Password Change', color: 'purple' },
  { value: 'role_assignment', label: 'Role Assignment', color: 'geekblue' },
  { value: 'permission_change', label: 'Permission Change', color: 'magenta' }
]; 