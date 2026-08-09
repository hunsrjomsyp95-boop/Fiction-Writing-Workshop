const { app, BrowserWindow } = require('electron')
const path = require('path')
const { init } = require('../electron/db')
const { registerAll } = require('../electron/ipc')
const services = require('../electron/services')

app.whenReady().then(async () => {
  init()
  registerAll()
  const win = new BrowserWindow({ width: 1200, height: 800, show: false, webPreferences: { preload: path.join(__dirname, '..', 'electron', 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false } })
  const errors = []
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 2) errors.push(`[console] ${message}`) })
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  const js = (code) => win.webContents.executeJavaScript(code)
  let passed = 0, failed = 0
  const check = (c, m) => { if (c) { passed++; console.log('  PASS:', m) } else { failed++; console.log('  FAIL:', m) } }

  // 1. 未启用登录 → 直接进入，无登录界面
  await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  await wait(1400)
  const noLogin = await js(`document.body.innerText.includes('解锁进入')`)
  check(noLogin === false, '未启用登录时不显示登录界面')
  const hasCreate = await js(`document.body.innerText.includes('新建小说')`)
  check(hasCreate, '未启用登录时正常显示首页')

  // 2. 注册账号启用登录
  services.registerUser('tester', 'pass123')
  win.reload()
  await wait(1800)
  const showLogin = await js(`document.body.innerText.includes('解锁进入')`)
  check(showLogin, '启用登录后显示登录界面')
  check(!(await js(`document.body.innerText.includes('新建小说')`)), '登录界面不显示首页')

  // 3. 通过 DOM 登录
  const loginRes = await js(`(async () => {
    const set = (el, v) => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })) }
    const inputs = [...document.querySelectorAll('input')]
    set(inputs[0], 'tester')
    set(inputs[1], 'pass123')
    await new Promise(r => setTimeout(r, 200))
    const btn = [...document.querySelectorAll('button')].find(x => x.textContent.includes('解锁进入'))
    btn.click()
    await new Promise(r => setTimeout(r, 800))
    return { create: document.body.innerText.includes('新建小说'), login: document.body.innerText.includes('解锁进入') }
  })()`)
  check(loginRes.create && !loginRes.login, '正确密码登录后进入首页')

  // 4. 错误密码应被拒
  win.reload()
  await wait(1500)
  const badLogin = await js(`(async () => {
    const set = (el, v) => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })) }
    const inputs = [...document.querySelectorAll('input')]
    set(inputs[0], 'tester')
    set(inputs[1], 'wrongpw')
    await new Promise(r => setTimeout(r, 200))
    const btn = [...document.querySelectorAll('button')].find(x => x.textContent.includes('解锁进入'))
    btn.click()
    await new Promise(r => setTimeout(r, 700))
    const toastShown = [...document.querySelectorAll('.toast')].some(x => x.textContent.includes('用户名或密码错误'))
    const stillLogin = document.body.innerText.includes('解锁进入')
    return toastShown && stillLogin
  })()`)
  check(badLogin, '错误密码被拒并提示')

  console.log(`\n========== 登录 E2E：${passed} 通过，${failed} 失败 ==========`)
  const real = errors.filter((e) => !e.includes('Autofill'))
  console.log('渲染错误：' + (real.length ? real.join('\n') : '无'))
  app.exit(failed > 0 || real.length ? 1 : 0)
})
