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

  const novel = services.createNovel({ name: '思考导航测试' })
  services.createChapter(novel.id, { title: '第一章', content: '林澈走入客栈。' })
  services.createCharacter(novel.id, { name: '林澈', role: '主角' })
  services.createWorld(novel.id, { name: '东大陆', category: '地理', content: '多山' })

  await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  await wait(1200)
  await js(`(() => { const c = document.querySelector('.card'); c.click(); return true })()`)
  await wait(1400)
  await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('开始创作') || x.textContent.includes('跳过')); if (b) b.click(); return true })()`)
  await wait(600)

  const navOk = await js(`(() => { const n = [...document.querySelectorAll('.nav-item')].find(x => x.title === 'AI 思考'); if (!n) return 'NO'; n.click(); return 'OK' })()`)
  await wait(800)
  check(navOk === 'OK', '导航含「AI 思考」')

  const page = await js(`({
    chapters: [...document.querySelectorAll('.tree-item')].map(x => x.textContent.trim()),
    thinkBtns: [...document.querySelectorAll('button')].filter(b => ['给出建议','后续剧情','人物设计','起名','文笔仿写'].some(k => b.textContent.includes(k))).length,
    attach: document.body.innerText.includes('附加项目设定'),
    current: document.body.innerText.includes('分析《第一章》')
  })`)
  check(page.chapters.length === 1 && page.chapters[0].includes('第一章'), '章节选择列表')
  check(page.thinkBtns === 5, `思考按钮 5 个（实际 ${page.thinkBtns}）`)
  check(page.attach && page.current, '附加设定选项与当前章节标识')

  const namingOk = await js(`(async () => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('起名'))
    b.click()
    await new Promise(r => setTimeout(r, 500))
    const hasInput = !!document.querySelector('.modal input')
    const cancel = [...document.querySelectorAll('.modal-foot button')].find(x => x.textContent.trim() === '取消'); cancel.click()
    return hasInput
  })()`)
  check(namingOk, '起名弹窗正常')

  const adviceOk = await js(`(async () => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('给出建议'))
    b.click()
    await new Promise(r => setTimeout(r, 1300))
    return document.getElementById('root').children.length >= 1
  })()`)
  check(adviceOk, '无 key 时报错不崩溃')

  await js(`(() => { const n = [...document.querySelectorAll('.nav-item')].find(x => x.title === '章节'); n.click(); return true })()`)
  await wait(400)
  const shortcutOk = await js(`(async () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '9', ctrlKey: true, bubbles: true }))
    await new Promise(r => setTimeout(r, 500))
    return document.body.innerText.includes('AI 思考') && document.body.innerText.includes('分析《第一章》')
  })()`)
  check(shortcutOk, 'Ctrl+9 切换到 AI 思考')

  console.log(`\n========== AI 思考导航 E2E：${passed} 通过，${failed} 失败 ==========`)
  const real = errors.filter((e) => !e.includes('Autofill'))
  console.log('渲染错误：' + (real.length ? real.join('\n') : '无'))
  app.exit(failed > 0 || real.length ? 1 : 0)
})
