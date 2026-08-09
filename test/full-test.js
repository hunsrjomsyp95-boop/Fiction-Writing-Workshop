const { app } = require('electron')

app.whenReady().then(async () => {
  const os = require('os')
  const path = require('path')
  const fs = require('fs')

  // 使用独立临时数据库，避免污染真实数据
  process.env.APPDATA = path.join(os.tmpdir(), 'novel-studio-fulltest')
  fs.rmSync(process.env.APPDATA, { recursive: true, force: true })

  const services = require('../electron/services')
  const typo = require('../electron/typo')
  const ai = require('../electron/ai')

  let passed = 0
  let failed = 0
  const assert = (cond, msg) => {
    if (cond) { passed++; console.log('  PASS:', msg) }
    else { failed++; console.error('  FAIL:', msg) }
  }
  const section = (s) => console.log(`\n== ${s} ==`)

  // mock AI 网络层
  global.fetch = async (url, opts) => {
    const body = JSON.parse(opts.body)
    const last = body.messages[body.messages.length - 1].content
    const sys = (body.messages.find((m) => m.role === 'system') || {}).content || ''
    let content = '这是一段 AI 的回复内容。'
    if (sys.includes('文字校对专家')) {
      content = '[{"wrong":"做为","right":"作为","reason":"错词"},{"wrong":"迫不急待","right":"迫不及待","reason":"错词"}]'
    } else if (sys.includes('设定分析师')) {
      content = '{"items":[{"title":"东大陆","category":"地理地貌","summary":"主要大陆","key_points":["多山地"],"source":"世界观-东大陆"}]}'
    } else if (sys.includes('资料分类助手')) {
      content = '考据资料'
    }
    return {
      ok: true,
      text: async () => '',
      json: async () => ({ choices: [{ message: { content } }], usage: { prompt_tokens: 123, completion_tokens: 45 }, model: 'test-model' }),
    }
  }

  try {
    // ========== 项目 ==========
    section('项目')
    const novel = services.createNovel({ name: '测试小说', genre: '科幻', description: '测试' })
    assert(novel.id > 0 && novel.name === '测试小说', '创建项目')
    assert(services.listNovels().length === 1, '列出项目')
    const updated = services.updateNovel(novel.id, { genre: '玄幻' })
    assert(updated.genre === '玄幻', '更新项目')
    assert(services.getNovel(novel.id).genre === '玄幻', '读取项目')

    // ========== 章节 ==========
    section('章节')
    const ch1 = services.createChapter(novel.id, { title: '第一章', content: '林澈走入客栈。' })
    const ch2 = services.createChapter(novel.id, { title: '第二章', content: '夜色渐深，林澈点了壶酒。' })
    assert(services.listChapters(novel.id).length === 2, '创建2个章节')
    assert(ch1.order_index < ch2.order_index, '章节自动排序')
    const reordered = services.reorderChapters(novel.id, [ch2.id, ch1.id])
    assert(reordered[0].id === ch2.id, '章节重新排序')
    const updatedCh = services.updateChapter(ch1.id, { status: '已完成' })
    assert(updatedCh.status === '已完成', '更新章节状态')
    services.updateChapter(ch2.id, { content: '夜色渐深，林澈点了壶酒，望向窗外。' })

    // ========== 版本快照 ==========
    section('版本快照')
    services.saveVersion(ch1.id, 'v1 内容', '第一版')
    services.saveVersion(ch1.id, 'v2 内容', '第二版')
    const versions = services.listVersions(ch1.id)
    assert(versions.length === 2, '保存2个版本')
    const vc = services.getVersionContent(versions[0].id)
    assert(vc.content === 'v2 内容', '读取版本内容')

    // ========== 大纲 ==========
    section('大纲')
    const o1 = services.createOutline(novel.id, { title: '第一卷', type: '卷' })
    const o2 = services.createOutline(novel.id, { title: '第一章', parentId: o1.id, type: '章' })
    assert(services.listOutlines(novel.id).length === 2, '创建大纲节点')
    services.updateOutline(o2.id, { content: '开场' })
    assert(services.listOutlines(novel.id).find((x) => x.id === o2.id).content === '开场', '更新大纲')

    // ========== 人物 ==========
    section('人物')
    const c1 = services.createCharacter(novel.id, { name: '林澈', role: '主角' })
    const c2 = services.createCharacter(novel.id, { name: '苏晚', role: '女主' })
    assert(services.listCharacters(novel.id).length === 2, '创建人物')
    services.updateCharacter(c1.id, { personality: '沉着冷静' })
    assert(services.listCharacters(novel.id).find((x) => x.id === c1.id).personality === '沉着冷静', '更新人物')

    // ========== 世界观 ==========
    section('世界观')
    services.createWorld(novel.id, { name: '东大陆', category: '地理' })
    services.createWorld(novel.id, { name: '林家', category: '势力组织' })
    assert(services.listWorlds(novel.id).length === 2, '创建世界观')

    // ========== 资料库 + 分类 ==========
    section('资料库与分类')
    const m1 = services.createMaterial(novel.id, { title: '魔法体系', content: '魔法与修炼境界设定、规则' })
    const m2 = services.createMaterial(novel.id, { title: '唐朝官制', content: '三省六部与科举考据资料' })
    assert(services.listMaterials(novel.id).length === 2, '创建资料')
    assert(ai.classifyLocal(m1.content) === '世界观设定', '本地分类命中世界观')
    assert(ai.classifyLocal(m2.content) === '考据资料', '本地分类命中考据')
    services.setSetting('ai_api_key', 'test-key')
    services.setSetting('ai_base_url', 'https://api.test.com/v1')
    const aiType = await ai.classifyMaterialAI('一些关于炼丹的考据内容')
    assert(aiType === '考据资料', 'AI 分类（mock）')
    assert(services.queryMaterials(novel.id, '科举').length === 1, '资料按关键字查询')
    assert(services.getMaterialTypes(novel.id).includes('未分类'), '资料类型查询')

    // ========== 伏笔 ==========
    section('伏笔')
    const f1 = services.createForeshadowing(novel.id, { title: '神秘罗盘', type: '契诃夫之枪', status: '计划' })
    services.updateForeshadowing(f1.id, { status: '已埋', chapter_id: ch1.id })
    assert(services.listForeshadowings(novel.id).length === 1, '创建伏笔')
    assert(services.listForeshadowings(novel.id, '已埋').length === 1, '伏笔状态筛选')
    assert(services.listForeshadowings(novel.id)[0].chapter_title === '第一章', '伏笔关联章节标题')

    // ========== 年表 ==========
    section('年表')
    services.createTimelineEvent(novel.id, { title: '主角出海', story_time: '开元三年春' })
    services.createTimelineEvent(novel.id, { title: '归来', story_time: '开元四年' })
    assert(services.listTimeline(novel.id).length === 2, '创建年表事件')
    assert(services.listTimeline(novel.id)[0].title === '主角出海', '年表按时间排序')

    // ========== 关系 ==========
    section('关系')
    const r1 = services.createRelation(novel.id, { char_a_id: c1.id, char_b_id: c2.id, type: '恋人' })
    assert(services.listRelations(novel.id).length === 1, '创建关系')
    assert(services.listRelations(novel.id, c1.id).length === 1, '按人物查询关系')
    services.updateRelation(r1.id, { direction: '单向' })
    assert(services.listRelations(novel.id)[0].direction === '单向', '更新关系')

    // ========== 物品 ==========
    section('物品/道具/地点')
    services.createItem(novel.id, { name: '定风珠', category: '道具', importance: '绝世', owner_id: c1.id })
    assert(services.listItems(novel.id).length === 1, '创建物品')
    assert(services.listItems(novel.id, '道具')[0].owner_name === '林澈', '物品关联持有人')
    services.createItem(novel.id, { name: '东海龙宫', category: '关键地点' })
    assert(services.listItems(novel.id, '关键地点').length === 1, '物品分类筛选')

    // ========== 提示词 ==========
    section('提示词库')
    const prompts = services.listPrompts(novel.id)
    assert(prompts.length >= 12, `内置提示词数量 >= 12（实际 ${prompts.length}）`)
    const p1 = services.createPrompt(novel.id, { name: '自定义', category: '通用', system_prompt: 'sys', user_prompt: 'usr' })
    services.updatePrompt(p1.id, { name: '改名' })
    assert(services.listPrompts(novel.id).some((x) => x.name === '改名'), '自定义提示词增改')
    services.deletePrompt(p1.id)
    assert(!services.listPrompts(novel.id).some((x) => x.name === '改名'), '删除自定义提示词')

    // ========== 错字检查 ==========
    section('错字错词')
    const check = typo.runCheck('他做为一名船长，迫不急待。', { includeFrequency: true })
    assert(check.issues.some((i) => i.wrong === '做为'), '词典命中「做为」')
    assert(check.issues.some((i) => i.wrong === '迫不急待'), '词典命中「迫不急待」')
    assert(check.frequency.length > 0, '高频字统计')
    const fix = typo.applyFix('他做为一名船长，迫不急待。', check.issues)
    assert(fix.text === '他作为一名船长，迫不及待。' && fix.count === 2, '批量修正')
    services.addTypo({ wrong: '测试错词', right: '测试对词' })
    assert(services.listTypoDict().some((x) => x.wrong === '测试错词'), '自定义词典添加')

    // ========== 统计 ==========
    section('统计')
    const stats = services.getStats(novel.id)
    assert(stats.totalChapters === 2 && stats.characters === 2, '统计章节/人物')
    assert(stats.foreshadowings === 1 && stats.relations === 1 && stats.items === 2, '统计伏笔/关系/物品')
    assert(stats.wordLog.length >= 1, '字数日志')

    // ========== 全文搜索 + 全局替换 ==========
    section('搜索与替换')
    const sr = services.fullTextSearch(novel.id, '林澈')
    assert(sr.chapters.length === 2, '全文搜索命中章节')
    assert(sr.characters.length === 1, '全文搜索命中人物')
    const rep = services.replaceInChapters(novel.id, '林澈', '林远')
    assert(rep.total >= 2, `全局替换 ${rep.total} 处`)
    assert(services.listChapters(novel.id)[0].content.includes('林远'), '替换后内容更新')

    // ========== AI 链路（mock） ==========
    section('AI 链路')
    const proof = await ai.aiProofread('他做为一名船长。')
    assert(Array.isArray(proof) && proof.length === 2, 'AI 校对返回数组')
    const asst = await ai.aiAssistant('帮我续写', '上下文')
    assert(typeof asst.content === 'string' && asst.content.length > 0, 'AI 助手返回内容')
    const asstSys = await ai.aiAssistantWithSystem('你是编辑', '润色这段', '正文')
    assert(asstSys.content.length > 0, 'AI 助手（带系统提示词）')
    const ana = await ai.aiAnalyzeSettings('东大陆：多山地。')
    assert(Array.isArray(ana.items) && ana.items.length === 1, 'AI 设定分析')
    assert(ana.items[0].category === '地理地貌', 'AI 设定分类映射')
    const conn = await ai.testConnection()
    assert(conn.content.includes('AI 的回复'), '连接测试')
    // 校验 usage 已记录
    const usage = services.getAiUsage()
    assert(usage.calls === 6, `AI 用量记录 ${usage.calls} 次调用`)

    // ========== 导出/导入/备份 ==========
    section('导出/导入/备份')
    const expDir = path.join(os.tmpdir(), 'novel-export-fulltest')
    fs.rmSync(expDir, { recursive: true, force: true })
    const exp = services.exportNovel(novel.id, expDir)
    assert(fs.existsSync(path.join(exp.dir, 'project.json')), '导出 project.json')
    assert(fs.readdirSync(path.join(exp.dir, 'chapters')).length === 2, '导出 Markdown 章节')
    const imp = services.importNovel(exp.dir)
    assert(imp.name === '测试小说', '导入新项目')
    assert(services.listChapters(imp.id).length === 2, '导入章节数')
    const backDir = path.join(os.tmpdir(), 'novel-backup-fulltest')
    fs.rmSync(backDir, { recursive: true, force: true })
    const back = services.backupNovel(novel.id, backDir)
    assert(fs.existsSync(path.join(back.dir, 'project.json')), '备份到文件夹')
    const auto = services.autoBackupAll(backDir)
    assert(auto.count === 2, '自动备份全部项目')

    // ========== 删除级联 ==========
    section('删除级联')
    const delNovel = services.createNovel({ name: '待删除' })
    const delCh = services.createChapter(delNovel.id, { title: '临时' })
    services.deleteNovel(delNovel.id)
    assert(!services.getNovel(delNovel.id), '删除项目')
    assert(!services.getChapter(delCh.id), '级联删除章节')

    console.log(`\n========== 测试完成：${passed} 通过，${failed} 失败 ==========`)
  } catch (e) {
    console.error('\n测试异常终止:', e.message, e.stack)
    failed++
  }

  if (failed > 0) process.exitCode = 1
  app.quit()
})
