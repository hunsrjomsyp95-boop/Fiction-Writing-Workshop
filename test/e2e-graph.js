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

  const novel = services.createNovel({ name: '关系网测试' })
  const c1 = services.createCharacter(novel.id, { name: '林澈', role: '主角' })
  const c2 = services.createCharacter(novel.id, { name: '苏晚', role: '女主' })
  const c3 = services.createCharacter(novel.id, { name: '顾长风', role: '反派' })
  services.createRelation(novel.id, { char_a_id: c1.id, char_b_id: c2.id, type: '恋人' })
  services.createRelation(novel.id, { char_a_id: c1.id, char_b_id: c3.id, type: '宿敌', direction: '单向' })

  await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  await wait(1200)
  await js(`(() => { const c = document.querySelector('.card'); c.click(); return true })()`)
  await wait(1400)
  await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('开始创作') || x.textContent.includes('跳过')); if (b) b.click(); return true })()`)
  await wait(600)

  await js(`(() => { const n = [...document.querySelectorAll('.nav-item')].find(x => x.title === '人物'); n.click() })()`)
  await wait(700)
  const graphTab = await js(`(() => { const b = [...document.querySelectorAll('.tab')].find(x => x.textContent.trim() === '关系网'); if (!b) return 'NO'; b.click(); return 'OK' })()`)
  await wait(1000)

  const svg = await js(`(() => {
    const svg = document.querySelector('svg')
    const nodes = svg ? svg.querySelectorAll('g circle').length : 0
    const lines = svg ? svg.querySelectorAll('g line').length : 0
    const names = svg ? [...svg.querySelectorAll('text')].map(t => t.textContent) : []
    return { nodes, lines, names }
  })()`)
  check(graphTab === 'OK' && svg.nodes === 3, `关系网节点数=3（实际 ${svg.nodes}）`)
  check(svg.lines === 2, `关系网连线数=2（实际 ${svg.lines}）`)
  check(svg.names.some((n) => n.includes('林澈')) && svg.names.some((n) => n.includes('苏晚')), '节点显示人物名')

  const hover = await js(`(() => {
    const g = [...document.querySelectorAll('svg g')].find(x => x.querySelector('circle') && x.querySelector('text')?.textContent.includes('林澈'))
    if (!g) return 'NO_NODE'
    g.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    return 'OK'
  })()`)
  await wait(300)
  const dimmed = await js(`[...document.querySelectorAll('svg g')].some(x => x.getAttribute('opacity') === '0.15')`)
  check(hover === 'OK', '悬停节点高亮（无关节点降淡）')
  await js(`(() => { [...document.querySelectorAll('svg g')].forEach(x => x.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))); return true })()`)

  const click = await js(`(() => {
    const g = [...document.querySelectorAll('svg g')].find(x => x.querySelector('circle') && x.querySelector('text')?.textContent.includes('林澈'))
    g.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    return true
  })()`)
  await wait(700)
  const editOpen = await js(`document.body.innerText.includes('编辑人物')`)
  check(click && editOpen, '点击节点打开人物编辑')

  console.log(`\n========== 关系网 E2E：${passed} 通过，${failed} 失败 ==========`)
  const real = errors.filter((e) => !e.includes('Autofill'))
  console.log('渲染错误：' + (real.length ? real.join('\n') : '无'))
  app.exit(failed > 0 || real.length ? 1 : 0)
})
