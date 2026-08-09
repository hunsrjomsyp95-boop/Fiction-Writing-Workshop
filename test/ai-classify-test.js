const { app } = require('electron')
app.whenReady().then(async () => {
  const os = require('os')
  const path = require('path')
  const fs = require('fs')
  process.env.APPDATA = path.join(os.tmpdir(), 'novel-studio-cls-test')
  fs.rmSync(process.env.APPDATA, { recursive: true, force: true })
  const services = require('../electron/services')
  const ai = require('../electron/ai')
  let passed = 0, failed = 0
  const check = (c, m) => { if (c) { passed++; console.log('  PASS:', m) } else { failed++; console.log('  FAIL:', m) } }

  services.setSetting('ai_api_key', 'test')
  services.setSetting('ai_base_url', 'https://api.test/v1')
  global.fetch = async (url, opts) => {
    const body = JSON.parse(opts.body)
    const user = body.messages[body.messages.length - 1].content
    let content = '其他'
    if (user.includes('山脉')) content = '地理'
    else if (user.includes('门派')) content = '势力组织'
    else if (user.includes('丹方')) content = '丹药'
    else if (user.includes('宿敌')) content = '反派'
    return { ok: true, text: async () => '', json: async () => ({ choices: [{ message: { content } }], usage: null }) }
  }

  const novel = services.createNovel({ name: '分类测试' })
  const w1 = services.createWorld(novel.id, { name: '昆仑山脉', category: '其他', content: '高耸的山脉，终年积雪。' })
  const w2 = services.createWorld(novel.id, { name: '天门派', category: '其他', content: '武林门派，门规森严。' })
  const it1 = services.createItem(novel.id, { name: '九转还魂丹', category: '其他', description: '上古丹方炼制的疗伤丹药' })

  // 通用分类接口
  const t1 = await ai.aiClassifyTo('昆仑山脉，高耸入云', ['地理', '历史', '势力组织'])
  check(t1 === '地理', `世界观分类接口（mock 返回 ${t1}）`)

  // 校验只返回集合内类别
  const t2 = await ai.aiClassifyTo('一些无关内容', ['地理', '历史'])
  check(['地理', '历史'].includes(t2), `分类结果限定在集合内（${t2}）`)

  // 世界观填写分类
  const w1c = await ai.aiClassifyTo(`${w1.name}\n${w1.content}`, ['地理', '历史', '势力组织', '魔法/修炼体系', '政治制度', '文化习俗', '科技/物品', '神祇信仰', '种族', '其他'])
  services.updateWorld(w1.id, { category: w1c })
  check(services.listWorlds(novel.id).find((x) => x.id === w1.id).category === '地理', '世界观 AI 分类已填写')

  // 物品填写分类
  const it1c = await ai.aiClassifyTo(`${it1.name}\n${it1.description}`, ['物品', '道具', '关键地点', '武器', '防具', '丹药', '功法秘籍', '状态', '其他'])
  services.updateItem(it1.id, { category: it1c })
  check(services.listItems(novel.id).find((x) => x.id === it1.id).category === '丹药', '物品 AI 分类已填写')

  console.log(`\n========== AI 分类测试：${passed} 通过，${failed} 失败 ==========`)
  app.exit(failed > 0 ? 1 : 0)
})
