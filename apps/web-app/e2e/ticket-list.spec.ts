import { test, expect } from '@playwright/test';

test.describe('Ticket List Browsing and Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/zh/tickets');
    // Wait for the ticket list to load — rows are links to ticket detail
    await expect(page.getByRole('link', { name: /TK-/ }).first()).toBeVisible();
  });

  test('should display ticket list with data loaded', async ({ page }) => {
    // Assert at least one ticket row is visible
    const ticketRows = page.getByRole('link', { name: /TK-/ });
    await expect(ticketRows.first()).toBeVisible();

    // Assert the filter bar is present with status filter label
    await expect(page.getByText('状态:')).toBeVisible();

    // Assert the search input is present
    await expect(page.getByLabel('搜索工单')).toBeVisible();
  });

  test('should filter tickets by status', async ({ page }) => {
    // Click the "pending" status filter button
    const pendingButton = page.getByRole('button', { name: '待处理' });
    await pendingButton.click();

    // Verify URL contains status=pending
    await expect(page).toHaveURL(/status=pending/);

    // Verify the button is now in active state (aria-pressed=true)
    await expect(pendingButton).toHaveAttribute('aria-pressed', 'true');

    // Wait for list to update and verify at least one ticket is shown
    await expect(page.getByRole('link', { name: /TK-/ }).first()).toBeVisible();
  });

  test('should filter tickets by priority', async ({ page }) => {
    // Click the "urgent" priority filter button
    const urgentButton = page.getByRole('button', { name: '紧急' });
    await urgentButton.click();

    // Verify URL contains priority=urgent
    await expect(page).toHaveURL(/priority=urgent/);

    // Verify the button is now in active state
    await expect(urgentButton).toHaveClass(/bg-primary/);
  });

  test('should search tickets by keyword', async ({ page }) => {
    const searchInput = page.getByLabel('搜索工单');
    await searchInput.fill('登录');
    await searchInput.press('Enter');

    // Verify URL contains the keyword param. The Chinese term "登录" is
    // percent-encoded by URLSearchParams, so match the encoded form.
    await expect(page).toHaveURL(/keyword=%E7%99%BB%E5%BD%95/);

    // The filtered results still render ticket rows.
    await expect(page.getByRole('link', { name: /TK-/ }).first()).toBeVisible();
  });
});
