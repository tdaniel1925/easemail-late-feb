/**
 * Next.js Instrumentation
 * Runs once when the server starts
 * Perfect for environment validation and other startup tasks
 */

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnvironmentVariables } = await import('./lib/validate-env');

    console.log('\n🔧 Initializing EaseMail...');
    validateEnvironmentVariables();
    console.log('');
  }
}
