import { test, expect } from '@playwright/test';

test.describe('Ticket Detail and Status Transition', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/zh/tickets');
    // Wait for ticket list to load
    await expect(page.getByRole('link', { name: /TK-/ }).first()).toBeVisible();
  });

  test('should navigate to ticket detail and display ticket info', async ({ page }) => {
    // Click the first ticket row
    const firstTicket = page.getByRole('link', { name: /TK-/ }).first();
    const ticketText = await firstTicket.textContent();
    // Extract ticket ID (e.g. "TK-0001") from the row text
    const ticketIdMatch = ticketText?.match(/TK-\d+/);
    const ticketId = ticketIdMatch ? ticketIdMatch[0] : null;
    await firstTicket.click();

    // Verify URL contains /tickets/
    await expect(page).toHaveURL(/\/zh\/tickets\/TK-/);

    // Verify ticket detail content is visible — description heading
    await expect(page.getByText('问题描述')).toBeVisible();

    // Verify the ticket ID is displayed in the metadata paragraph
    // (rendered as "工单编号: TK-xxxxx", so match as a substring).
    if (ticketId) {
      await expect(page.getByText(ticketId)).toBeVisible();
    }
  });

  test('should transition ticket status from pending to in_progress', async ({ page }) => {
    // Navigate to first pending ticket
    await page.goto('/zh/tickets?status=pending');
    await expect(page.getByRole('link', { name: /TK-/ }).first()).toBeVisible();
    await page.getByRole('link', { name: /TK-/ }).first().click();

    // Wait for detail page to load
    await expect(page).toHaveURL(/\/zh\/tickets\/TK-/);
    await expect(page.getByText('问题描述')).toBeVisible();

    // The available transition button uses the markAs label (e.g. "标记为 处理中")
    const startButton = page.getByRole('button', { name: /处理中/ });
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Verify the status changed — "处理中" should appear in the status badge
    await expect(page.getByText('处理中').first()).toBeVisible();
  });
});
