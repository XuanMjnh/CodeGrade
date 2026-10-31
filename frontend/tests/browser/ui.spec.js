import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
const envFile = process.env.CG_ENV_FILE || '../.env';
const config = existsSync(envFile)
  ? Object.fromEntries(
      readFileSync(envFile, 'utf8')
        .split(/\r?\n/)
        .filter((line) => line.includes('=') && !line.startsWith('#'))
        .map((line) => {
          const index = line.indexOf('=');
          return [line.slice(0, index), line.slice(index + 1)];
        }),
    )
  : {};

async function login(page, coder = false) {
  await page.goto('/');
  await page
    .locator('#auth-username')
    .fill(typeof coder === 'string' ? coder : coder ? 'coder01' : 'admin');
  const password = coder
    ? process.env.CG_DEMO_PASSWORD || config.DEMO_PASSWORD
    : process.env.CG_ADMIN_PASSWORD || config.ADMIN_PASSWORD;
  if (!password)
    throw new Error(
      'Set CG_ADMIN_PASSWORD / CG_DEMO_PASSWORD or provide the local .env test configuration.',
    );
  await page.locator('#auth-password').fill(password);
  await page.locator('button[type=submit]').click();
  await expect(page.locator('#main-content h1')).toHaveText('Thư viện bài tập');
  await expect(page.locator('#main-content .loading')).toHaveCount(0);
}
async function route(page, name, heading) {
  await page.evaluate((value) => {
    location.hash = '/' + value;
  }, name);
  await expect(page.locator('#main-content h1').first()).toHaveText(heading);
  await expect(page.locator('#main-content .loading')).toHaveCount(0);
}
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test('all administrative and learning pages render without runtime errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await login(page);
  for (const [path, heading] of [
    ['survival', 'CODE SURVIVAL.'],
    ['contests', 'Đấu trường thuật toán'],
    ['leaderboard', 'Những người dẫn đầu'],
    ['submissions', 'Lịch sử bài nộp'],
    ['profile', 'Thông tin cá nhân'],
    ['announcements', 'Thông báo'],
    ['categories', 'Quản lý danh mục'],
    ['admin', 'Quản trị hệ thống'],
  ]) {
    await route(page, path, heading);
    await noOverflow(page);
    await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
    await page.setViewportSize({ width: 390, height: 844 });
    await noOverflow(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  expect(errors).toEqual([]);
});

test('the shared header and side rails surround the Survival game hub', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await login(page);
  const left = page.locator('.utility-rail.left');
  const right = page.locator('.utility-rail.right');
  await expect(left).toBeVisible();
  await expect(right).toBeVisible();
  const [leftBox, mainBox, rightBox, headerBox] = await Promise.all([
    left.boundingBox(),
    page.locator('#main-content').boundingBox(),
    right.boundingBox(),
    page.locator('header.header').boundingBox(),
  ]);
  expect(leftBox.x + leftBox.width).toBeLessThan(mainBox.x);
  expect(mainBox.x + mainBox.width).toBeLessThan(rightBox.x);
  expect(headerBox.y + headerBox.height).toBeLessThan(mainBox.y);
  expect(
    await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe('rgb(245, 246, 247)');
  expect(
    await page
      .locator('.brand-icon')
      .evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe('rgb(198, 83, 22)');
  await route(page, 'survival', 'CODE SURVIVAL.');
  await expect(page.locator('.utility-rail')).toHaveCount(0);
  await expect(page.locator('.mode-card')).toHaveCount(3);
  await expect(page.locator('.mode-practice')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('tab', { name: 'Bậc Rank' }).click();
  await expect(page.locator('.progression-rank-guide')).toHaveAttribute('open', '');
  await noOverflow(page);
});

test('Question Studio keeps configured fields when switching its five steps', async ({ page }) => {
  await login(page);
  await route(page, 'edit', 'Tạo câu hỏi mới');
  await expect(page.getByRole('tab')).toHaveCount(5);
  await page.getByRole('textbox', { name: 'Tên câu hỏi', exact: true }).fill('Browser draft');
  await page.getByRole('tab').nth(2).click();
  await expect(page.locator('#studio-panel-2')).toBeVisible();
  await expect(page.locator('#studio-panel-2 .cm-editor')).toBeVisible();
  await page.getByRole('tab').nth(0).click();
  await expect(page.getByRole('textbox', { name: 'Tên câu hỏi', exact: true })).toHaveValue(
    'Browser draft',
  );
  await page.getByRole('tab').nth(0).press('ArrowRight');
  await expect(page.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true');
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
});

test('mobile navigation and account menu preserve keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await noOverflow(page);
  await page.getByRole('button', { name: 'Mở điều hướng', exact: true }).click();
  await page
    .locator('#mobile-navigation')
    .getByRole('link', { name: 'Code Survival', exact: true })
    .click();
  await expect(page.locator('#mobile-navigation')).toBeHidden();
  await expect(page.locator('#main-content h1')).toHaveText('CODE SURVIVAL.');
  const account = page.getByRole('button', { name: 'Mở menu tài khoản', exact: true });
  await account.click();
  await expect(page.getByRole('menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(account).toBeFocused();
  const toggle = page.getByRole('button', { name: 'Mở điều hướng', exact: true });
  await toggle.click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-navigation')).toBeHidden();
  await expect(toggle).toBeFocused();
  await noOverflow(page);
});

test('the code workspace keeps the source after a real submission', async ({ page }) => {
  await login(page, true);
  await page.getByRole('textbox', { name: 'Tìm bài', exact: true }).fill('Tổng hai số');
  await page.getByRole('link', { name: 'Tổng hai số', exact: true }).first().click();
  await expect(page.locator('.cm-content')).toBeVisible();
  const source = 'a,b=map(int,input().split()); print(a+b)';
  await page.locator('.cm-content').fill(source);
  await page.getByRole('button', { name: 'Nộp bài →', exact: true }).click();
  await expect(page.locator('[data-sonner-toast]').first()).toContainText('Server đã nhận bài');
  await expect(page.locator('.cm-content')).toContainText(source);
  await noOverflow(page);
});

async function command(page, type, payload) {
  return page.evaluate(
    async ({ type, payload }) => {
      const socket = new WebSocket(
        `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`,
      );
      await new Promise((resolve, reject) => {
        socket.onopen = resolve;
        socket.onerror = reject;
      });
      const request = (command, data) =>
        new Promise((resolve, reject) => {
          const requestId = crypto.randomUUID();
          const timeout = setTimeout(() => reject(Error('Cleanup command timeout')), 10000);
          socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.requestId !== requestId) return;
            clearTimeout(timeout);
            message.ok ? resolve(message.data) : reject(Error(message.error?.message));
          };
          socket.send(JSON.stringify({ v: 1, type: command, requestId, payload: data }));
        });
      try {
        await request('AUTH', { token: sessionStorage.getItem('cg-token') });
        return await request(type, payload);
      } finally {
        socket.close();
      }
    },
    { type, payload },
  );
}

test('a live two-player room restores its local round draft after reload', async ({
  page,
  browser,
}) => {
  const second = await browser.newContext({
    baseURL: process.env.CG_UI_URL || 'http://127.0.0.1:5173',
  });
  const other = await second.newPage();
  let room;
  try {
    await login(page, true);
    await login(other, 'coder02');
    await route(page, 'survival', 'CODE SURVIVAL.');
    await page
      .getByRole('textbox', { name: 'Tên phòng', exact: true })
      .fill('UI round verification');
    await page.getByRole('button', { name: 'Tạo phòng', exact: true }).click();
    await expect(page).toHaveURL(/#\/room\//);
    room = page.url().split('#/room/')[1];
    await other.evaluate((id) => {
      location.hash = '/room/' + id;
    }, room);
    await expect(page.locator('.players .player')).toHaveCount(2);
    await page.getByRole('button', { name: 'Bắt đầu trận →', exact: true }).click();
    await expect(page.locator('.cm-content')).toBeVisible({ timeout: 25000 });
    const draft = '// preserved live round draft';
    await page.locator('.cm-content').fill(draft);
    await page.waitForTimeout(300);
    await page.reload();
    await expect(page.locator('.cm-content')).toContainText(draft);
    await page.setViewportSize({ width: 390, height: 844 });
    await noOverflow(page);
  } finally {
    if (room) {
      await command(page, 'ROOM_LEAVE', { roomId: room }).catch(() => {});
      await command(other, 'ROOM_LEAVE', { roomId: room }).catch(() => {});
    }
    await second.close();
  }
});
