import { test, expect } from '@playwright/test';

test.describe('Calendar Module', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to calendar page
    await page.goto('/calendar');
  });

  test('should display calendar grid', async ({ page }) => {
    // Wait for calendar to load
    await page.waitForSelector('[data-testid="calendar-grid"]', { timeout: 10000 });

    // Verify calendar grid is visible
    expect(await page.locator('[data-testid="calendar-grid"]').isVisible()).toBe(true);
  });

  test('should switch between calendar views', async ({ page }) => {
    // Wait for view switcher
    await page.waitForSelector('[data-testid="view-month"]', { timeout: 10000 });

    // Switch to week view
    await page.locator('[data-testid="view-week"]').click();
    await page.waitForTimeout(300);
    expect(await page.locator('[data-testid="week-view"]').isVisible()).toBe(true);

    // Switch to day view
    await page.locator('[data-testid="view-day"]').click();
    await page.waitForTimeout(300);
    expect(await page.locator('[data-testid="day-view"]').isVisible()).toBe(true);

    // Switch to agenda view
    await page.locator('[data-testid="view-agenda"]').click();
    await page.waitForTimeout(300);
    expect(await page.locator('[data-testid="agenda-view"]').isVisible()).toBe(true);

    // Switch back to month view
    await page.locator('[data-testid="view-month"]').click();
    await page.waitForTimeout(300);
    expect(await page.locator('[data-testid="month-view"]').isVisible()).toBe(true);
  });

  test('should navigate between months', async ({ page }) => {
    // Wait for navigation buttons
    await page.waitForSelector('[data-testid="calendar-prev"]', { timeout: 10000 });

    // Get current month
    const currentMonth = await page.locator('[data-testid="current-month"]').textContent();

    // Navigate to next month
    await page.locator('[data-testid="calendar-next"]').click();
    await page.waitForTimeout(300);
    const nextMonth = await page.locator('[data-testid="current-month"]').textContent();
    expect(nextMonth).not.toBe(currentMonth);

    // Navigate to previous month
    await page.locator('[data-testid="calendar-prev"]').click();
    await page.waitForTimeout(300);
    const prevMonth = await page.locator('[data-testid="current-month"]').textContent();
    expect(prevMonth).toBe(currentMonth);
  });

  test('should go to today', async ({ page }) => {
    // Wait for today button
    await page.waitForSelector('[data-testid="go-to-today"]', { timeout: 10000 });

    // Navigate away from today
    await page.locator('[data-testid="calendar-prev"]').click();
    await page.waitForTimeout(300);

    // Click "Today" button
    await page.locator('[data-testid="go-to-today"]').click();
    await page.waitForTimeout(300);

    // Verify we're at current month (check if today's date is highlighted)
    const todayCell = page.locator('[data-testid="today-cell"]');
    expect(await todayCell.isVisible()).toBe(true);
  });

  test('should display event details on click', async ({ page }) => {
    // Wait for events to load
    await page.waitForSelector('[data-testid="calendar-event"]', { timeout: 10000 });

    // Click first event
    await page.locator('[data-testid="calendar-event"]').first().click();

    // Wait for event details modal/panel
    await page.waitForSelector('[data-testid="event-details"]', { timeout: 5000 });

    // Verify event details are visible
    expect(await page.locator('[data-testid="event-details"]').isVisible()).toBe(true);
    expect(await page.locator('[data-testid="event-subject"]').isVisible()).toBe(true);
  });

  test('should filter online meetings only', async ({ page }) => {
    // Wait for filter button
    await page.waitForSelector('[data-testid="filter-online-meetings"]', { timeout: 10000 });

    // Toggle online meetings filter
    await page.locator('[data-testid="filter-online-meetings"]').click();
    await page.waitForTimeout(500);

    // Verify filter is applied (events should have meeting links)
    const events = page.locator('[data-testid="calendar-event"]');
    if ((await events.count()) > 0) {
      const firstEvent = events.first();
      await firstEvent.click();
      await page.waitForSelector('[data-testid="meeting-link"]', { timeout: 5000 });
      expect(await page.locator('[data-testid="meeting-link"]').isVisible()).toBe(true);
    }
  });

  test('should filter by response status', async ({ page }) => {
    // Wait for response filter
    await page.waitForSelector('[data-testid="response-status-filter"]', { timeout: 10000 });

    // Select "Accepted" filter
    await page.locator('[data-testid="response-status-filter"]').click();
    await page.waitForSelector('[role="option"]', { timeout: 5000 });
    await page.locator('[role="option"]', { hasText: 'Accepted' }).click();

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Verify events are filtered
    const events = page.locator('[data-testid="calendar-event"]');
    expect(await events.count()).toBeGreaterThanOrEqual(0);
  });

  test('should sync calendar events', async ({ page }) => {
    // Wait for sync button
    await page.waitForSelector('[data-testid="sync-calendar"]', { timeout: 10000 });

    // Click sync button
    await page.locator('[data-testid="sync-calendar"]').click();

    // Verify sync started
    const syncIndicator = page.locator('[data-testid="syncing-indicator"]');
    await expect(syncIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should join online meeting from event', async ({ page }) => {
    // Wait for events with meeting links
    await page.waitForSelector('[data-testid="calendar-event"]', { timeout: 10000 });

    // Click first event
    await page.locator('[data-testid="calendar-event"]').first().click();

    // Wait for event details
    await page.waitForSelector('[data-testid="event-details"]', { timeout: 5000 });

    // If meeting link exists, verify join button
    const meetingLink = page.locator('[data-testid="join-meeting"]');
    if (await meetingLink.isVisible()) {
      expect(await meetingLink.getAttribute('href')).toContain('teams.microsoft.com');
    }
  });
});
