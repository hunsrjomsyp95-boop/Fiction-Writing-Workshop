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

  services.createNovel({ name: '设置测试' })
  await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  await wait(1200)

  // 1. 首页底部版本与作者信息
  const homeInfo = await js(`document.body.innerText.includes('v0.2') && document.body.innerText.includes('哔哩哔哩耄耋教你写小说') && document.body.innerText.includes('软件免费')`)
  check(homeInfo, '首页底部版本/作者/免费声明')

  // 2. 进入工作区打开「设置」（主题/AI/关于）
  await js(`(() => { const c = document.querySelector('.card'); c.click(); return true })()`)
  await wait(1400)
  await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('开始创作') || x.textContent.includes('跳过')); if (b) b.click(); return true })()`)
  await wait(600)
  const openOk = await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '设置'); if (!b) return 'NO'; b.click(); return 'OK' })()`)
  await wait(500)
  const hasTabs = await js(`document.body.innerText.includes('主题') && document.body.innerText.includes('AI 设置') && document.body.innerText.includes('关于') && document.body.innerText.includes('护眼模式') && document.body.innerText.includes('输入光标颜色')`)
  check(openOk === 'OK' && hasTabs, '设置弹窗含主题/AI/关于标签页与光标颜色')

  // 3. 光标颜色切换 → 荧光绿（光标按钮含 "|" 前缀，区别于文字色 "A"）
  const cursorOk = await js(`(async () => {
    const b = [...document.querySelectorAll('.modal button')].find(x => x.textContent.includes('荧光绿') && x.textContent.includes('|'))
    if (!b) return false
    b.click()
    await new Promise(r => setTimeout(r, 400))
    const v = getComputedStyle(document.documentElement).getPropertyValue('--cursor-color').trim()
    return v === '#00ff66'
  })()`)
  check(cursorOk, '光标颜色切换为荧光绿')

  // 3. 切到「AI 设置」标签
  const aiOk = await js(`(async () => {
    const b = [...document.querySelectorAll('.modal .tab')].find(x => x.textContent.trim() === 'AI 设置')
    if (!b) return false
    b.click()
    await new Promise(r => setTimeout(r, 300))
    return document.body.innerText.includes('API 地址') && document.body.innerText.includes('测试连接')
  })()`)
  check(aiOk, 'AI 设置标签页含配置与测试连接')

  // 4. 切到「关于」标签
  const aboutOk = await js(`(async () => {
    const b = [...document.querySelectorAll('.modal .tab')].find(x => x.textContent.trim() === '关于')
    if (!b) return false
    b.click()
    await new Promise(r => setTimeout(r, 300))
    return document.body.innerText.includes('版本：0.2') && document.body.innerText.includes('哔哩哔哩耄耋教你写小说') && document.body.innerText.includes('软件免费') && document.body.innerText.includes('如果是购买的那就是被骗了')
  })()`)
  check(aboutOk, '关于标签页含版本/作者/免费声明')

  console.log(`\n========== 设置 E2E：${passed} 通过，${failed} 失败 ==========`)
  const real = errors.filter((e) => !e.includes('Autofill'))
  console.log('渲染错误：' + (real.length ? real.join('\n') : '无'))
  app.exit(failed > 0 || real.length ? 1 : 0)
})
