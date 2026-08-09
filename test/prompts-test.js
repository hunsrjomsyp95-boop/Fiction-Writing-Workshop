const { app } = require('electron')
app.whenReady().then(async () => {
  const os = require('os')
  const path = require('path')
  const fs = require('fs')
  process.env.APPDATA = path.join(os.tmpdir(), 'novel-studio-prompts-test')
  fs.rmSync(process.env.APPDATA, { recursive: true, force: true })
  const services = require('../electron/services')
  let passed = 0, failed = 0
  const check = (c, m) => { if (c) { passed++; console.log('  PASS:', m) } else { failed++; console.log('  FAIL:', m) } }

  const novel = services.createNovel({ name: '提示词测试' })
  const prompts = services.listPrompts(novel.id)
  check(prompts.length >= 14, `内置提示词数量=${prompts.length}`)

  // 内置提示词带 params
  const 润色 = prompts.find((p) => p.name === '润色')
  const 扩写 = prompts.find((p) => p.name === '扩写')
  const 单章 = prompts.find((p) => p.name === '单章正文')
  const 极速 = prompts.find((p) => p.name === '极速起稿')
  check(Array.isArray(润色.params) && 润色.params.some((x) => x.key === 'style' && x.type === 'select'), '润色带风格 select 参数')
  check(Array.isArray(扩写.params) && 扩写.params.some((x) => x.key === 'addType' && x.type === 'multiSelect') && 扩写.params.some((x) => x.key === 'expandRatio' && x.type === 'number'), '扩写带多选+倍数参数')
  check(Array.isArray(单章.params) && 单章.params.some((x) => x.key === 'chapterLength'), '单章正文带字数参数')
  check(Array.isArray(极速.params) && 极速.params.length === 3, '极速起稿 3 个参数')

  // 模板含参数变量
  check(润色.user_prompt.includes('{style}'), '润色模板引用 {style}')
  check(单章.user_prompt.includes('{chapterLength}') && 单章.user_prompt.includes('{tone}'), '单章模板引用参数')

  // 自定义提示词保存/读取 params
  const custom = services.createPrompt(novel.id, { name: '自定义', category: '通用', system_prompt: 'sys', user_prompt: '请写 {n} 章', params: [{ key: 'n', label: '数量', type: 'number', default: 3 }] })
  const read = services.listPrompts(novel.id).find((p) => p.id === custom.id)
  check(Array.isArray(read.params) && read.params[0].key === 'n' && read.params[0].type === 'number', '自定义提示词 params 存取')
  services.updatePrompt(custom.id, { params: [{ key: 'x', type: 'text', label: 'X' }] })
  check(services.listPrompts(novel.id).find((p) => p.id === custom.id).params[0].key === 'x', '自定义 params 更新')
  services.deletePrompt(custom.id)
  check(!services.listPrompts(novel.id).find((p) => p.id === custom.id), '自定义删除')

  console.log(`\n========== 提示词库测试：${passed} 通过，${failed} 失败 ==========`)
  app.exit(failed > 0 ? 1 : 0)
})
