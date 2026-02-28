import { NextRequest, NextResponse } from 'next/server';
import {
  rateLimit,
  rateLimits,
  getClientIdentifier,
  createRateLimitHeaders,
} from './rate-limit';

/**
 * Higher-order function to wrap API routes with rate limiting
 *
 * Usage:
 * export const POST = withRateLimit(
 *   async (request: NextRequest) => {
 *     // Your handler logic
 *     return NextResponse.json({ success: true });
 *   },
 *   { type: 'api', getUserId: async (req) => { ... } }
 * );
 */
export function withRateLimit<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options: {
    type: keyof typeof rateLimits;
    getUserId?: (request: NextRequest) => Promise<string | undefined>;
  }
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Get rate limit config
      const config = rateLimits[options.type];

      // Get user ID if available
      let userId: string | undefined;
      if (options.getUserId) {
        try {
          userId = await options.getUserId(request);
        } catch (error) {
          // Continue without user ID - will use IP instead
          console.warn('Failed to get user ID for rate limiting:', error);
        }
      }

      // Get client identifier
      const identifier = getClientIdentifier(request, userId);

      // Check rate limit
      const result = rateLimit(identifier, config);

      // Create rate limit headers
      const headers = createRateLimitHeaders(
        config.limit,
        result.remaining,
        result.resetAt
      );

      // Rate limit exceeded
      if (!result.success) {
        return NextResponse.json(
          {
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
          },
          {
            status: 429,
            headers,
          }
        );
      }

      // Execute handler
      const response = await handler(request, ...args);

      // Add rate limit headers to successful response
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error: any) {
      console.error('Rate limiting middleware error:', error);
      // On error, allow the request to proceed (fail open)
      return handler(request, ...args);
    }
  };
}

/**
 * Helper to get user ID from session
 * Use this with withRateLimit for authenticated routes
 */
export async function getUserIdFromSession(
  request: NextRequest
): Promise<string | undefined> {
  try {
    // Import here to avoid circular dependencies
    const { getCurrentUser } = await import('@/lib/supabase/server');
    const user = await getCurrentUser();
    return user?.id;
  } catch (error) {
    return undefined;
  }
}
