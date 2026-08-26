import { test, expect } from '@playwright/test';

test.describe('Multi-tenant Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/zh/tickets');
    // Wait for page to load
    await expect(page.getByRole('link', { name: /TK-/ }).first()).toBeVisible();
  });

  test('should switch tenant theme and update CSS variables', async ({ page }) => {
    // Get the initial primary color from CSS variable
    const initialColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary-500')
        .trim();
    });

    // Click the tenant switcher button (aria-label="切换租户")
    const switcherButton = page.getByRole('button', { name: '切换租户' });
    await switcherButton.click();

    // Wait for dropdown to appear
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();

    // Select "Globex Inc" tenant
    const globexOption = page.getByRole('option', { name: /Globex Inc/ });
    await globexOption.click();

    // Wait for CSS variable to change
    await page.waitForFunction((oldColor) => {
      const newColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary-500')
        .trim();
      return newColor !== oldColor && newColor.length > 0;
    }, initialColor);

    // Verify the CSS variable changed
    const newColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary-500')
        .trim();
    });
    expect(newColor).not.toBe(initialColor);
    expect(newColor.length).toBeGreaterThan(0);

    // Verify the tenant name updated in the switcher
    await expect(page.getByRole('button', { name: '切换租户' })).toContainText('Globex Inc');
  });
});
