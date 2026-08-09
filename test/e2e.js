const { app, BrowserWindow } = require('electron')
const path = require('path')
const { init } = require('../electron/db')
const { registerAll } = require('../electron/ipc')

app.whenReady().then(async () => {
  init()
  registerAll()
  const win = new BrowserWindow({ width: 1200, height: 800, show: false, webPreferences: { preload: path.join(__dirname, '..', 'electron', 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: false } })
  const errors = []
  win.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    if (level >= 2) errors.push(`[console-error] ${message}`)
  })
  win.webContents.on('render-process-gone', (_e, d) => errors.push(`[crash] ${d.reason}`))
  win.webContents.on('did-fail-load', (_e, code, desc) => errors.push(`[loadfail] ${code} ${desc}`))

  const wait = (ms) => new Promise((r) => setTimeout(r, ms))

  await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  await wait(1500)
  errors.push(`[step1-home] rootChildren=${await win.webContents.executeJavaScript("document.getElementById('root').children.length")} bodyText=${(await win.webContents.executeJavaScript("document.body.innerText")).slice(0, 80)}`)

  // 步骤2：通过底层 API 创建项目
  await win.webContents.executeJavaScript(`window.api.createNovel({ name: 'e2e测试', genre: '科幻', description: 'x' })`)
  await wait(500)

  // 步骤3：重新加载，Home 会列出项目
  win.reload()
  await wait(2500)
  errors.push(`[step3-reload] rootChildren=${await win.webContents.executeJavaScript("document.getElementById('root').children.length")}`)

  // 步骤4：点击第一个项目卡片，进入 Workspace
  const clicked = await win.webContents.executeJavaScript(`(() => {
    const card = document.querySelector('.card')
    if (!card) { document.querySelectorAll('button').forEach(b => { if (b.textContent.includes('新建小说')) b.click() }); return 'NO_CARD_BUT_OPENED_MODAL' }
    card.click(); return 'CLICKED_CARD'
  })()`)
  errors.push(`[step4-click] ${clicked}`)
  await wait(2500)

  // 步骤5：检查 Workspace 是否渲染成功
  const ws = await win.webContents.executeJavaScript(`(async () => {
    const root = document.getElementById('root')
    const children = root.children.length
    const text = document.body.innerText.slice(0, 150)
    const buttons = [...document.querySelectorAll('button')].map(b => b.textContent.trim()).filter(Boolean).slice(0, 20)
    const navItems = [...document.querySelectorAll('.nav-item')].map(n => n.textContent.trim())
    return { children, text, buttons, navItems }
  })()`)
  errors.push(`[step5-workspace] ${JSON.stringify(ws)}`)

  // 步骤6：关闭新手引导 modal（如果存在），再检查
  await win.webContents.executeJavaScript(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('开始创作') || x.textContent.includes('跳过')); if (b) { b.click(); return 'CLOSED_ONBOARD' } return 'NO_ONBOARD' })()`)
  await wait(1200)
  errors.push(`[step6-after-onboard] rootChildren=${await win.webContents.executeJavaScript("document.getElementById('root').children.length")}`)

  console.log('======= E2E 结果 =======')
  for (const e of errors) console.log(e)
  console.log('======= 渲染错误 =======')
  const realErrors = errors.filter((e) => e.startsWith('[console-error]') || e.startsWith('[crash]') || e.startsWith('[loadfail]'))
  console.log(realErrors.length ? realErrors.join('\n') : '无')
  app.exit(0)
})
