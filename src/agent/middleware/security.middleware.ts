import { Injectable, Logger } from '@nestjs/common';
import { SecurityConfig } from '../interfaces/agent-module-config.interface';

/**
 * Security middleware for agent module
 * Provides input validation, rate limiting, and sanitization
 */
@Injectable()
export class SecurityMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);
  private rateLimitStore = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private config: SecurityConfig;

  constructor(config?: SecurityConfig) {
    this.config = config || {};
  }

  /**
   * Configure security settings
   */
  configure(config: SecurityConfig): void {
    this.config = { ...this.config, ...config };
    this.logger.log('Security middleware configured', { config });
  }

  /**
   * Validate and sanitize input
   */
  validateInput(
    input: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context?: any,
  ): { isValid: boolean; sanitizedInput?: string; errors?: string[] } {
    const errors: string[] = [];

    // Check if input exists
    if (!input || typeof input !== 'string') {
      errors.push('Input must be a non-empty string');
      return { isValid: false, errors };
    }

    // Check input length
    if (
      this.config.maxInputLength &&
      input.length > this.config.maxInputLength
    ) {
      errors.push(
        `Input length exceeds maximum allowed length of ${this.config.maxInputLength} characters`,
      );
    }

    // Sanitize input if enabled
    let sanitizedInput = input;
    if (this.config.sanitizeInput) {
      sanitizedInput = this.sanitizeInput(input);
    }

    // Check for malicious content
    if (this.containsMaliciousContent(sanitizedInput)) {
      errors.push('Input contains potentially malicious content');
    }

    // Check for allowed domains if making external requests
    if (
      this.config.allowedDomains &&
      this.containsExternalUrls(sanitizedInput)
    ) {
      const urls = this.extractUrls(sanitizedInput);
      const disallowedUrls = urls.filter((url) => !this.isAllowedDomain(url));
      if (disallowedUrls.length > 0) {
        errors.push(`External URLs not allowed: ${disallowedUrls.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      sanitizedInput: errors.length === 0 ? sanitizedInput : undefined,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Check rate limiting
   */
  rateLimit(key: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    if (!this.config.rateLimit) {
      return { allowed: true, remaining: -1, resetTime: 0 };
    }

    const now = Date.now();
    const { maxRequests, windowMs } = this.config.rateLimit;
    const resetTime = now + windowMs * 1000;

    const current = this.rateLimitStore.get(key);
    if (!current || current.resetTime <= now) {
      // Reset or create new entry
      this.rateLimitStore.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: maxRequests - 1, resetTime };
    }

    if (current.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: current.resetTime };
    }

    // Increment count
    current.count++;
    this.rateLimitStore.set(key, current);

    return {
      allowed: true,
      remaining: maxRequests - current.count,
      resetTime: current.resetTime,
    };
  }

  /**
   * Clean up expired rate limit entries
   */
  cleanupRateLimitStore(): void {
    const now = Date.now();
    for (const [key, value] of this.rateLimitStore.entries()) {
      if (value.resetTime <= now) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Sanitize input string
   */
  private sanitizeInput(input: string): string {
    return (
      input
        // Remove null bytes
        .replace(/\0/g, '')
        // Remove control characters except newlines and tabs
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Trim
        .trim()
    );
  }

  /**
   * Check for malicious content
   */
  private containsMaliciousContent(input: string): boolean {
    const maliciousPatterns = [
      // SQL injection patterns
      /(\b(union|select|insert|update|delete|drop|create|alter)\b)/i,
      // XSS patterns
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      // Command injection patterns
      /(\b(cmd|powershell|bash|sh|exec|system|eval)\b)/i,
      // Path traversal
      /\.\.\//,
      // Suspicious file extensions
      /\.(php|asp|jsp|exe|bat|cmd|ps1)$/i,
    ];

    return maliciousPatterns.some((pattern) => pattern.test(input));
  }

  /**
   * Check if input contains external URLs
   */
  private containsExternalUrls(input: string): boolean {
    const urlPattern = /https?:\/\/[^\s]+/gi;
    return urlPattern.test(input);
  }

  /**
   * Extract URLs from input
   */
  private extractUrls(input: string): string[] {
    const urlPattern = /https?:\/\/[^\s]+/gi;
    return input.match(urlPattern) || [];
  }

  /**
   * Check if domain is allowed
   */
  private isAllowedDomain(url: string): boolean {
    if (!this.config.allowedDomains) return true;

    try {
      const domain = new URL(url).hostname;
      return this.config.allowedDomains.some(
        (allowed) => domain === allowed || domain.endsWith(`.${allowed}`),
      );
    } catch {
      return false;
    }
  }

  /**
   * Generate rate limit key
   */
  generateRateLimitKey(context: any): string {
    if (this.config.rateLimit?.keyGenerator) {
      return this.config.rateLimit.keyGenerator(context);
    }

    // Default: use IP address or user ID
    return context?.ip || context?.userId || context?.sessionId || 'anonymous';
  }

  /**
   * Validate authentication
   */
  validateAuthentication(context: any): {
    authenticated: boolean;
    user?: any;
    error?: string;
  } {
    if (!this.config.authentication?.enabled) {
      return { authenticated: true };
    }

    try {
      const { type, config } = this.config.authentication;

      switch (type) {
        case 'jwt':
          return this.validateJWT(context, config);
        case 'api-key':
          return this.validateApiKey(context, config);
        case 'oauth':
          return this.validateOAuth(context, config);
        default:
          return {
            authenticated: false,
            error: 'Unsupported authentication type',
          };
      }
    } catch (error) {
      this.logger.error('Authentication validation failed', error);
      return {
        authenticated: false,
        error: 'Authentication validation failed',
      };
    }
  }

  /**
   * Validate JWT token
   */
  private validateJWT(
    context: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    config: any,
  ): { authenticated: boolean; user?: any; error?: string } {
    const token = context?.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      return { authenticated: false, error: 'No JWT token provided' };
    }

    try {
      // In a real implementation, you would verify the JWT here
      // const decoded = jwt.verify(token, config.secret);
      // return { authenticated: true, user: decoded };

      // Placeholder implementation
      return { authenticated: true, user: { id: 'user-123', role: 'user' } };
    } catch (error) {
      return { authenticated: false, error: 'Invalid JWT token' };
    }
  }

  /**
   * Validate API key
   */
  private validateApiKey(
    context: any,
    config: any,
  ): { authenticated: boolean; user?: any; error?: string } {
    const apiKey =
      context?.headers?.['x-api-key'] || context?.headers?.authorization;
    if (!apiKey) {
      return { authenticated: false, error: 'No API key provided' };
    }

    // In a real implementation, you would validate against stored API keys
    const validKeys = config?.validKeys || [];
    if (!validKeys.includes(apiKey)) {
      return { authenticated: false, error: 'Invalid API key' };
    }

    return { authenticated: true, user: { id: 'api-user', role: 'api' } };
  }

  /**
   * Validate OAuth
   */
  private validateOAuth(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: any,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    config: any,
  ): { authenticated: boolean; user?: any; error?: string } {
    // Placeholder implementation for OAuth validation
    return { authenticated: true, user: { id: 'oauth-user', role: 'user' } };
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    rateLimitEntries: number;
    blockedRequests: number;
    maliciousContentDetected: number;
  } {
    return {
      rateLimitEntries: this.rateLimitStore.size,
      blockedRequests: 0, // Would track this in a real implementation
      maliciousContentDetected: 0, // Would track this in a real implementation
    };
  }
}
