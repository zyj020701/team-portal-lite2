import { test, expect } from '@playwright/test';

test.describe('Language Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/zh/tickets');
    // Wait for page to load
    await expect(page.getByRole('link', { name: /TK-/ }).first()).toBeVisible();
  });

  test('should switch to English and update URL and text', async ({ page }) => {
    // Verify we start on Chinese locale
    await expect(page).toHaveURL(/\/zh\/tickets/);

    // Click the language switcher button (aria-label="切换语言")
    const langButton = page.getByRole('button', { name: '切换语言' });
    await langButton.click();

    // Wait for dropdown to appear
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();

    // Select English option
    const englishOption = page.getByRole('option', { name: 'English' });
    await englishOption.click();

    // Verify URL changed to /en/
    await expect(page).toHaveURL(/\/en\/tickets/);

    // Verify the html lang attribute changed (read via DOM API, no CSS selector)
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('en');

    // Verify page text changed to English — "Dashboard" nav link should be visible
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  });

  test('should switch to Japanese and update URL', async ({ page }) => {
    // Click the language switcher button
    const langButton = page.getByRole('button', { name: '切换语言' });
    await langButton.click();

    // Wait for dropdown
    await expect(page.getByRole('listbox')).toBeVisible();

    // Select Japanese option
    const japaneseOption = page.getByRole('option', { name: '日本語' });
    await japaneseOption.click();

    // Verify URL changed to /ja/
    await expect(page).toHaveURL(/\/ja\/tickets/);

    // Verify the html lang attribute changed (read via DOM API, no CSS selector)
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('ja');
  });
});
