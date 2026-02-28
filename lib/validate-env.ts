/**
 * Environment Variable Validation
 * Validates all required environment variables at startup
 * Prevents runtime errors from missing configuration
 *
 * ENHANCED: Now uses Zod for robust type-safe validation
 */

import { z } from 'zod';

/**
 * Environment variable schema with Zod validation
 * Provides automatic type inference and detailed error messages
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Supabase - Required
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL',
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, {
    message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required',
  }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, {
    message: 'SUPABASE_SERVICE_ROLE_KEY is required for server-side operations',
  }),

  // Azure AD / Microsoft Graph - Required
  AZURE_AD_CLIENT_ID: z.string().min(1, {
    message: 'AZURE_AD_CLIENT_ID is required for Microsoft Graph integration',
  }),
  AZURE_AD_CLIENT_SECRET: z.string().min(1, {
    message: 'AZURE_AD_CLIENT_SECRET is required for Microsoft Graph integration',
  }),
  AZURE_AD_TENANT_ID: z.string().min(1, {
    message: 'AZURE_AD_TENANT_ID is required for Microsoft Graph integration',
  }),

  // NextAuth - Required
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(32, {
    message: 'NEXTAUTH_SECRET must be at least 32 characters',
  }),

  // Anthropic Claude AI - Optional (AI features disabled if not provided)
  ANTHROPIC_API_KEY: z.string().min(1).optional(),

  // OpenAI - Optional (backup AI provider)
  OPENAI_API_KEY: z.string().min(1).optional(),

  // App URL
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Webhooks - Optional
  WEBHOOK_SECRET: z.string().min(32).optional(),

  // Background jobs (Inngest) - Optional
  INNGEST_EVENT_KEY: z.string().min(1).optional(),
  INNGEST_SIGNING_KEY: z.string().min(1).optional(),

  // Error tracking (Sentry) - Optional
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

// Export the validated environment variables type
export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate environment variables using Zod schema
 * Call this at app startup to ensure all required vars are present
 *
 * @throws {Error} If validation fails with detailed error message
 */
export function validateEnvironmentVariables(): EnvConfig {
  try {
    const env = envSchema.parse(process.env);

    // Additional custom validations
    if (env.NODE_ENV === 'production') {
      // Production-specific requirements
      if (!env.NEXTAUTH_URL) {
        throw new Error('NEXTAUTH_URL is required in production');
      }

      if (!env.NEXT_PUBLIC_APP_URL) {
        console.warn(
          '⚠️  WARNING: NEXT_PUBLIC_APP_URL not set in production. Some features may not work correctly.'
        );
      }

      // Warn if AI features are not configured
      if (!env.ANTHROPIC_API_KEY && !env.OPENAI_API_KEY) {
        console.warn(
          '⚠️  WARNING: No AI API keys configured. AI features will be disabled.'
        );
      }

      // Warn if webhooks are not configured
      if (!env.WEBHOOK_SECRET) {
        console.warn(
          '⚠️  WARNING: WEBHOOK_SECRET not set. Microsoft Graph webhooks will be disabled.'
        );
      }
    }

    console.log('✅ All environment variables validated successfully');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format Zod validation errors for better readability
      const errorMessages = error.errors
        .map((err) => {
          const path = err.path.join('.');
          return `  ❌ ${path}: ${err.message}`;
        })
        .join('\n');

      const errorMessage = `
╔════════════════════════════════════════════════════════════╗
║          ENVIRONMENT VARIABLE VALIDATION FAILED            ║
╚════════════════════════════════════════════════════════════╝

The following environment variables are missing or invalid:

${errorMessages}

Please check your .env.local file and ensure all required variables are set.

For a complete list of required variables, see:
  - .env.example
  - README.md
  - SETUP-CHECKLIST.md

════════════════════════════════════════════════════════════
`;

      console.error(errorMessage);

      // In production, crash immediately to prevent runtime errors
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Environment validation failed. See console for details.');
      }
    }

    throw error;
  }
}

/**
 * Get validated environment variables
 * Safe to call after validateEnvironmentVariables()
 *
 * @returns Typed and validated environment variables
 */
export function getEnv(): EnvConfig {
  return envSchema.parse(process.env);
}

/**
 * Get a single environment variable with type safety
 *
 * @param key - The environment variable key
 * @returns The validated value
 * @throws {Error} If the variable is not set or invalid
 */
export function getEnvVar<K extends keyof EnvConfig>(key: K): NonNullable<EnvConfig[K]> {
  const value = process.env[key];

  if (!value) {
    throw new Error(
      `Environment variable ${key} is not set. Please add it to your .env.local file.`
    );
  }

  return value as NonNullable<EnvConfig[K]>;
}

/**
 * Check if a feature is enabled based on environment variables
 */
export function isFeatureEnabled(feature: 'ai' | 'webhooks' | 'backgroundJobs'): boolean {
  switch (feature) {
    case 'ai':
      return !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
    case 'webhooks':
      return !!process.env.WEBHOOK_SECRET;
    case 'backgroundJobs':
      return !!(process.env.INNGEST_EVENT_KEY && process.env.INNGEST_SIGNING_KEY);
    default:
      return false;
  }
}

// Validate on module load (server-side only)
// This ensures environment is validated before any code runs
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    validateEnvironmentVariables();
  } catch (error) {
    // In development, log the error but allow the app to start
    // (so developers can see the error in the browser)
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    } else {
      // In production, crash immediately
      throw error;
    }
  }
}
