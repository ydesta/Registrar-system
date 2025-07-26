export interface Permission {
  id: string;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isActive: boolean;
  createdAt: string;
  userCount?: number;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  isEmailConfirmed: boolean;
  isPhoneConfirmed: boolean;
  createdAt: string;
  lastLoginAt?: string;
  roles: Role[];
  permissions: Permission[];
} 