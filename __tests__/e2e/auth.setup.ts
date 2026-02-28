import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../../playwright/.auth/user.json');

setup('authenticate', async ({ page, context }) => {
  // Set test mode cookie to bypass authentication
  await context.addCookies([
    {
      name: 'test-mode',
      value: 'true',
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
      expires: Date.now() / 1000 + 3600,
    },
  ]);

  // Call the test auth endpoint to set up test user in database
  const response = await page.goto('/api/test/auth', { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Verify the auth endpoint succeeded
  expect(response?.status()).toBe(200);

  // Save the authenticated state (with test-mode cookie)
  await context.storageState({ path: authFile });

  console.log('✓ Test authentication setup complete');
});
