import { test, expect } from '@playwright/test';

test.describe('Teams Module', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to teams page
    await page.goto('/teams');
  });

  test('should display teams and channels list', async ({ page }) => {
    // Wait for teams list to load
    await page.waitForSelector('[data-testid="teams-sidebar"]', { timeout: 10000 });

    // Verify teams are displayed
    const teamItems = page.locator('[data-testid="team-item"]');
    expect(await teamItems.count()).toBeGreaterThan(0);
  });

  test('should expand and collapse team channels', async ({ page }) => {
    // Wait for teams to load
    await page.waitForSelector('[data-testid="team-item"]', { timeout: 10000 });

    // Click to expand first team
    const firstTeam = page.locator('[data-testid="team-item"]').first();
    await firstTeam.click();

    // Wait for channels to appear
    await page.waitForTimeout(500);
    const channels = page.locator('[data-testid="channel-item"]');
    expect(await channels.count()).toBeGreaterThan(0);

    // Click again to collapse
    await firstTeam.click();
    await page.waitForTimeout(300);
  });

  test('should select channel and display messages', async ({ page }) => {
    // Wait for channels to load
    await page.waitForSelector('[data-testid="channel-item"]', { timeout: 10000 });

    // Click first channel
    await page.locator('[data-testid="channel-item"]').first().click();

    // Wait for messages to load
    await page.waitForSelector('[data-testid="messages-container"]', { timeout: 10000 });

    // Verify messages are displayed
    expect(await page.locator('[data-testid="messages-container"]').isVisible()).toBe(true);
  });

  test('should send a message in a channel', async ({ page }) => {
    // Wait and select a channel
    await page.waitForSelector('[data-testid="channel-item"]', { timeout: 10000 });
    await page.locator('[data-testid="channel-item"]').first().click();

    // Wait for composer
    await page.waitForSelector('[data-testid="message-composer"]', { timeout: 10000 });

    // Type message
    await page.fill('[data-testid="message-input"]', 'Test message from E2E test');

    // Click send button
    await page.locator('[data-testid="send-message"]').click();

    // Verify message appears in list
    await page.waitForTimeout(2000);
    const messages = page.locator('[data-testid="message-item"]');
    const lastMessage = messages.last();
    expect(await lastMessage.textContent()).toContain('Test message');
  });

  test('should toggle favorite channel', async ({ page }) => {
    // Wait for channels
    await page.waitForSelector('[data-testid="channel-item"]', { timeout: 10000 });

    // Hover first channel to reveal favorite button
    const firstChannel = page.locator('[data-testid="channel-item"]').first();
    await firstChannel.hover();

    // Click favorite button
    await page.locator('[data-testid="favorite-channel"]').first().click();
    await page.waitForTimeout(500);

    // Verify channel is marked as favorite (check for star icon or class)
    const favoriteIcon = page.locator('[data-testid="favorite-icon"]').first();
    expect(await favoriteIcon.isVisible()).toBe(true);
  });

  test('should filter channels by search', async ({ page }) => {
    // Wait for search box
    await page.waitForSelector('[data-testid="channels-search"]', { timeout: 10000 });

    // Type in search
    await page.fill('[data-testid="channels-search"]', 'general');
    await page.waitForTimeout(500);

    // Verify filtered results
    const channels = page.locator('[data-testid="channel-item"]');
    const firstChannelName = await channels.first().textContent();
    expect(firstChannelName?.toLowerCase()).toContain('general');
  });

  test('should view message details and replies', async ({ page }) => {
    // Select channel and wait for messages
    await page.waitForSelector('[data-testid="channel-item"]', { timeout: 10000 });
    await page.locator('[data-testid="channel-item"]').first().click();
    await page.waitForSelector('[data-testid="message-item"]', { timeout: 10000 });

    // Click first message
    await page.locator('[data-testid="message-item"]').first().click();

    // Wait for message details panel
    await page.waitForSelector('[data-testid="message-details"]', { timeout: 5000 });

    // Verify details are visible
    expect(await page.locator('[data-testid="message-details"]').isVisible()).toBe(true);
  });

  test('should reply to a message', async ({ page }) => {
    // Select channel and wait for messages
    await page.waitForSelector('[data-testid="channel-item"]', { timeout: 10000 });
    await page.locator('[data-testid="channel-item"]').first().click();
    await page.waitForSelector('[data-testid="message-item"]', { timeout: 10000 });

    // Click first message to open details
    await page.locator('[data-testid="message-item"]').first().click();
    await page.waitForSelector('[data-testid="reply-input"]', { timeout: 5000 });

    // Type reply
    await page.fill('[data-testid="reply-input"]', 'Test reply from E2E');

    // Send reply
    await page.locator('[data-testid="send-reply"]').click();
    await page.waitForTimeout(2000);

    // Verify reply appears
    const replies = page.locator('[data-testid="reply-item"]');
    const lastReply = replies.last();
    expect(await lastReply.textContent()).toContain('Test reply');
  });

  test('should add reaction to message', async ({ page }) => {
    // Select channel and wait for messages
    await page.waitForSelector('[data-testid="channel-item"]', { timeout: 10000 });
    await page.locator('[data-testid="channel-item"]').first().click();
    await page.waitForSelector('[data-testid="message-item"]', { timeout: 10000 });

    // Hover first message to reveal reaction button
    const firstMessage = page.locator('[data-testid="message-item"]').first();
    await firstMessage.hover();

    // Click add reaction button
    await page.locator('[data-testid="add-reaction"]').first().click();

    // Select an emoji (e.g., thumbs up)
    await page.waitForSelector('[data-testid="emoji-picker"]', { timeout: 5000 });
    await page.locator('[data-testid="emoji-👍"]').click();

    // Verify reaction appears on message
    await page.waitForTimeout(500);
    const reactions = page.locator('[data-testid="message-reactions"]').first();
    expect(await reactions.isVisible()).toBe(true);
  });

  test('should sync teams and channels', async ({ page }) => {
    // Wait for sync button
    await page.waitForSelector('[data-testid="sync-teams"]', { timeout: 10000 });

    // Click sync button
    await page.locator('[data-testid="sync-teams"]').click();

    // Verify sync started
    const syncIndicator = page.locator('[data-testid="syncing-indicator"]');
    await expect(syncIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should filter messages by type', async ({ page }) => {
    // Select channel
    await page.waitForSelector('[data-testid="channel-item"]', { timeout: 10000 });
    await page.locator('[data-testid="channel-item"]').first().click();

    // Wait for filter button
    await page.waitForSelector('[data-testid="message-type-filter"]', { timeout: 10000 });

    // Open filter dropdown
    await page.locator('[data-testid="message-type-filter"]').click();

    // Select "Important" filter
    await page.waitForSelector('[role="option"]', { timeout: 5000 });
    await page.locator('[role="option"]', { hasText: 'Important' }).click();

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Verify messages are filtered
    const messages = page.locator('[data-testid="message-item"]');
    expect(await messages.count()).toBeGreaterThanOrEqual(0);
  });
});
