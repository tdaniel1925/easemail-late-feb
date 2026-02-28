/**
 * Simple in-memory rate limiter
 * Tracks request counts per identifier (IP address or user ID)
 *
 * PRODUCTION NOTE: For multi-instance deployments, use Redis-based rate limiting
 * with @upstash/ratelimit or similar distributed solution
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private records: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired records every minute to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.records.entries()) {
        if (record.resetAt < now) {
          this.records.delete(key);
        }
      }
    }, 60000);
  }

  /**
   * Check if request is allowed under rate limit
   *
   * @param identifier - Unique identifier (IP address, user ID, etc.)
   * @param limit - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns Object with success status and remaining requests
   */
  check(
    identifier: string,
    limit: number,
    windowMs: number
  ): {
    success: boolean;
    remaining: number;
    resetAt: number;
  } {
    const now = Date.now();
    const record = this.records.get(identifier);

    // No record or expired record - allow request
    if (!record || record.resetAt < now) {
      const resetAt = now + windowMs;
      this.records.set(identifier, {
        count: 1,
        resetAt,
      });

      return {
        success: true,
        remaining: limit - 1,
        resetAt,
      };
    }

    // Record exists and is still valid
    if (record.count < limit) {
      record.count++;
      return {
        success: true,
        remaining: limit - record.count,
        resetAt: record.resetAt,
      };
    }

    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  /**
   * Reset rate limit for an identifier
   */
  reset(identifier: string): void {
    this.records.delete(identifier);
  }

  /**
   * Clean up and stop the cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.records.clear();
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different API routes
 */
export const rateLimits = {
  // Authentication endpoints - stricter limits
  auth: {
    limit: 5,
    windowMs: 60000, // 5 requests per minute
  },

  // API routes - moderate limits
  api: {
    limit: 60,
    windowMs: 60000, // 60 requests per minute
  },

  // Sync endpoints - more permissive
  sync: {
    limit: 10,
    windowMs: 60000, // 10 requests per minute
  },

  // Webhooks - very permissive (Microsoft Graph sends many)
  webhook: {
    limit: 1000,
    windowMs: 60000, // 1000 requests per minute
  },

  // AI endpoints - more restrictive due to cost
  ai: {
    limit: 20,
    windowMs: 60000, // 20 requests per minute
  },
} as const;

/**
 * Get client identifier from request
 * Uses IP address or user ID if available
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Get IP address from headers (supports various proxy headers)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Apply rate limiting to a request
 *
 * @param identifier - Unique identifier for the client
 * @param config - Rate limit configuration
 * @returns Result object with success status and rate limit info
 */
export function rateLimit(
  identifier: string,
  config: { limit: number; windowMs: number }
) {
  return rateLimiter.check(identifier, config.limit, config.windowMs);
}

/**
 * Reset rate limit for an identifier (useful for testing)
 */
export function resetRateLimit(identifier: string): void {
  rateLimiter.reset(identifier);
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(
  limit: number,
  remaining: number,
  resetAt: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.floor(resetAt / 1000)),
    'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
  };
}
