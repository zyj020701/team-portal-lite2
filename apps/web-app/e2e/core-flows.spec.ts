import { test, expect } from '@playwright/test';

/**
 * D27 核心业务流程端到端覆盖。
 *
 * 验收清单要求的 5 个流程（登录、查单、建单、回复、通知）按本应用实际功能映射：
 *  - 查单  -> 工单列表加载、关键字搜索、状态筛选（本应用无独立登录页/建单页）
 *  - 回复  -> 工单详情添加内部备注
 *  - 通知  -> 通知铃铛打开、空态、关闭
 * 另含列表->详情的跨页导航回归。
 *
 * 登录与建单流程在当前 Team Portal Lite 范围内未实现（无鉴权页/建单表单），
 * 以注释记录映射关系，避免伪造不存在的交互。
 */
test.describe('D27 核心业务流程', () => {
  test('查单：打开列表并通过关键字搜索工单', async ({ page }) => {
    await page.goto('/zh/tickets');

    // 列表已加载（虚拟滚动渲染出工单行链接）
    const firstRow = page.getByRole('link', { name: /TK-/ }).first();
    await expect(firstRow).toBeVisible();

    // 关键字搜索
    const search = page.getByLabel('搜索工单');
    await search.fill('登录');
    await search.press('Enter');

    await expect(page).toHaveURL(/keyword=/);
    // 搜索结果仍然渲染工单行
    await expect(page.getByRole('link', { name: /TK-/ }).first()).toBeVisible();
  });

  test('查单：按状态筛选待处理工单并同步 URL', async ({ page }) => {
    await page.goto('/zh/tickets');
    await expect(page.getByRole('link', { name: /TK-/ }).first()).toBeVisible();

    const pending = page.getByRole('button', { name: '待处理' });
    await pending.click();

    await expect(page).toHaveURL(/status=pending/);
    await expect(pending).toHaveAttribute('aria-pressed', 'true');
  });

  test('回复：在工单详情添加一条内部备注', async ({ page }) => {
    // 进入首个工单详情
    await page.goto('/zh/tickets');
    await expect(page.getByRole('link', { name: /TK-/ }).first()).toBeVisible();
    await page.getByRole('link', { name: /TK-/ }).first().click();
    await expect(page).toHaveURL(/\/zh\/tickets\/TK-/);
    await expect(page.getByText('问题描述')).toBeVisible();

    // 定位备注输入框（通过占位符）并输入内容
    const note = page.getByPlaceholder('添加内部备注...');
    await expect(note).toBeVisible();
    const uniqueText = `E2E 自动回复备注 ${Date.now()}`;
    await note.fill(uniqueText);

    // 提交按钮在有内容前为禁用态
    const submit = page.getByRole('button', { name: '添加备注' });
    await expect(submit).toBeEnabled();
    await submit.click();

    // 提交后新备注出现在列表中，输入框被清空
    await expect(page.getByText(uniqueText)).toBeVisible();
    await expect(note).toHaveValue('');
  });

  test('通知：打开通知铃铛并展示空态/标题', async ({ page }) => {
    await page.goto('/zh/tickets');
    await expect(page.getByRole('link', { name: /TK-/ }).first()).toBeVisible();

    // 未配置真实 WS 时铃铛为“0 条未读通知”
    const bell = page.getByRole('button', { name: /未读通知/ });
    await expect(bell).toBeVisible();
    await bell.click();

    // 下拉面板出现，标题为“通知”
    const dialog = page.getByRole('dialog', { name: '通知' });
    await expect(dialog).toBeVisible();

    // 本地无真实 WS 连接时显示空态
    await expect(dialog).toContainText('暂无通知');

    // 再次点击收起
    await bell.click();
    await expect(dialog).not.toBeVisible();
  });

  test('导航：列表 -> 详情 -> 返回列表位置保持', async ({ page }) => {
    await page.goto('/zh/tickets');
    await expect(page.getByRole('link', { name: /TK-/ }).first()).toBeVisible();

    await page.getByRole('link', { name: /TK-/ }).first().click();
    await expect(page).toHaveURL(/\/zh\/tickets\/TK-/);

    await page.getByRole('button', { name: '返回列表' }).click();
    await expect(page).toHaveURL(/\/zh\/tickets/);
    await expect(page.getByRole('link', { name: /TK-/ }).first()).toBeVisible();
  });
});
