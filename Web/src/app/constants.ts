import { environment } from '../environments/environment';

export const API_AUTH_PATHS = [
  '/authentication/login',
  '/usr/login',
  '/authentication/register',
  '/authentication/test-login',
  '/authentication/database-check',
  '/authentication/verify-otp',
  '/authentication/forgot-password',
  '/authentication/reset-password',
  '/authentication/verify-email',
  '/authentication/resend-verification-email',
  '/authentication/resend-otp',
  '/authentication/csrf-token'
] as const;

export function isApiUrl(url: string): boolean {
  return url.startsWith(environment.secureUrl) || url.startsWith(environment.baseUrl);
}

export function isAuthUrl(url: string): boolean {
  return API_AUTH_PATHS.some(path => url.includes(path));
}

export function isStaticResource(url: string): boolean {
  return url.includes('/Resources/');
}

export const PUBLIC_AUTH_ROUTES = [
  '/accounts/login',
  '/accounts/register',
  '/accounts/forgot-password',
  '/accounts/reset-password',
  '/accounts/verify-email',
  '/accounts/change-password'
] as const;

export function isPublicAuthRoute(url: string): boolean {
  return PUBLIC_AUTH_ROUTES.some(path => url.includes(path));
}

export function isJwtExpired(token: string, bufferMs = 60000): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true;
    }
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return !payload?.exp || Date.now() >= payload.exp * 1000 - bufferMs;
  } catch {
    return true;
  }
}

export class Constants {
  static readonly apiRoot = environment.secureUrl;
  static readonly collegeApi = environment.baseUrl;
  static readonly fileUrl = environment.fileUrl;
}
