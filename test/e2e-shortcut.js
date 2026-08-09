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
  win.webContents.on('render-process-gone', (_e, d) => errors.push(`[crash] ${d.reason}`))
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const js = (code) => win.webContents.executeJavaScript(code)
  let passed = 0, failed = 0
  const check = (c, m) => { if (c) { passed++; console.log('  PASS:', m) } else { failed++; console.log('  FAIL:', m) } }

  const novel = services.createNovel({ name: '快捷键测试' })
  services.createChapter(novel.id, { title: '第一章', content: '测试内容' })

  await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  await wait(1200)
  await js(`(() => { const c = document.querySelector('.card'); c.click(); return true })()`)
  await wait(1400)
  await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('开始创作') || x.textContent.includes('跳过')); if (b) b.click(); return true })()`)
  await wait(600)

  // 1. 快捷键设置弹窗可打开
  const openModal = await js(`(async () => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '快捷键')
    b.click()
    await new Promise(r => setTimeout(r, 500))
    return document.body.innerText.includes('保存当前章节') && document.body.innerText.includes('切到统计')
  })()`)
  check(openModal, '快捷键设置弹窗显示动作清单')

  // 2. 录制：把「保存当前章节」改为 ctrl+shift+y
  await js(`(async () => {
    const rows = [...document.querySelectorAll('.modal-body .row.panel')]
    const row = rows.find(r => r.textContent.includes('保存当前章节'))
    const btn = [...row.querySelectorAll('button')].find(b => b.textContent.includes('改'))
    btn.click()
    await new Promise(r => setTimeout(r, 300))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Y', ctrlKey: true, shiftKey: true, bubbles: true }))
    await new Promise(r => setTimeout(r, 400))
    const saved = await window.api.getShortcuts()
    return saved.save_chapter
  })()`)
  const savedMap = await js(`window.api.getShortcuts()`)
  check(savedMap.save_chapter === 'ctrl+shift+y', `改键保存成功：${savedMap.save_chapter}`)

  // 3. 触发新快捷键 → 应触发保存动作（弹出 toast「已保存并生成版本快照」）
  await js(`(() => { const b = [...document.querySelectorAll('.modal-head button')].find(x => x.textContent.trim() === '关闭'); if (b) b.click(); return true })()`)
  await wait(300)
  const savedTrigger = await js(`(async () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Y', ctrlKey: true, shiftKey: true, bubbles: true }))
    await new Promise(r => setTimeout(r, 900))
    return [...document.querySelectorAll('.toast')].some(x => x.textContent.includes('已保存'))
  })()`)
  check(savedTrigger, '自定义快捷键触发保存')

  // 4. 恢复默认
  await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '快捷键'); b.click() })()`)
  await wait(400)
  const resetOk = await js(`(async () => {
    const b = [...document.querySelectorAll('.modal-head button')].find(x => x.textContent.includes('恢复默认'))
    b.click()
    await new Promise(r => setTimeout(r, 500))
    return (await window.api.getShortcuts()).save_chapter === 'ctrl+s'
  })()`)
  check(resetOk, '恢复默认快捷键')
  await js(`(() => { const b = [...document.querySelectorAll('.modal-head button')].find(x => x.textContent.trim() === '关闭'); if (b) b.click(); return true })()`)

  // 5. 默认 Ctrl+S 触发保存
  const defaultTrigger = await js(`(async () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }))
    await new Promise(r => setTimeout(r, 900))
    return [...document.querySelectorAll('.toast')].some(x => x.textContent.includes('已保存'))
  })()`)
  check(defaultTrigger, '默认 Ctrl+S 触发保存')

  console.log(`\n========== 快捷键 E2E：${passed} 通过，${failed} 失败 ==========`)
  const real = errors.filter((e) => !e.includes('Autofill'))
  console.log('渲染错误：' + (real.length ? real.join('\n') : '无'))
  app.exit(failed > 0 || real.length ? 1 : 0)
})
