import { test, expect } from '@playwright/test';

test.describe('Dashboard Data Overview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/zh/dashboard');
  });

  test('should render dashboard with stat cards and charts', async ({ page }) => {
    // Wait for dashboard title to appear (data loaded)
    const dashboardTitle = page.getByRole('heading', { name: '数据概览' });
    await expect(dashboardTitle).toBeVisible();

    // Verify all four stat cards are visible
    await expect(page.getByText('今日新增工单')).toBeVisible();
    await expect(page.getByText('待处理工单')).toBeVisible();
    await expect(page.getByText('已解决工单')).toBeVisible();
    await expect(page.getByText('平均响应时间')).toBeVisible();

    // Verify charts have aria-labels (using role="img" with accessible name)
    const trendChart = page.getByRole('img', { name: /近\s*7\s*天工单量趋势/ });
    const pieChart = page.getByRole('img', { name: /工单状态分布/ });
    const barChart = page.getByRole('img', { name: /处理人工单量排行/ });
    await expect(trendChart).toBeVisible();
    await expect(pieChart).toBeVisible();
    await expect(barChart).toBeVisible();
  });

  test('should have a working refresh button', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.getByRole('heading', { name: '数据概览' })).toBeVisible();

    // Verify refresh button is present
    const refreshButton = page.getByRole('button', { name: '刷新' });
    await expect(refreshButton).toBeVisible();

    // Click refresh; the mock refetch resolves quickly. The button must remain
    // interactive and the charts must still be present afterward, confirming
    // the page did not crash.
    await refreshButton.click();

    // Charts remain visible after refresh (data is re-fetched and re-rendered).
    await expect(page.getByRole('img', { name: /工单状态分布/ })).toBeVisible();
    await expect(refreshButton).toBeVisible();
  });

  test('should navigate to pending tickets when clicking pending stat card', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.getByRole('heading', { name: '数据概览' })).toBeVisible();

    // Click the pending tickets card (it is a link)
    const pendingLink = page.getByRole('link', { name: /待处理工单/ });
    await pendingLink.click();

    // Verify navigation to tickets with status=pending filter
    await expect(page).toHaveURL(/\/zh\/tickets\?status=pending/);
  });
});
