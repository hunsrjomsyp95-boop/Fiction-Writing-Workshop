import { test, expect, _electron as electron } from '@playwright/test'
import path from 'path'

let electronApp
let page

test.beforeAll(async () => {
  electronApp = await electron.launch({
    args: [path.join(__dirname, '..', 'electron', 'main.js')],
    env: { ...process.env, VITE_DEV_SERVER_URL: '' },
  })
  page = await electronApp.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(4000)
})

test.afterAll(async () => {
  if (electronApp) await electronApp.close()
})

async function getEditorText() {
  return page.evaluate(() => document.querySelector('.cm-content')?.textContent || '')
}

test('快速切换章节内容不互相污染', async () => {
  // 关闭弹窗
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  // 创建项目
  await page.waitForSelector('button:has-text("新建小说")', { timeout: 10000 })
  await page.locator('button:has-text("新建小说")').click()
  await page.locator('input[placeholder*="星海"]').fill('测试bug')
  await page.locator('.modal button.primary:has-text("创建")').click()
  await page.waitForSelector('.topbar .title', { timeout: 10000 })
  await page.waitForTimeout(3000)

  // 用 IPC 创建3个章节
  await page.evaluate(async () => {
    const novels = await window.api.listNovels()
    const nid = novels[0].id
    await window.api.createChapter(nid, { title: '第1章' })
    await window.api.createChapter(nid, { title: '第2章' })
    await window.api.createChapter(nid, { title: '第3章' })
  })
  await page.waitForTimeout(1000)

  // 回到首页再重新进入，触发章节加载
  await page.waitForTimeout(3000) // 等 toast 消失
  await page.evaluate(() => document.querySelector('button[title="返回首页"]')?.click())
  await page.waitForTimeout(2000)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  await page.evaluate(() => document.querySelector('.card')?.click())
  await page.waitForSelector('.topbar .title', { timeout: 10000 })
  await page.waitForTimeout(2000)

  // 等章节列表
  await page.waitForSelector('.tree-item', { timeout: 10000 })
  const count = await page.locator('.tree-item').count()
  console.log(`[TEST] 章节数: ${count}`)

  const chapters = page.locator('.tree-item')

  // 强制关闭所有弹窗遮罩
  await page.evaluate(() => {
    document.querySelectorAll('.modal-mask').forEach(el => el.remove())
    document.querySelectorAll('.toast-container').forEach(el => el.remove())
  })
  await page.waitForTimeout(500)

  // 第1章输入 A
  await chapters.nth(0).click()
  await page.waitForTimeout(800)
  await page.locator('.cm-content').click()
  await page.keyboard.type('AAAAAAAAAA', { delay: 20 })
  await page.waitForTimeout(2000)

  // 第2章输入 B
  await chapters.nth(1).click()
  await page.waitForTimeout(800)
  await page.locator('.cm-content').click()
  await page.keyboard.type('BBBBBBBBBB', { delay: 20 })
  await page.waitForTimeout(2000)

  // 第3章输入 C
  await chapters.nth(2).click()
  await page.waitForTimeout(800)
  await page.locator('.cm-content').click()
  await page.keyboard.type('CCCCCCCCCC', { delay: 20 })
  await page.waitForTimeout(2000)

  // 快速来回切换
  console.log('[TEST] 快速切换...')
  for (let r = 0; r < 10; r++) {
    for (let i = 0; i < count; i++) {
      await chapters.nth(i).click()
      await page.waitForTimeout(20)
    }
  }
  await page.waitForTimeout(2000)

  // 验证
  await chapters.nth(0).click()
  await page.waitForTimeout(800)
  const ch1 = await getEditorText()
  console.log(`[TEST] 章节1: "${ch1}"`)
  expect(ch1).toContain('AAAAAAAAAA')

  await chapters.nth(1).click()
  await page.waitForTimeout(800)
  const ch2 = await getEditorText()
  console.log(`[TEST] 章节2: "${ch2}"`)
  expect(ch2).toContain('BBBBBBBBBB')

  await chapters.nth(2).click()
  await page.waitForTimeout(800)
  const ch3 = await getEditorText()
  console.log(`[TEST] 章节3: "${ch3}"`)
  expect(ch3).toContain('CCCCCCCCCC')
})
