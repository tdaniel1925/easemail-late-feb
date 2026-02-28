/**
 * Next.js Instrumentation
 * Runs once when the server starts
 * Perfect for environment validation and other startup tasks
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('\n🔧 Initializing EaseMail...\n');

    // 1. Validate environment variables
    const { validateEnvironmentVariables } = await import('./lib/validate-env');
    validateEnvironmentVariables();

    // 2. Initialize Sentry for error monitoring (optional)
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        const Sentry = await import('@sentry/nextjs');

        Sentry.init({
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

          // Adjust sample rate in production (0.1 = 10% of transactions)
          tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

          // Enable debug in development
          debug: process.env.NODE_ENV === 'development',

          environment: process.env.NODE_ENV || 'development',

          // Only enabled in production
          enabled: process.env.NODE_ENV === 'production',

          // Ignore expected errors
          ignoreErrors: [
            'top.GLOBALS', // Browser extensions
            'NetworkError',
            'Network request failed',
            'Rate limit exceeded', // Expected from Microsoft Graph
          ],

          beforeSend(event, hint) {
            const error = hint.originalException;

            if (error && typeof error === 'object' && 'message' in error) {
              const message = String(error.message);

              // Don't send expected auth errors (401/Unauthorized)
              if (message.includes('Unauthorized') || message.includes('401')) {
                return null;
              }

              // Don't send rate limit errors (429 - working as intended)
              if (message.includes('429') || message.includes('Too many requests')) {
                return null;
              }
            }

            return event;
          },
        });

        console.log('✅ Sentry initialized for error monitoring');
      } catch (error) {
        console.error('⚠️  Failed to initialize Sentry:', error);
      }
    } else {
      console.log('ℹ️  Sentry not configured (optional - set NEXT_PUBLIC_SENTRY_DSN to enable)');
    }

    console.log('');
  }
}
