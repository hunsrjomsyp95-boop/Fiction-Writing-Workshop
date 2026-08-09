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

async function closeModal() {
  const modal = window.locator('.modal-mask')
  if (await modal.isVisible()) {
    await window.locator('.modal .modal-head button').first().click()
    await window.waitForTimeout(300)
  }
}

async function clickNavTab(label) {
  await closeModal()
  await window.locator(`.nav-item:has(.nav-label:has-text("${label}"))`).first().click()
  await window.waitForTimeout(1000)
}

// ==================== 首页 ====================

test('首页显示', async () => {
  const body = await window.textContent('body')
  expect(body).toContain('小说创作工坊')
})

test('创建项目', async () => {
  await window.locator('button:has-text("新建小说")').click()
  await window.locator('input[placeholder*="星海"]').fill('测试项目')
  await window.locator('.modal button.primary:has-text("创建")').click()
  await window.waitForSelector('.topbar .title')
  await expect(window.locator('.topbar .title')).toContainText('测试项目')
})

// ==================== 工作区 ====================

test('工作区加载', async () => {
  await expect(window.locator('.topbar')).toBeVisible()
  await expect(window.locator('main[role="main"]')).toBeVisible()
})

test('侧栏展开', async () => {
  await expect(window.locator('.sidebar').first()).toBeVisible()
})

test('编辑器加载', async () => {
  await window.waitForTimeout(2000)
  await expect(window.locator('.editor-wrap')).toBeVisible()
})

test('保存按钮', async () => {
  await expect(window.locator('button.primary:has-text("保存")').first()).toBeVisible()
})

// ==================== 侧栏切换 ====================

test('切换到大纲', async () => {
  await clickNavTab('大纲')
  await expect(window.locator('.topbar .title')).toContainText('测试项目')
})

test('切换到人物', async () => {
  await clickNavTab('人物')
  await expect(window.locator('.topbar .title')).toContainText('测试项目')
})

test('切换到世界观', async () => {
  await clickNavTab('世界观')
  await expect(window.locator('.topbar .title')).toContainText('测试项目')
})

test('切换到伏笔', async () => {
  await clickNavTab('伏笔')
  await expect(window.locator('.topbar .title')).toContainText('测试项目')
})

test('切换到年表', async () => {
  await clickNavTab('年表')
  await expect(window.locator('.topbar .title')).toContainText('测试项目')
})

test('切换到资料', async () => {
  await clickNavTab('资料')
  await expect(window.locator('.topbar .title')).toContainText('测试项目')
})

test('切换到统计', async () => {
  await clickNavTab('统计')
  await expect(window.locator('.topbar .title')).toContainText('测试项目')
})

test('切回章节', async () => {
  await clickNavTab('章节')
  await expect(window.locator('.topbar .title')).toContainText('测试项目')
})

// ==================== 弹窗 ====================

test('设置弹窗', async () => {
  await closeModal()
  await window.locator('button[title="设置"]').click()
  await window.waitForTimeout(500)
  await expect(window.locator('.modal-mask')).toBeVisible()
  await window.locator('.modal .modal-head button').first().click()
  await window.waitForTimeout(300)
})

test('帮助弹窗', async () => {
  await closeModal()
  await window.locator('button[title="帮助"]').click()
  await window.waitForTimeout(500)
  await expect(window.locator('.modal-mask')).toBeVisible()
  await window.locator('.modal .modal-head button').first().click()
  await window.waitForTimeout(300)
})

// ==================== 返回 ====================

test('返回首页', async () => {
  await closeModal()
  await window.locator('button[title="返回首页"]').click()
  await window.waitForTimeout(500)
  await expect(window.locator('.card').first()).toBeVisible()
})

test('重新进入', async () => {
  await window.locator('.card').first().click()
  await window.waitForSelector('.topbar .title')
  await expect(window.locator('.topbar .title')).toContainText('测试')
})
