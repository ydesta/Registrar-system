export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  phoneNumber?: string;
  isSelfRegistration?: boolean;
  roleNames?: string[];
  requireEmailConfirmation?: boolean;
  requirePhoneConfirmation?: boolean;
}

export interface OtpVerifyRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  email: string;
  token: string;
}

export interface RefreshTokenRequest {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: string | null;
  userType: string | null;
  roles?: string[];
  permissions?: string[];
}

export interface AuthenticationInfo {
  isLogin: boolean;
  _user: User;
  user?: User;
  roles?: string[];
  permissions?: string[];
} 