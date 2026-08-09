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

  const novel = services.createNovel({ name: '功能2 UI测试', target_words: 100000 })
  services.createChapter(novel.id, { title: '第一章', content: '林澈走入客栈。' })
  services.createWorld(novel.id, { name: '东大陆', category: '地理', world_name: '主世界' })
  services.createWorld(novel.id, { name: '仙界', category: '地理', world_name: '仙界' })
  services.createWorldRule(novel.id, { era: '明清', item: '使用铜钱', type: '史实' })
  services.createCharacter(novel.id, { name: '林澈', role: '主角' })

  await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  await wait(1200)
  await js(`(() => { const c = document.querySelector('.card'); c.click(); return true })()`)
  await wait(1400)
  await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('开始创作') || x.textContent.includes('跳过')); if (b) b.click(); return true })()`)
  await wait(600)

  const chInfo = await js(`(() => {
    const inputs = [...document.querySelectorAll('input')]
    return inputs.some(x => x.placeholder.includes('章节摘要')) && inputs.some(x => x.placeholder.includes('笔记'))
  })()`)
  check(chInfo, 'G.章节多块信息栏显示')

  await js(`(() => { const n = [...document.querySelectorAll('.nav-item')].find(x => x.title === '世界观'); n.click() })()`)
  await wait(600)
  const tabs = await js(`[...document.querySelectorAll('.tab')].map(x => x.textContent.trim())`)
  check(['世界设定', '物品 / 道具 / 地点', '世界地图', '创作规则', 'AI 分析分类'].every((t) => tabs.includes(t)), '世界观子标签齐全')

  await js(`(() => { const s = [...document.querySelectorAll('select')].find(x => [...x.options].some(o => o.value === '仙界')); if (s) { s.value = '仙界'; s.dispatchEvent(new Event('change', { bubbles: true })) } return true })()`)
  await wait(800)
  const worldView = await js(`document.body.innerText.includes('仙界')`)
  check(worldView, 'F.多世界切换到仙界正常')

  await js(`(() => { const b = [...document.querySelectorAll('.tab')].find(x => x.textContent.includes('创作规则')); b.click() })()`)
  await wait(600)
  const ruleEraOk = await js(`(() => { const s = [...document.querySelectorAll('select')].find(x => [...x.options].some(o => o.value === '明清')); if (!s) return false; s.value = '明清'; s.dispatchEvent(new Event('change', { bubbles: true })); return true })()`)
  await wait(700)
  const ruleOk = await js(`document.body.innerText.includes('使用铜钱') && document.body.innerText.includes('史实锚点')`)
  check(ruleEraOk && ruleOk, 'B.创作规则显示（切到明清）')

  await js(`(() => { const n = [...document.querySelectorAll('.nav-item')].find(x => x.title === '统计'); n.click() })()`)
  await wait(800)
  const targetOk = await js(`document.body.innerText.includes('全书目标字数')`)
  check(targetOk, 'I.统计页目标字数进度显示')

  console.log(`\n========== 功能2 UI E2E：${passed} 通过，${failed} 失败 ==========`)
  const real = errors.filter((e) => !e.includes('Autofill'))
  console.log('渲染错误：' + (real.length ? real.join('\n') : '无'))
  app.exit(failed > 0 || real.length ? 1 : 0)
})
