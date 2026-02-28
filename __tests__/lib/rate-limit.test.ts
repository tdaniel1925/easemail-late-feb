/**
 * Tests for rate limiting functionality
 * Verifies rate limiter logic and middleware wrapper
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, rateLimits, resetRateLimit, getClientIdentifier } from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  const testIdentifier = 'test:user123';
  const config = { limit: 5, windowMs: 60000 }; // 5 requests per minute

  beforeEach(() => {
    // Reset rate limit before each test
    resetRateLimit(testIdentifier);
  });

  it('allows requests under the limit', () => {
    const result1 = rateLimit(testIdentifier, config);
    expect(result1.success).toBe(true);
    expect(result1.remaining).toBe(4);

    const result2 = rateLimit(testIdentifier, config);
    expect(result2.success).toBe(true);
    expect(result2.remaining).toBe(3);

    const result3 = rateLimit(testIdentifier, config);
    expect(result3.success).toBe(true);
    expect(result3.remaining).toBe(2);
  });

  it('blocks requests over the limit', () => {
    // Make 5 requests (should all succeed)
    for (let i = 0; i < 5; i++) {
      const result = rateLimit(testIdentifier, config);
      expect(result.success).toBe(true);
    }

    // 6th request should fail
    const result = rateLimit(testIdentifier, config);
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('provides correct remaining count', () => {
    const result1 = rateLimit(testIdentifier, config);
    expect(result1.remaining).toBe(4); // 5 - 1 = 4

    const result2 = rateLimit(testIdentifier, config);
    expect(result2.remaining).toBe(3); // 5 - 2 = 3

    const result3 = rateLimit(testIdentifier, config);
    expect(result3.remaining).toBe(2); // 5 - 3 = 2
  });

  it('provides reset timestamp', () => {
    const result = rateLimit(testIdentifier, config);
    expect(result.resetAt).toBeGreaterThan(Date.now());
    expect(result.resetAt).toBeLessThanOrEqual(Date.now() + config.windowMs);
  });

  it('resets after window expires', () => {
    // Use a short window for testing
    const shortConfig = { limit: 2, windowMs: 100 }; // 100ms window

    // Make 2 requests (should both succeed)
    const result1 = rateLimit(testIdentifier, shortConfig);
    expect(result1.success).toBe(true);

    const result2 = rateLimit(testIdentifier, shortConfig);
    expect(result2.success).toBe(true);

    // 3rd request should fail
    const result3 = rateLimit(testIdentifier, shortConfig);
    expect(result3.success).toBe(false);

    // Wait for window to expire
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Request should succeed after window reset
        const result4 = rateLimit(testIdentifier, shortConfig);
        expect(result4.success).toBe(true);
        expect(result4.remaining).toBe(1); // Back to limit - 1
        resolve();
      }, 150); // Wait longer than windowMs
    });
  });

  it('handles multiple identifiers independently', () => {
    const identifier1 = 'user:123';
    const identifier2 = 'user:456';

    // Make 5 requests for identifier1 (all should succeed)
    for (let i = 0; i < 5; i++) {
      const result = rateLimit(identifier1, config);
      expect(result.success).toBe(true);
    }

    // 6th request for identifier1 should fail
    const result1 = rateLimit(identifier1, config);
    expect(result1.success).toBe(false);

    // First request for identifier2 should succeed (different identifier)
    const result2 = rateLimit(identifier2, config);
    expect(result2.success).toBe(true);
    expect(result2.remaining).toBe(4);
  });

  it('resets rate limit manually', () => {
    // Make 5 requests (should all succeed)
    for (let i = 0; i < 5; i++) {
      const result = rateLimit(testIdentifier, config);
      expect(result.success).toBe(true);
    }

    // 6th request should fail
    const result1 = rateLimit(testIdentifier, config);
    expect(result1.success).toBe(false);

    // Manually reset
    resetRateLimit(testIdentifier);

    // Request should succeed after manual reset
    const result2 = rateLimit(testIdentifier, config);
    expect(result2.success).toBe(true);
    expect(result2.remaining).toBe(4);
  });

  describe('Rate Limit Configurations', () => {
    it('has correct auth rate limit', () => {
      expect(rateLimits.auth).toEqual({
        limit: 5,
        windowMs: 60000,
      });
    });

    it('has correct API rate limit', () => {
      expect(rateLimits.api).toEqual({
        limit: 60,
        windowMs: 60000,
      });
    });

    it('has correct sync rate limit', () => {
      expect(rateLimits.sync).toEqual({
        limit: 10,
        windowMs: 60000,
      });
    });

    it('has correct webhook rate limit', () => {
      expect(rateLimits.webhook).toEqual({
        limit: 1000,
        windowMs: 60000,
      });
    });

    it('has correct AI rate limit', () => {
      expect(rateLimits.ai).toEqual({
        limit: 20,
        windowMs: 60000,
      });
    });
  });

  describe('getClientIdentifier', () => {
    it('uses user ID when provided', () => {
      const request = new Request('http://localhost:3000/api/test');
      const identifier = getClientIdentifier(request, 'user123');
      expect(identifier).toBe('user:user123');
    });

    it('uses IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });
      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('ip:192.168.1.1');
    });

    it('uses IP from x-real-ip header', () => {
      const request = new Request('http://localhost:3000/api/test', {
        headers: {
          'x-real-ip': '192.168.1.1',
        },
      });
      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('ip:192.168.1.1');
    });

    it('falls back to unknown when no IP headers', () => {
      const request = new Request('http://localhost:3000/api/test');
      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('ip:unknown');
    });
  });
});
