import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class XssSanitizationService {
  
  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Sanitizes HTML content to prevent XSS attacks
   * @param html - HTML string to sanitize
   * @returns SafeHtml object
   */
  sanitizeHtml(html: string): SafeHtml {
    if (!html) return this.sanitizer.bypassSecurityTrustHtml('');
    
    // Remove script tags and their content
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove javascript: protocols
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remove on* event handlers
    sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // Remove dangerous attributes
    sanitized = sanitized.replace(/\s(style|onload|onerror|onclick|onmouseover)\s*=\s*["'][^"']*["']/gi, '');
    
    return this.sanitizer.sanitize(1, sanitized) || this.sanitizer.bypassSecurityTrustHtml('');
  }

  /**
   * Sanitizes plain text to prevent XSS attacks
   * @param text - Text string to sanitize
   * @returns SafeHtml object
   */
  sanitizeText(text: string): SafeHtml {
    if (!text) return this.sanitizer.bypassSecurityTrustHtml('');
    
    // Escape HTML characters
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
    return this.sanitizer.bypassSecurityTrustHtml(escaped);
  }

  /**
   * Sanitizes user input for form fields
   * @param input - User input string
   * @returns Sanitized string
   */
  sanitizeInput(input: string): string {
    if (!input) return '';
    
    // Remove HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '');
    
    // Remove script content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove javascript: protocols
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remove dangerous characters
    sanitized = sanitized.replace(/[<>\"'%;()&+]/g, '');
    
    // Trim whitespace
    return sanitized.trim();
  }

  /**
   * Validates and sanitizes email input
   * @param email - Email string
   * @returns Sanitized email or empty string
   */
  sanitizeEmail(email: string): string {
    if (!email) return '';
    
    // Basic email validation and sanitization
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const sanitized = email.trim().toLowerCase();
    
    return emailRegex.test(sanitized) ? sanitized : '';
  }

  /**
   * Validates and sanitizes phone number input
   * @param phone - Phone number string
   * @returns Sanitized phone number or empty string
   */
  sanitizePhone(phone: string): string {
    if (!phone) return '';
    
    // Remove all non-digit characters except + at the beginning
    let sanitized = phone.replace(/[^\d+]/g, '');
    
    // Ensure + is only at the beginning
    if (sanitized.includes('+')) {
      sanitized = '+' + sanitized.replace(/\+/g, '');
    }
    
    // Basic phone validation (7-15 digits)
    const phoneRegex = /^(\+)?[1-9]\d{6,14}$/;
    return phoneRegex.test(sanitized) ? sanitized : '';
  }

  /**
   * Sanitizes URL input
   * @param url - URL string
   * @returns Sanitized URL or empty string
   */
  sanitizeUrl(url: string): string {
    if (!url) return '';
    
    // Remove javascript: and data: protocols
    let sanitized = url.replace(/^(javascript:|data:)/gi, '');
    
    // Basic URL validation
    try {
      const urlObj = new URL(sanitized);
      // Only allow http and https protocols
      if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
        return sanitized;
      }
    } catch (e) {
      // Invalid URL
    }
    
    return '';
  }

  /**
   * Checks if input contains potentially dangerous content
   * @param input - Input string to check
   * @returns true if input appears safe, false if potentially dangerous
   */
  isInputSafe(input: string): boolean {
    if (!input) return true;
    
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<link/i,
      /<meta/i,
      /<style/i,
      /expression\s*\(/i,
      /vbscript:/i,
      /data:text\/html/i
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Logs potential XSS attempts for security monitoring
   * @param input - Suspicious input
   * @param context - Context where input was detected
   */
  logPotentialXss(input: string, context: string): void {
    console.warn(`Potential XSS attempt detected in ${context}:`, {
      input: input.substring(0, 100), // Log first 100 chars only
      timestamp: new Date().toISOString(),
      context: context
    });
    
    // In production, you might want to send this to a security monitoring service
    // this.securityMonitoringService.logSecurityEvent('potential_xss', { input, context });
  }
}
