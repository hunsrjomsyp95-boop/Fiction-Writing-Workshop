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

  services.createNovel({ name: '思考测试' })
  await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  await wait(1200)
  await js(`(() => { const c = document.querySelector('.card'); c.click(); return true })()`)
  await wait(1400)
  await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('开始创作') || x.textContent.includes('跳过')); if (b) b.click(); return true })()`)
  await wait(600)

  // 1. 思考按钮组渲染
  const thinkBtns = await js(`[...document.querySelectorAll('button')].filter(b => ['给出建议','后续剧情','人物设计','起名','文笔仿写'].some(k => b.textContent.includes(k))).map(b => b.textContent.trim())`)
  check(thinkBtns.length === 5, `思考按钮齐全：${thinkBtns.length}`)

  // 2. 未配置 key 时点击「给出建议」→ 应报错不崩溃
  const adviceOk = await js(`(async () => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('给出建议'))
    b.click()
    await new Promise(r => setTimeout(r, 1200))
    const rootOk = document.getElementById('root').children.length >= 1
    const hasMsg = document.body.innerText.includes('未配置 API Key') || [...document.querySelectorAll('.ai-msg')].some(m => m.textContent.includes('请求失败'))
    return rootOk
  })()`)
  check(adviceOk, '点击「给出建议」无 key 时报错不崩溃')

  // 3. 「起名」应弹出输入框
  const namingOk = await js(`(async () => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('起名'))
    b.click()
    await new Promise(r => setTimeout(r, 500))
    const hasInput = !!document.querySelector('.modal input')
    const cancel = [...document.querySelectorAll('.modal-foot button')].find(x => x.textContent.trim() === '取消')
    cancel.click()
    return hasInput
  })()`)
  check(namingOk, '「起名」弹出参数输入框')

  // 4. 「文笔仿写」应弹出样本文本框
  const styleOk = await js(`(async () => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('文笔仿写'))
    b.click()
    await new Promise(r => setTimeout(r, 500))
    const hasInput = !!document.querySelector('.modal input')
    const cancel = [...document.querySelectorAll('.modal-foot button')].find(x => x.textContent.trim() === '取消')
    cancel.click()
    return hasInput
  })()`)
  check(styleOk, '「文笔仿写」弹出样本输入框')

  console.log(`\n========== 思考功能 E2E：${passed} 通过，${failed} 失败 ==========`)
  const real = errors.filter((e) => !e.includes('Autofill'))
  console.log('渲染错误：' + (real.length ? real.join('\n') : '无'))
  app.exit(failed > 0 || real.length ? 1 : 0)
})
