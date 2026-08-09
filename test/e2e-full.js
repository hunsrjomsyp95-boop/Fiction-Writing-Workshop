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

  require('../electron/services').createNovel({ name: 'E2E 全量测试', genre: '玄幻' })
  await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  await wait(1500)
  await js(`(() => { const c = document.querySelector('.card'); if (c) c.click(); return true })()`)
  await wait(1500)
  await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('开始创作') || x.textContent.includes('跳过')); if (b) b.click(); return true })()`)
  await wait(800)

  const navText = await js(`[...document.querySelectorAll('.nav-item')].map(n => n.title)`)
  check(navText.length === 9, `导航 9 个模块：${navText.length}`)
  check(navText.some((t) => t === '章节') && navText.some((t) => t === '统计'), '导航含章节/统计')

  const tabs = ['章节', '大纲', '人物', '世界观', '伏笔', '年表', '资料库', '统计']
  for (const t of tabs) {
    const ok = await js(`(() => {
      const n = [...document.querySelectorAll('.nav-item')].find(x => x.title === '${t}')
      if (!n) return 'NO_NAV'
      n.click()
      return 'OK'
    })()`)
    await wait(700)
    const state = await js(`({ children: document.getElementById('root').children.length })`)
    check(ok === 'OK' && state.children >= 1, `切到「${t}」渲染正常`)
  }

  await js(`(() => { const n = [...document.querySelectorAll('.nav-item')].find(x => x.title === '世界观'); n.click() })()`)
  await wait(500)
  const worldTabs = await js(`[...document.querySelectorAll('.tab')].map(x => x.textContent.trim())`)
  check(worldTabs.length >= 3, `世界观子标签 ${worldTabs.join('/')}`)
  for (const wt of ['物品 / 道具 / 地点', 'AI 分析分类']) {
    const ok = await js(`(() => { const b = [...document.querySelectorAll('.tab')].find(x => x.textContent.includes('${wt}')); if (!b) return 'NO'; b.click(); return 'OK' })()`)
    await wait(600)
    const st = await js(`document.getElementById('root').children.length`)
    check(ok === 'OK' && st >= 1, `切到子标签「${wt}」`)
  }

  const novels = await require('../electron/services').listNovels()
  const novelId = novels[0].id
  await require('../electron/services').createChapter(novelId, { title: '第一章', content: '测试正文内容，林澈走入客栈。' })
  await js(`(() => { const n = [...document.querySelectorAll('.nav-item')].find(x => x.title === '章节'); n.click() })()`)
  await wait(800)
  const editorState = await js(`({ hasEditor: !!document.querySelector('.editor-wrap'), hasCm: !!document.querySelector('.cm-editor') })`)
  check(editorState.hasEditor && editorState.hasCm, '章节编辑器渲染（CodeMirror）')

  for (const pt of ['校对', '版本对比']) {
    const ok = await js(`(() => { const b = [...document.querySelectorAll('.tab')].find(x => x.textContent.trim() === '${pt}'); if (!b) return 'NO'; b.click(); return 'OK' })()`)
    await wait(500)
    const st = await js(`document.getElementById('root').children.length`)
    check(ok === 'OK' && st >= 1, `右侧面板「${pt}」`)
  }

  const readOk = await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('阅读模式')); if (!b) return 'NO'; b.click(); return 'OK' })()`)
  await wait(500)
  const readState = await js(`!!document.querySelector('.reading-wrap')`)
  check(readOk === 'OK' && readState, '阅读模式渲染')
  await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('退出阅读')); if (b) b.click(); return true })()`)
  await wait(400)

  for (const [btn, keyword] of [['搜索', '全文搜索'], ['数据', '数据管理'], ['设置', '设置']]) {
    const ok = await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '${btn}'); if (!b) return 'NO'; b.click(); return 'OK' })()`)
    await wait(500)
    const hasModal = await js(`document.body.innerText.includes('${keyword}')`)
    check(ok === 'OK' && hasModal, `顶栏弹窗「${btn}」`)
    await js(`(() => { const b = [...document.querySelectorAll('.modal-head button, .modal-foot button')].find(x => x.textContent.trim() === '关闭' || x.textContent.trim() === '取消'); if (b) b.click(); return true })()`)
    await wait(400)
  }

  const searchResult = await js(`(async () => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '搜索'); b.click()
    await new Promise(r => setTimeout(r, 300))
    const input = document.querySelector('.modal input')
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    setter.call(input, '林澈')
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await new Promise(r => setTimeout(r, 200))
    const run = [...document.querySelectorAll('.modal button')].find(x => x.textContent.trim() === '搜索'); run.click()
    await new Promise(r => setTimeout(r, 700))
    return document.body.innerText.includes('共')
  })()`)
  check(searchResult === true, '全文搜索执行有结果')
  await js(`(() => { const b = [...document.querySelectorAll('.modal-head button')].find(x => x.textContent.trim() === '关闭'); if (b) b.click(); return true })()`)
  await wait(300)

  await js(`(() => { const n = [...document.querySelectorAll('.nav-item')].find(x => x.title === '统计'); n.click() })()`)
  await wait(800)
  const statsText = await js(`document.body.innerText.slice(0, 120)`)
  check(statsText.includes('写作统计') || statsText.includes('字数'), '统计页渲染')

  console.log(`\n========== E2E 完成：${passed} 通过，${failed} 失败 ==========`)
  console.log('======= 渲染错误 =======')
  const realErrors = errors.filter((e) => !e.includes('Autofill.enable') && !e.includes('Autofill.setAddresses'))
  console.log(realErrors.length ? realErrors.join('\n') : '无')
  if (failed > 0 || realErrors.length > 0) app.exitCode = 1
  app.exit(0)
})
