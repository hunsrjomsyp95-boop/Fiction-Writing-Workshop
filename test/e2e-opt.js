const { app, BrowserWindow } = require('electron')
const path = require('path')
const { init } = require('../electron/db')
const { registerAll } = require('../electron/ipc')
const services = require('../electron/services')

app.whenReady().then(async () => {
  init()
  registerAll()
  const win = new BrowserWindow({ width: 1300, height: 850, show: false, webPreferences: { preload: path.join(__dirname, '..', 'electron', 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false } })
  const errors = []
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 2) errors.push(`[console] ${message}`) })
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const js = (code) => win.webContents.executeJavaScript(code)
  let passed = 0, failed = 0
  const check = (c, m) => { if (c) { passed++; console.log('  PASS:', m) } else { failed++; console.log('  FAIL:', m) } }

  const novel = services.createNovel({ name: '优化测试' })
  services.createChapter(novel.id, { title: '第一章', content: '林澈走入客栈。' })
  await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  await wait(1200)
  await js(`(() => { const c = document.querySelector('.card'); c.click(); return true })()`)
  await wait(1400)
  await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('开始创作') || x.textContent.includes('跳过')); if (b) b.click(); return true })()`)
  await wait(600)

  const expanded = await js(`(() => {
    const btns = [...document.querySelectorAll('button')].map(b => b.textContent.trim())
    return btns.includes('快照') && btns.includes('阅读模式') && btns.includes('查找')
  })()`)
  check(expanded, '工具条默认展开（含快照/阅读/查找）')

  const collapsed = await js(`(async () => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('收起'))
    if (!b) return 'NO_BTN'
    b.click()
    await new Promise(r => setTimeout(r, 500))
    const btns = [...document.querySelectorAll('button')].map(x => x.textContent.trim())
    const hidden = !btns.includes('快照') && !btns.includes('阅读模式')
    const saved = await window.api.getSetting('toolbar_open', '1')
    return hidden && saved === '0'
  })()`)
  check(collapsed === true, '折叠后隐藏次要按钮且持久化')

  const reexpand = await js(`(async () => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('展开'))
    if (!b) return 'NO'
    b.click()
    await new Promise(r => setTimeout(r, 400))
    return [...document.querySelectorAll('button')].some(x => x.textContent.trim() === '快照')
  })()`)
  check(reexpand === true, '可重新展开')

  await js(`(() => { const n = [...document.querySelectorAll('.nav-item')].find(x => x.title === 'AI 思考'); n.click() })()`)
  await wait(700)
  const translateBtn = await js(`[...document.querySelectorAll('button')].some(x => x.textContent.includes('翻译'))`)
  check(translateBtn, 'AI 思考页含翻译按钮')

  await js(`(() => { const n = [...document.querySelectorAll('.nav-item')].find(x => x.title === '章节'); n.click() })()`)
  await wait(600)
  const translateBtn2 = await js(`[...document.querySelectorAll('button')].some(x => x.textContent.includes('翻译'))`)
  check(translateBtn2, '章节页 AI 面板含翻译按钮')

  const translateDialog = await js(`(async () => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('翻译'))
    b.click()
    await new Promise(r => setTimeout(r, 500))
    const has = document.body.innerText.includes('目标语言')
    const cancel = [...document.querySelectorAll('.modal-foot button')].find(x => x.textContent.trim() === '取消'); cancel.click()
    return has
  })()`)
  check(translateDialog, '翻译弹出目标语言输入框')

  console.log(`\n========== 优化 E2E：${passed} 通过，${failed} 失败 ==========`)
  const real = errors.filter((e) => !e.includes('Autofill'))
  console.log('渲染错误：' + (real.length ? real.join('\n') : '无'))
  app.exit(failed > 0 || real.length ? 1 : 0)
})
