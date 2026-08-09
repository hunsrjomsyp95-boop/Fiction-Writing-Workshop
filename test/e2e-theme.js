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

  services.createNovel({ name: '主题测试' })
  await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  await wait(1200)
  await js(`(() => { const c = document.querySelector('.card'); c.click(); return true })()`)
  await wait(1400)
  await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('开始创作') || x.textContent.includes('跳过')); if (b) b.click(); return true })()`)
  await wait(600)

  const getVar = (v) => js(`getComputedStyle(document.documentElement).getPropertyValue('${v}').trim()`)

  // 1. 默认主题变量生效
  const bgDefault = await getVar('--bg')
  check(bgDefault === '#1e1e2e', `默认主题背景（${bgDefault}）`)

  // 2. 打开主题弹窗，切到护眼模式
  const openOk = await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '主题'); if (!b) return 'NO'; b.click(); return 'OK' })()`)
  await wait(500)
  check(openOk === 'OK' && (await js(`document.body.innerText.includes('护眼模式')`)), '主题弹窗显示主题色卡')
  await js(`(() => { const cards = [...document.querySelectorAll('.modal .panel')]; const c = cards.find(x => x.textContent.includes('护眼模式')); if (c) c.click(); return true })()`)
  await wait(500)
  const bgEye = await getVar('--bg')
  check(bgEye === '#f7f4ea', `切换到护眼模式（${bgEye}）`)

  // 3. 文字颜色：荧光绿
  await js(`(() => { const b = [...document.querySelectorAll('.modal button')].find(x => x.textContent.includes('荧光绿')); b.click(); return true })()`)
  await wait(400)
  const textNeon = await getVar('--text')
  check(textNeon === '#00ff66', `荧光绿文字（${textNeon}）`)

  // 4. 字号调节
  const setSize = await js(`(() => { const r = document.querySelector('.modal input[type=range]'); if (!r) return false; Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(r, '18'); r.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
  await wait(400)
  const fontSize = await getVar('--font-size')
  check(setSize && fontSize === '18px', `字号调为 18px（${fontSize}）`)

  // 5. 导入自定义主题
  const imp = await js(`(async () => {
    const ta = [...document.querySelectorAll('.modal textarea')].find(x => x.placeholder.includes('主题 JSON'))
    Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(ta, '{"name":"测试红","colors":{"bg":"#110000","text":"#ffaaaa","accent":"#ff4444"}}')
    ta.dispatchEvent(new Event('input', { bubbles: true }))
    await new Promise(r => setTimeout(r, 150))
    const btn = [...document.querySelectorAll('.modal button')].find(x => x.textContent.includes('导入并应用')); btn.click()
    await new Promise(r => setTimeout(r, 600))
    return getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()
  })()`)
  check(imp === '#110000', `导入主题并应用（${imp}）`)

  // 6. 持久化
  const savedTheme = await js(`window.api.getSetting('theme_id','')`)
  const savedColor = await js(`window.api.getSetting('text_color','')`)
  const savedSize = await js(`window.api.getSetting('font_size','')`)
  check(savedTheme.startsWith('custom-'), '主题持久化')
  check(savedColor === 'neon', '文字色持久化')
  check(savedSize === '18', '字号持久化')

  console.log(`\n========== 主题 E2E：${passed} 通过，${failed} 失败 ==========`)
  const real = errors.filter((e) => !e.includes('Autofill'))
  console.log('渲染错误：' + (real.length ? real.join('\n') : '无'))
  app.exit(failed > 0 || real.length ? 1 : 0)
})
