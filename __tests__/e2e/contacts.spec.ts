import { test, expect } from '@playwright/test';

test.describe('Contacts Module', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to contacts page
    await page.goto('/contacts');
  });

  test('should display contacts list', async ({ page }) => {
    // Wait for contacts to load
    await page.waitForSelector('[data-testid="contacts-list"]', { timeout: 10000 });

    // Check that contacts are displayed
    const contactItems = page.locator('[data-testid="contact-item"]');
    const count = await contactItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should filter contacts by search query', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="contacts-search"]', { timeout: 10000 });

    // Type in search box
    await page.fill('[data-testid="contacts-search"]', 'john');

    // Wait for filtered results
    await page.waitForTimeout(500);

    // Verify search results contain query
    const contactNames = page.locator('[data-testid="contact-name"]');
    const firstContact = await contactNames.first().textContent();
    expect(firstContact?.toLowerCase()).toContain('john');
  });

  test('should select and view contact details', async ({ page }) => {
    // Wait for contacts to load
    await page.waitForSelector('[data-testid="contact-item"]', { timeout: 10000 });

    // Click first contact
    await page.locator('[data-testid="contact-item"]').first().click();

    // Wait for details panel
    await page.waitForSelector('[data-testid="contact-details"]', { timeout: 5000 });

    // Verify details are visible
    expect(await page.locator('[data-testid="contact-details"]').isVisible()).toBe(true);
  });

  test('should toggle contact selection with checkbox', async ({ page }) => {
    // Wait for contacts to load
    await page.waitForSelector('[data-testid="contact-checkbox"]', { timeout: 10000 });

    // Click first contact checkbox
    const firstCheckbox = page.locator('[data-testid="contact-checkbox"]').first();
    await firstCheckbox.click();

    // Verify checkbox is checked
    expect(await firstCheckbox.isChecked()).toBe(true);

    // Uncheck
    await firstCheckbox.click();
    expect(await firstCheckbox.isChecked()).toBe(false);
  });

  test('should select all contacts', async ({ page }) => {
    // Wait for select all checkbox
    await page.waitForSelector('[data-testid="select-all-contacts"]', { timeout: 10000 });

    // Click select all
    await page.locator('[data-testid="select-all-contacts"]').click();

    // Wait for selection to apply
    await page.waitForTimeout(300);

    // Verify selection count is displayed
    const selectionCount = page.locator('[data-testid="selection-count"]');
    expect(await selectionCount.isVisible()).toBe(true);
  });

  test('should filter by company', async ({ page }) => {
    // Wait for filter button
    await page.waitForSelector('[data-testid="company-filter"]', { timeout: 10000 });

    // Click company filter
    await page.locator('[data-testid="company-filter"]').click();

    // Select a company from dropdown
    await page.waitForSelector('[role="option"]', { timeout: 5000 });
    await page.locator('[role="option"]').first().click();

    // Verify filter is applied
    await page.waitForTimeout(500);
    const contactItems = page.locator('[data-testid="contact-item"]');
    expect(await contactItems.count()).toBeGreaterThan(0);
  });

  test('should sync contacts', async ({ page }) => {
    // Wait for sync button
    await page.waitForSelector('[data-testid="sync-contacts"]', { timeout: 10000 });

    // Click sync button
    await page.locator('[data-testid="sync-contacts"]').click();

    // Verify sync started (loading indicator or toast)
    const syncIndicator = page.locator('[data-testid="syncing-indicator"]');
    await expect(syncIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should export contacts', async ({ page }) => {
    // Wait for export button
    await page.waitForSelector('[data-testid="export-contacts"]', { timeout: 10000 });

    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="export-contacts"]').click();

    // Verify download started
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('contacts');
  });
});
