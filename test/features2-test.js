const { app } = require('electron')
app.whenReady().then(async () => {
  const os = require('os')
  const path = require('path')
  const fs = require('fs')
  process.env.APPDATA = path.join(os.tmpdir(), 'novel-studio-f2-test')
  fs.rmSync(process.env.APPDATA, { recursive: true, force: true })
  const services = require('../electron/services')
  const ai = require('../electron/ai')
  let passed = 0, failed = 0
  const check = (c, m) => { if (c) { passed++; console.log('  PASS:', m) } else { failed++; console.log('  FAIL:', m) } }

  // ===== I. 目标字数 =====
  const novel = services.createNovel({ name: '功能2测试', target_words: 100000 })
  check(services.getNovel(novel.id).target_words === 100000, 'I.目标字数保存')
  services.updateNovel(novel.id, { target_words: 50000 })
  check(services.getNovel(novel.id).target_words === 50000, 'I.目标字数更新')

  // ===== G. 章节多块 =====
  const ch = services.createChapter(novel.id, { title: '第一章', content: '正文' })
  services.updateChapter(ch.id, { status: '进行中', summary: '开场', scene: '客栈·夜晚', notes: '埋下罗盘伏笔' })
  const chRead = services.getChapter(ch.id)
  check(chRead.summary === '开场' && chRead.scene === '客栈·夜晚' && chRead.notes === '埋下罗盘伏笔', 'G.章节多块字段')

  // ===== F. 多世界 =====
  services.createWorld(novel.id, { name: '东大陆', category: '地理', world_name: '主世界' })
  services.createWorld(novel.id, { name: '仙界', category: '地理', world_name: '仙界' })
  check(services.listWorlds(novel.id, '仙界').length === 1, 'F.多世界按世界查询')
  check(services.listWorldNames(novel.id).includes('仙界'), 'F.世界列表')
  services.updateWorld(services.listWorlds(novel.id, '主世界')[0].id, { world_name: '主世界' })

  // ===== B. 创作规则 =====
  services.createWorldRule(novel.id, { era: '明清', item: '使用铜钱，无银票', type: '史实' })
  services.createWorldRule(novel.id, { era: '明清', item: '存在轻功轻功可短暂腾空', type: '架空', verified: 1 })
  check(services.listWorldRules(novel.id, '明清').length === 2, 'B.创作规则按时代查询')
  check(services.listRuleEras(novel.id).includes('明清'), 'B.规则时代列表')
  const r1 = services.listWorldRules(novel.id, '明清')[0]
  services.updateWorldRule(r1.id, { verified: 1 })
  check(services.listWorldRules(novel.id, '明清').find((x) => x.id === r1.id).verified === 1, 'B.规则核实状态')

  // ===== H. 高级统计 =====
  services.createCharacter(novel.id, { name: '林澈', role: '主角' })
  services.createCharacter(novel.id, { name: '苏晚', role: '女主' })
  const c1 = services.listCharacters(novel.id)[0]
  const c2 = services.listCharacters(novel.id)[1]
  services.createRelation(novel.id, { char_a_id: c1.id, char_b_id: c2.id, type: '恋人', direction: '双向' })
  services.createForeshadowing(novel.id, { title: '罗盘', status: '已埋' })
  const stats = services.getStats(novel.id)
  check(stats.charactersByRole.some((r) => r.role === '主角' && r.c === 1), 'H.角色定位统计')
  check(stats.relationsByDirection.some((r) => r.direction === '双向' && r.c === 1), 'H.关系方向统计')
  check(stats.foreshadowByStatus.some((r) => r.status === '已埋'), 'H.伏笔状态统计')
  check(stats.worldNames.some((r) => r.world_name === '仙界'), 'H.世界分布统计')

  // ===== AI 新函数（mock）=====
  services.setSetting('ai_api_key', 'test')
  global.fetch = async (url, opts) => {
    const body = JSON.parse(opts.body)
    const sys = (body.messages.find((m) => m.role === 'system') || {}).content || ''
    let content = '{}'
    if (sys.includes('设定词条')) {
      content = '{"items":[{"title":"东大陆","category":"地理","content":"主要大陆，多山"}]}'
    } else if (sys.includes('世界地图设计师')) {
      content = '<svg width="800" height="500"><rect width="100%" height="100%" fill="#0f172a"/><circle cx="400" cy="250" r="60" fill="#f59e0b"/><text x="400" y="260">东大陆</text></svg>'
    }
    return { ok: true, text: async () => '', json: async () => ({ choices: [{ message: { content } }], usage: null }) }
  }
  const terms = await ai.aiExtractTerms('东大陆多山，气候温和。')
  check(Array.isArray(terms) && terms.length === 1 && terms[0].title === '东大陆', 'C.词条拆分解析')
  const mapSvg = await ai.aiGenerateMap('东大陆')
  check(mapSvg.startsWith('<svg') && mapSvg.includes('东大陆'), 'D.AI世界地图 SVG')

  console.log(`\n========== 功能2测试：${passed} 通过，${failed} 失败 ==========`)
  app.exit(failed > 0 ? 1 : 0)
})
