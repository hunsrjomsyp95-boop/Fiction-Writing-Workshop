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

  const novel = services.createNovel({ name: '弹窗测试' })
  services.createChapter(novel.id, { title: '第一章', content: '测试正文内容。' })

  await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  await wait(1200)
  await js(`(() => { const c = document.querySelector('.card'); c.click(); return true })()`)
  await wait(1400)
  await js(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('开始创作') || x.textContent.includes('跳过')); if (b) b.click(); return true })()`)
  await wait(600)

  const modalShown = await js(`(async () => {
    const btn = [...document.querySelectorAll('button')].find(x => x.textContent.includes('新章节'))
    btn.click()
    await new Promise(r => setTimeout(r, 500))
    return !!document.querySelector('.modal input')
  })()`)
  check(modalShown, '新建章节弹出输入框')

  const created = await js(`(async () => {
    const input = document.querySelector('.modal input')
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, '第二章测试')
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await new Promise(r => setTimeout(r, 150))
    const ok = [...document.querySelectorAll('.modal-foot button')].find(x => x.textContent.trim() === '确定')
    ok.click()
    await new Promise(r => setTimeout(r, 800))
    const list = await window.api.listChapters(${novel.id})
    return { count: list.length, hasChapter: list.some(c => c.title === '第二章测试'), editor: !!document.querySelector('.cm-editor') }
  })()`)
  check(created.count === 2 && created.hasChapter, '章节创建成功')
  check(created.editor, '章节内容进入编辑器')

  await js(`(() => { const n = [...document.querySelectorAll('.nav-item')].find(x => x.title === '人物'); n.click() })()`)
  await wait(700)
  const charCreated = await js(`(async () => {
    const btn = [...document.querySelectorAll('button')].find(x => x.textContent.includes('新建人物'))
    btn.click()
    await new Promise(r => setTimeout(r, 400))
    const input = document.querySelector('.modal input')
    if (!input) return 'NO_MODAL'
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, '林澈')
    input.dispatchEvent(new Event('input', { bubbles: true }))
    await new Promise(r => setTimeout(r, 150))
    const ok = [...document.querySelectorAll('.modal-foot button')].find(x => x.textContent.trim() === '确定')
    ok.click()
    await new Promise(r => setTimeout(r, 700))
    return (await window.api.listCharacters(${novel.id})).map(c => c.name).join(',')
  })()`)
  check(charCreated === '林澈', '新建人物成功')

  const confirmShown = await js(`(async () => {
    const del = [...document.querySelectorAll('button')].find(x => x.textContent.includes('删除'))
    del.click()
    await new Promise(r => setTimeout(r, 400))
    const hasText = document.body.innerText.includes('确定删除该人物')
    const cancel = [...document.querySelectorAll('.modal-foot button')].find(x => x.textContent.trim() === '取消')
    cancel.click()
    return hasText
  })()`)
  check(confirmShown, '删除弹出确认框且可取消')

  console.log(`\n========== 弹窗 E2E：${passed} 通过，${failed} 失败 ==========`)
  const real = errors.filter((e) => !e.includes('Autofill'))
  console.log('渲染错误：' + (real.length ? real.join('\n') : '无'))
  app.exit(failed > 0 || real.length ? 1 : 0)
})
