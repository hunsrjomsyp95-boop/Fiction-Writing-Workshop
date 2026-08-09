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

  const novel = services.createNovel({ name: '交互测试' })
  services.createChapter(novel.id, { title: '第一章', content: '他做为一名船长，迫不急待地走进帐篷。' })
  services.createMaterial(novel.id, { title: '魔法体系', content: '魔法与修炼境界的设定规则', type: '未分类' })
  services.createCharacter(novel.id, { name: '林澈', role: '主角' })
  const d = require('../electron/db').db()
  d.prepare("INSERT INTO word_log (novel_id, day, words) VALUES (?,?,?)").run(novel.id, '2026-08-01', 800)
  d.prepare("INSERT INTO word_log (novel_id, day, words) VALUES (?,?,?)").run(novel.id, '2026-08-02', 1200)

  await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  await wait(1200)
  await js(`(() => { const c = document.querySelector('.card'); c.click(); return true })()`)
  await wait(1500)
  await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('开始创作') || x.textContent.includes('跳过')); if (b) b.click(); return true })()`)
  await wait(600)

  await js(`(() => { const b = [...document.querySelectorAll('.tab')].find(x => x.textContent.trim() === '校对'); if (b) b.click(); return true })()`)
  await wait(400)
  const typoOk = await js(`(async () => {
    const btn = [...document.querySelectorAll('button')].find(x => x.textContent.includes('检查错字错词'))
    btn.click()
    await new Promise(r => setTimeout(r, 800))
    return document.body.innerText.includes('发现')
  })()`)
  check(typoOk, '错字检查执行并发现结果')

  await js(`(() => { const b = [...document.querySelectorAll('.tab')].find(x => x.textContent.trim() === 'AI 助手'); if (b) b.click(); return true })()`)
  await wait(400)
  const promptOk = await js(`(async () => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('提示词库'))
    if (!b) return 'NO_BTN'
    b.click()
    await new Promise(r => setTimeout(r, 500))
    const ok = document.body.innerText.includes('极速起稿') && document.body.innerText.includes('灵感反推')
    const close = [...document.querySelectorAll('.modal-head button')].find(x => x.textContent.trim() === '关闭'); if (close) close.click()
    return ok
  })()`)
  check(promptOk === true, '提示词库显示内置模板')

  await js(`(() => { const n = [...document.querySelectorAll('.nav-item')].find(x => x.title === '资料库'); n.click() })()`)
  await wait(700)
  const classifyOk = await js(`(async () => {
    const buttons = [...document.querySelectorAll('.card button')].filter(b => b.textContent.includes('自动分类'))
    if (buttons.length === 0) return 'NO_BTN'
    buttons[0].click()
    await new Promise(r => setTimeout(r, 800))
    const text = document.body.innerText
    return text.includes('世界观设定') || text.includes('已分类')
  })()`)
  check(classifyOk === true, '资料自动分类（本地模式）执行')

  await js(`(() => { const n = [...document.querySelectorAll('.nav-item')].find(x => x.title === '人物'); n.click() })()`)
  await wait(700)
  const charOk = await js(`(async () => {
    const card = document.querySelector('.card'); card.click()
    await new Promise(r => setTimeout(r, 400))
    return document.body.innerText.includes('人物关系')
  })()`)
  check(charOk, '人物编辑面板含关系区块')

  await js(`(() => { const n = [...document.querySelectorAll('.nav-item')].find(x => x.title === '世界观'); n.click() })()`)
  await wait(500)
  const aiTabOk = await js(`(() => { const b = [...document.querySelectorAll('.tab')].find(x => x.textContent.includes('AI 分析分类')); if (!b) return 'NO'; b.click(); return 'OK' })()`)
  await wait(400)
  const aiRun = await js(`(async () => {
    const btn = [...document.querySelectorAll('button')].find(x => x.textContent.includes('AI 详细分类分析'))
    btn.click()
    await new Promise(r => setTimeout(r, 900))
    return document.getElementById('root').children.length >= 1
  })()`)
  check(aiTabOk === 'OK' && aiRun === true, 'AI 分析按钮无 key 时仅报错不崩溃')

  await js(`(() => { const n = [...document.querySelectorAll('.nav-item')].find(x => x.title === '统计'); n.click() })()`)
  await wait(800)
  const statOk = await js(`document.querySelectorAll('svg').length >= 1`)
  check(statOk, '统计页 SVG 图表渲染')

  console.log(`\n========== 交互测试完成：${passed} 通过，${failed} 失败 ==========`)
  const real = errors.filter((e) => !e.includes('Autofill'))
  console.log('渲染错误：' + (real.length ? real.join('\n') : '无'))
  if (failed > 0 || real.length) app.exitCode = 1
  app.exit(0)
})
