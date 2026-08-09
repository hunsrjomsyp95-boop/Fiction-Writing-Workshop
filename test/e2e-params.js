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

  services.createNovel({ name: '参数表单测试' })
  await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  await wait(1200)
  await js(`(() => { const c = document.querySelector('.card'); c.click(); return true })()`)
  await wait(1400)
  await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('开始创作') || x.textContent.includes('跳过')); if (b) b.click(); return true })()`)
  await wait(600)

  // 打开提示词库
  await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('提示词库')); b.click(); return true })()`)
  await wait(500)

  // 1. 内置提示词分类齐全（含去AI味/扩写）
  const libOk = await js(`document.body.innerText.includes('去AI味') && document.body.innerText.includes('扩写') && document.body.innerText.includes('极速起稿')`)
  check(libOk, '提示词库含参数化内置（去AI味/扩写/极速起稿）')

  // 2. 运行「润色」→ 弹出参数表单（select 风格）
  const formOk = await js(`(async () => {
    const rows = [...document.querySelectorAll('.modal-body .row.panel')]
    const row = rows.find(r => r.textContent.includes('润色') && !r.textContent.includes('去AI味'))
    if (!row) return 'NO_ROW'
    const btn = [...row.querySelectorAll('button')].find(x => x.textContent.includes('运行')); btn.click()
    await new Promise(r => setTimeout(r, 500))
    const hasSelect = !!document.querySelector('.modal select')
    const hasStyle = document.body.innerText.includes('风格倾向')
    const cancel = [...document.querySelectorAll('.modal-foot button')].find(x => x.textContent.trim() === '取消'); cancel.click()
    return hasSelect && hasStyle
  })()`)
  check(formOk === true, '「润色」弹出参数表单（风格 select）')

  // 3. 运行「扩写」→ 含多选按钮 + 数字框
  const formOk2 = await js(`(async () => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '提示词库'); b.click()
    await new Promise(r => setTimeout(r, 400))
    const rows = [...document.querySelectorAll('.modal-body .row.panel')]
    const row = rows.find(r => r.textContent.includes('扩写'))
    const btn = [...row.querySelectorAll('button')].find(x => x.textContent.includes('运行')); btn.click()
    await new Promise(r => setTimeout(r, 500))
    const hasMulti = [...document.querySelectorAll('.modal button')].some(x => ['心理描写','环境氛围','对话铺陈'].includes(x.textContent.trim()))
    const hasNum = [...document.querySelectorAll('.modal input')].some(x => x.type === 'number')
    const cancel = [...document.querySelectorAll('.modal-foot button')].find(x => x.textContent.trim() === '取消'); cancel.click()
    return hasMulti && hasNum
  })()`)
  check(formOk2 === true, '「扩写」参数表单含多选+数字')

  // 4. 新建自定义提示词含参数编辑器（先清理 modal 状态）
  await js(`(() => { [...document.querySelectorAll('.modal-head button')].forEach(b => { if (b.textContent.includes('关闭')) b.click() }); return true })()`)
  await wait(300)
  await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('提示词库')); if (b) b.click(); return true })()`)
  await wait(500)
  const editOk = await js(`(async () => {
    const add = [...document.querySelectorAll('button')].find(x => x.textContent.includes('自定义'))
    if (!add) return 'NO_ADD_BTN'
    add.click()
    await new Promise(r => setTimeout(r, 500))
    return document.body.innerText.includes('参数定义')
  })()`)
  check(editOk === true, '新建提示词含参数编辑器')

  console.log(`\n========== 参数表单 E2E：${passed} 通过，${failed} 失败 ==========`)
  const real = errors.filter((e) => !e.includes('Autofill'))
  console.log('渲染错误：' + (real.length ? real.join('\n') : '无'))
  app.exit(failed > 0 || real.length ? 1 : 0)
})
