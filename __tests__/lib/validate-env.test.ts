/**
 * Tests for environment variable validation
 * Verifies Zod schema validation and error messages
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock environment variables for testing
const mockEnv = {
  NODE_ENV: 'test',
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-123',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-123',
  AZURE_AD_CLIENT_ID: 'azure-client-id',
  AZURE_AD_CLIENT_SECRET: 'azure-client-secret',
  AZURE_AD_TENANT_ID: 'azure-tenant-id',
  NEXTAUTH_SECRET: 'this-is-a-secret-that-is-at-least-32-characters-long',
};

describe('Environment Validation', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original env
    originalEnv = { ...process.env };

    // Set up mock env
    process.env = { ...mockEnv };

    // Clear the module cache to force re-import
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  it('validates successfully with all required variables', async () => {
    const { validateEnvironmentVariables } = await import('@/lib/validate-env');

    expect(() => validateEnvironmentVariables()).not.toThrow();
  });

  it('throws error when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const { validateEnvironmentVariables } = await import('@/lib/validate-env');

    expect(() => validateEnvironmentVariables()).toThrow();
  });

  it('throws error when NEXT_PUBLIC_SUPABASE_URL is invalid', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-url';

    const { validateEnvironmentVariables } = await import('@/lib/validate-env');

    expect(() => validateEnvironmentVariables()).toThrow();
  });

  it('throws error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { validateEnvironmentVariables } = await import('@/lib/validate-env');

    expect(() => validateEnvironmentVariables()).toThrow();
  });

  it('throws error when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const { validateEnvironmentVariables } = await import('@/lib/validate-env');

    expect(() => validateEnvironmentVariables()).toThrow();
  });

  it('throws error when AZURE_AD_CLIENT_ID is missing', async () => {
    delete process.env.AZURE_AD_CLIENT_ID;

    const { validateEnvironmentVariables } = await import('@/lib/validate-env');

    expect(() => validateEnvironmentVariables()).toThrow();
  });

  it('throws error when AZURE_AD_CLIENT_SECRET is missing', async () => {
    delete process.env.AZURE_AD_CLIENT_SECRET;

    const { validateEnvironmentVariables } = await import('@/lib/validate-env');

    expect(() => validateEnvironmentVariables()).toThrow();
  });

  it('throws error when AZURE_AD_TENANT_ID is missing', async () => {
    delete process.env.AZURE_AD_TENANT_ID;

    const { validateEnvironmentVariables } = await import('@/lib/validate-env');

    expect(() => validateEnvironmentVariables()).toThrow();
  });

  it('throws error when NEXTAUTH_SECRET is too short', async () => {
    process.env.NEXTAUTH_SECRET = 'short';

    const { validateEnvironmentVariables } = await import('@/lib/validate-env');

    expect(() => validateEnvironmentVariables()).toThrow(/at least 32 characters/);
  });

  it('allows optional variables to be missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.WEBHOOK_SECRET;
    delete process.env.INNGEST_EVENT_KEY;
    delete process.env.INNGEST_SIGNING_KEY;

    const { validateEnvironmentVariables } = await import('@/lib/validate-env');

    expect(() => validateEnvironmentVariables()).not.toThrow();
  });

  it('requires NEXTAUTH_URL in production', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.NEXTAUTH_URL;

    const { validateEnvironmentVariables } = await import('@/lib/validate-env');

    expect(() => validateEnvironmentVariables()).toThrow(/NEXTAUTH_URL is required in production/);
  });

  it('allows NEXTAUTH_URL to be optional in development', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.NEXTAUTH_URL;

    const { validateEnvironmentVariables } = await import('@/lib/validate-env');

    expect(() => validateEnvironmentVariables()).not.toThrow();
  });

  it('getEnv returns typed environment variables', async () => {
    const { getEnv } = await import('@/lib/validate-env');

    const env = getEnv();

    expect(env.NODE_ENV).toBe('test');
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://example.supabase.co');
    expect(env.AZURE_AD_CLIENT_ID).toBe('azure-client-id');
  });

  it('getEnvVar returns specific variable', async () => {
    const { getEnvVar } = await import('@/lib/validate-env');

    const value = getEnvVar('AZURE_AD_CLIENT_ID');

    expect(value).toBe('azure-client-id');
  });

  it('getEnvVar throws when variable is missing', async () => {
    delete process.env.AZURE_AD_CLIENT_ID;

    const { getEnvVar } = await import('@/lib/validate-env');

    expect(() => getEnvVar('AZURE_AD_CLIENT_ID')).toThrow(/not set/);
  });

  describe('Feature Flags', () => {
    it('detects AI feature when ANTHROPIC_API_KEY is set', async () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-123';

      const { isFeatureEnabled } = await import('@/lib/validate-env');

      expect(isFeatureEnabled('ai')).toBe(true);
    });

    it('detects AI feature when OPENAI_API_KEY is set', async () => {
      process.env.OPENAI_API_KEY = 'sk-123';

      const { isFeatureEnabled } = await import('@/lib/validate-env');

      expect(isFeatureEnabled('ai')).toBe(true);
    });

    it('detects AI feature is disabled when no API keys', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const { isFeatureEnabled } = await import('@/lib/validate-env');

      expect(isFeatureEnabled('ai')).toBe(false);
    });

    it('detects webhooks feature when WEBHOOK_SECRET is set', async () => {
      process.env.WEBHOOK_SECRET = 'webhook-secret-at-least-32-chars-long-123456';

      const { isFeatureEnabled } = await import('@/lib/validate-env');

      expect(isFeatureEnabled('webhooks')).toBe(true);
    });

    it('detects webhooks feature is disabled when WEBHOOK_SECRET is missing', async () => {
      delete process.env.WEBHOOK_SECRET;

      const { isFeatureEnabled } = await import('@/lib/validate-env');

      expect(isFeatureEnabled('webhooks')).toBe(false);
    });

    it('detects background jobs feature when Inngest keys are set', async () => {
      process.env.INNGEST_EVENT_KEY = 'event-key';
      process.env.INNGEST_SIGNING_KEY = 'signing-key';

      const { isFeatureEnabled } = await import('@/lib/validate-env');

      expect(isFeatureEnabled('backgroundJobs')).toBe(true);
    });

    it('detects background jobs feature is disabled when Inngest keys are missing', async () => {
      delete process.env.INNGEST_EVENT_KEY;
      delete process.env.INNGEST_SIGNING_KEY;

      const { isFeatureEnabled } = await import('@/lib/validate-env');

      expect(isFeatureEnabled('backgroundJobs')).toBe(false);
    });
  });
});
