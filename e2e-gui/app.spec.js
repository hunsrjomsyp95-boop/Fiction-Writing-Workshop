import { test, expect, _electron as electron } from '@playwright/test'
import path from 'path'

let electronApp
let window

test.beforeAll(async () => {
  electronApp = await electron.launch({
    args: [path.join(__dirname, '..', 'electron', 'main.js')],
    env: { ...process.env, VITE_DEV_SERVER_URL: '' },
  })
  window = await electronApp.firstWindow()
  await window.waitForLoadState('domcontentloaded')
})

test.afterAll(async () => {
  if (electronApp) await electronApp.close()
})

// 关闭可能存在的弹窗
async function closeModal() {
  const modal = window.locator('.modal')
  if (await modal.isVisible()) {
    await window.locator('.modal .modal-head button').first().click()
    await window.waitForTimeout(300)
  }
}

test('启动后显示首页', async () => {
  const title = await window.title()
  expect(title).toContain('小说创作工坊')
  const body = await window.textContent('body')
  expect(body).toContain('小说创作工坊')
})

test('点击新建小说按钮弹出对话框', async () => {
  await window.locator('button:has-text("新建小说")').click()
  await expect(window.locator('.modal')).toBeVisible()
  await expect(window.locator('.modal-head')).toContainText('新建小说项目')
})

test('输入小说名称后可以创建项目', async () => {
  await window.locator('input[placeholder*="星海"]').fill('测试小说')
  await window.locator('.modal button.primary:has-text("创建")').click()
  await window.waitForSelector('.topbar .title')
  await expect(window.locator('.topbar .title')).toContainText('测试小说')
})

test('工作区侧栏显示所有功能模块', async () => {
  const toggleBtn = window.locator('.nav-rail-collapsed button')
  if (await toggleBtn.isVisible()) {
    await toggleBtn.click()
  }
  const labels = await window.locator('.sidebar .nav-item .nav-label').allTextContents()
  const expected = ['章节', 'AI', '大纲', '人物', '世界观', '伏笔', '年表', '资料', '统计']
  for (const label of expected) {
    expect(labels).toContain(label)
  }
})

test('点击设置按钮打开设置页面', async () => {
  await closeModal()
  await window.locator('button[title="设置"]').click()
  await expect(window.locator('.modal')).toBeVisible()
  // 使用 modal-head 内的关闭按钮
  await window.locator('.modal-head button:has-text("关闭")').click()
  await window.waitForTimeout(300)
})

test('点击帮助按钮打开帮助页面', async () => {
  await closeModal()
  await window.locator('button[title="帮助"]').click()
  await expect(window.locator('.modal')).toBeVisible()
  await expect(window.locator('.modal-head')).toContainText('帮助')
  await window.locator('.modal-head button:has-text("关闭")').click()
  await window.waitForTimeout(300)
})

test('返回首页按钮正常工作', async () => {
  await closeModal()
  await window.locator('button[title="返回首页"]').click()
  await window.waitForTimeout(500)
  const body = await window.textContent('body')
  expect(body).toContain('小说创作工坊')
  expect(body).toContain('测试小说')
})
