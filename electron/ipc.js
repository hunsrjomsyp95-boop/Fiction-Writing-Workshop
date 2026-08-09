const { ipcMain, dialog } = require('electron')
const services = require('./services')
const typo = require('./typo')
const ai = require('./ai')
const search = require('./search')
const format = require('./format')
const crawl = require('./crawl')
const path = require('path')
const fs = require('fs')
const { sanitize } = require('./services/common')

function handle(name, fn) {
  ipcMain.handle(name, async (_e, ...args) => {
    try {
      return { ok: true, data: await fn(...args) }
    } catch (err) {
      return { ok: false, error: err.message || String(err) }
    }
  })
}

function pickFolder(title) {
  return dialog.showOpenDialog({ title, properties: ['openDirectory', 'createDirectory'] })
}

function registerAll() {
  // 项目
  handle('novel:list', () => services.listNovels())
  handle('novel:create', (p) => services.createNovel(p))
  handle('novel:get', (id) => services.getNovel(id))
  handle('novel:update', (id, p) => services.updateNovel(id, p))
  handle('novel:delete', (id) => services.deleteNovel(id))

  // 章节
  handle('chapter:list', (novelId) => services.listChapters(novelId))
  handle('chapter:get', (id) => services.getChapter(id))
  handle('chapter:create', (novelId, p) => services.createChapter(novelId, p))
  handle('chapter:update', (id, p) => services.updateChapter(id, p))
  handle('chapter:delete', (id) => services.deleteChapter(id))
  handle('chapter:batch-delete', (ids) => services.batchDeleteChapters(ids))
  handle('chapter:batch-update', (ids, patch) => services.batchUpdateChapters(ids, patch))
  handle('chapter:reorder', (novelId, ids) => services.reorderChapters(novelId, ids))
  handle('chapter:import:docx', async (novelId) => {
    const res = await dialog.showOpenDialog({
      title: '导入 Word 文档作为章节',
      filters: [{ name: 'Word 文档', extensions: ['docx'] }],
      properties: ['openFile'],
    })
    if (res.canceled || !res.filePaths[0]) return { canceled: true }
    return services.importDocxAsChapter(novelId, res.filePaths[0])
  })

  // 版本
  handle('version:list', (chapterId) => services.listVersions(chapterId))
  handle('version:save', (chapterId, content, summary) => services.saveVersion(chapterId, content, summary))
  handle('version:get', (id) => services.getVersionContent(id))
  handle('version:clear', (chapterId) => services.deleteVersions(chapterId))
  handle('version:tag', (id, tag) => services.setVersionTag(id, tag))

  // 大纲
  handle('outline:list', (novelId) => services.listOutlines(novelId))
  handle('outline:create', (novelId, p) => services.createOutline(novelId, p))
  handle('outline:update', (id, p) => services.updateOutline(id, p))
  handle('outline:delete', (id) => services.deleteOutline(id))

  // 人物
  handle('character:list', (novelId) => services.listCharacters(novelId))
  handle('character:create', (novelId, p) => services.createCharacter(novelId, p))
  handle('character:update', (id, p) => services.updateCharacter(id, p))
  handle('character:delete', (id) => services.deleteCharacter(id))

  // 角色出场追踪：扫描所有章节内容，返回角色出现的章节列表
  handle('character:appearances', (novelId, characterId) => {
    const chars = services.listCharacters(novelId)
    const char = chars.find((c) => c.id === characterId)
    if (!char) return []
    const chapters = services.listChapters(novelId)
    const names = [char.name, char.alias].filter(Boolean)
    const result = []
    for (const ch of chapters) {
      if (!ch.content) continue
      const hasMatch = names.some((n) => ch.content.includes(n))
      if (hasMatch) {
        const count = names.reduce((sum, n) => {
          const re = new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
          return sum + (ch.content.match(re) || []).length
        }, 0)
        result.push({ chapterId: ch.id, title: ch.title, wordCount: ch.word_count, mentionCount: count })
      }
    }
    return result
  })

  // 世界观
  handle('world:list', (novelId, worldName) => services.listWorlds(novelId, worldName))
  handle('world:names', (novelId) => services.listWorldNames(novelId))
  handle('world:create', (novelId, p) => services.createWorld(novelId, p))
  handle('world:update', (id, p) => services.updateWorld(id, p))
  handle('world:delete', (id) => services.deleteWorld(id))

  // 资料库
  handle('material:list', (novelId, type) => services.listMaterials(novelId, type))
  handle('material:query', (novelId, keyword, type) => services.queryMaterials(novelId, keyword, type))
  handle('material:types', (novelId) => services.getMaterialTypes(novelId))
  handle('material:create', (novelId, p) => services.createMaterial(novelId, p))
  handle('material:update', (id, p) => services.updateMaterial(id, p))
  handle('material:delete', (id) => services.deleteMaterial(id))
  handle('material:import', async (novelId) => {
    const res = await dialog.showOpenDialog({
      title: '导入素材文件',
      filters: [{ name: '文本文件', extensions: ['txt', 'md', 'json'] }],
      properties: ['openFile'],
    })
    if (res.canceled || !res.filePaths[0]) return { canceled: true }
    const content = fs.readFileSync(res.filePaths[0], 'utf-8')
    const name = path.basename(res.filePaths[0], path.extname(res.filePaths[0]))
    return services.createMaterial(novelId, { title: name, content, source: res.filePaths[0] })
  })
  handle('material:batchImport', async (novelId) => {
    const res = await dialog.showOpenDialog({ title: '选择包含素材文件的文件夹', properties: ['openDirectory'] })
    if (res.canceled || !res.filePaths[0]) return { canceled: true }
    const dir = res.filePaths[0]
    const files = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile() && /\.(md|txt)$/i.test(entry.name)) {
        const content = fs.readFileSync(path.join(dir, entry.name), 'utf-8')
        const name = path.basename(entry.name, path.extname(entry.name))
        files.push({ name, content })
      }
    }
    return services.materialBatchImport(novelId, files)
  })
  handle('material:crawl', async (novelId, url, topic, force) => {
    const result = await crawl.crawlUrl(url)
    const type = await ai.classifyMaterialAI(result.text)
    const material = await services.createMaterial(novelId, {
      title: result.title || url,
      content: result.text,
      source: url,
      type,
    })
    if (!force) {
      const filter = await ai.aiFilterContent(result.text, topic)
      if (!filter.relevant) {
        await services.deleteMaterial(material.id)
        return { filtered: true, reason: filter.reason, title: result.title }
      }
    }
    return { filtered: false, material }
  })
  handle('material:export', async (id) => {
    const m = services.getMaterialById(id)
    if (!m) return { error: '素材不存在' }
    const res = await dialog.showSaveDialog({
      title: '导出素材',
      defaultPath: `${m.title}.md`,
      filters: [
        { name: 'Markdown', extensions: ['md'] },
        { name: '纯文本', extensions: ['txt'] },
      ],
    })
    if (res.canceled || !res.filePath) return { canceled: true }
    const ext = path.extname(res.filePath).toLowerCase()
    let text
    if (ext === '.txt') {
      text = m.content || ''
    } else {
      text = `# ${m.title}\n\n> 类型：${m.type} 标签：${m.tags || '无'} 来源：${m.source || '无'}\n\n${m.content}`
    }
    fs.writeFileSync(res.filePath, text, 'utf-8')
    return { file: res.filePath }
  })

  // 设置
  handle('setting:get', (key, def) => services.getSetting(key, def))
  handle('setting:set', (key, value) => services.setSetting(key, value))

  // 错字检查
  handle('typo:check', (text, opts) => typo.runCheck(text, opts))
  handle('typo:apply', (text, issues) => typo.applyFix(text, issues))
  handle('typo:dict:list', () => services.listTypoDict())
  handle('typo:dict:add', (p) => services.addTypo(p))
  handle('typo:dict:update', (id, p) => services.updateTypo(id, p))
  handle('typo:dict:delete', (id) => services.deleteTypo(id))
  handle('typo:records:get', (novelId, chapterId) => services.getTypoRecords(novelId, chapterId))
  handle('typo:records:clear', (novelId, chapterId) => services.clearTypoRecords(novelId, chapterId))

  // AI
  handle('ai:config:get', () => ai.getConfig())
  handle('ai:config:save', (cfg) => ai.saveConfig(cfg))
  handle('ai:test', () => ai.testConnection())
  handle('ai:proofread', (text) => ai.aiProofread(text))
  handle('ai:assistant', (prompt, text) => ai.aiAssistant(prompt, text))
  handle('ai:assistant:system', (sys, prompt, text) => ai.aiAssistantWithSystem(sys, prompt, text))
  handle('ai:analyze-settings', (text) => ai.aiAnalyzeSettings(text))
  handle('ai:classify-to', (text, categories) => ai.aiClassifyTo(text, categories))
  handle('ai:extract-terms', (text) => ai.aiExtractTerms(text))
  handle('ai:generate-map', (text) => ai.aiGenerateMap(text))
  handle('ai:extract-entities', (text) => ai.aiExtractEntities(text))
  handle('ai:classify', (text, useAI) => (useAI ? ai.classifyMaterialAI(text) : ai.classifyLocal(text)))

  // Ollama 本地模型管理
  const ollama = require('./ollama')
  handle('ollama:status', async () => ({
    installed: ollama.isInstalled(),
    running: await ollama.isRunning(),
  }))
  handle('ollama:start', async () => {
    const ok = await ollama.ensureRunning()
    return { ok, models: ok ? await ollama.listModels() : [] }
  })
  handle('ollama:models', async () => ollama.listModels())
  handle('ollama:pull', async (modelId) => {
    const lines = []
    await ollama.pullModel(modelId, (data) => lines.push(data))
    return { ok: true, models: await ollama.listModels() }
  })

  // 联网搜索
  handle('search:web', (query, count) => search.webSearch(query, count))
  handle('search:config:get', () => search.getSearchConfig())
  handle('search:config:save', (cfg) => search.saveSearchConfig(cfg))

  // 排版格式化
  handle('format:text', (text) => format.formatText(text))

  // 伏笔
  handle('foreshadow:list', (novelId, status) => services.listForeshadowings(novelId, status))
  handle('foreshadow:create', (novelId, p) => services.createForeshadowing(novelId, p))
  handle('foreshadow:update', (id, p) => services.updateForeshadowing(id, p))
  handle('foreshadow:delete', (id) => services.deleteForeshadowing(id))

  // 年表
  handle('timeline:list', (novelId) => services.listTimeline(novelId))
  handle('timeline:create', (novelId, p) => services.createTimelineEvent(novelId, p))
  handle('timeline:update', (id, p) => services.updateTimelineEvent(id, p))
  handle('timeline:delete', (id) => services.deleteTimelineEvent(id))
  handle('timeline:reorder', (novelId, ids) => services.reorderTimeline(novelId, ids))
  handle('timeline:sort', (novelId) => services.sortTimelineByStoryTime(novelId))

  // 关系
  handle('relation:list', (novelId, charId) => services.listRelations(novelId, charId))
  handle('relation:create', (novelId, p) => services.createRelation(novelId, p))
  handle('relation:update', (id, p) => services.updateRelation(id, p))
  handle('relation:delete', (id) => services.deleteRelation(id))

  // 物品/道具/地点
  handle('item:list', (novelId, category) => services.listItems(novelId, category))
  handle('item:create', (novelId, p) => services.createItem(novelId, p))
  handle('item:update', (id, p) => services.updateItem(id, p))
  handle('item:delete', (id) => services.deleteItem(id))

  // AI 提示词库
  handle('prompt:list', (novelId) => services.listPrompts(novelId))
  handle('prompt:create', (novelId, p) => services.createPrompt(novelId, p))
  handle('prompt:update', (id, p) => services.updatePrompt(id, p))
  handle('prompt:delete', (id) => services.deletePrompt(id))

  // 真实与幻想规则
  handle('rule:list', (novelId, era) => services.listWorldRules(novelId, era))
  handle('rule:eras', (novelId) => services.listRuleEras(novelId))
  handle('rule:custom-eras', (novelId) => services.listCustomEras(novelId))
  handle('rule:add-era', (novelId, name) => services.addCustomEra(novelId, name))
  handle('rule:create', (novelId, p) => services.createWorldRule(novelId, p))
  handle('rule:update', (id, p) => services.updateWorldRule(id, p))
  handle('rule:delete', (id) => services.deleteWorldRule(id))

  // 统计
  handle('stats:get', (novelId) => services.getStats(novelId))
  handle('usage:get', () => services.getAiUsage())
  handle('usage:clear', () => services.clearAiUsage())
  handle('typing:add', (novelId, words) => services.addTypingWords(novelId, words))
  handle('typing:get', (novelId) => services.getTypingStats(novelId))
  handle('typing:reset', () => services.resetTypingSession())
  handle('typing:streak', (novelId) => services.getWritingStreak(novelId))
  handle('focus:add', (novelId, minutes) => services.addFocusSession(novelId, minutes))
  handle('focus:stats', (novelId) => services.getFocusStats(novelId))

  // 本地登录
  handle('auth:check', () => services.authCheck())
  handle('auth:register', (username, password) => services.registerUser(username, password))
  handle('auth:login', (username, password) => services.loginUser(username, password))
  handle('auth:change-password', (username, oldPw, newPw) => services.changePassword(username, oldPw, newPw))
  handle('auth:disable', (username, password) => services.disableAuth(username, password))

  // 快捷键
  handle('shortcut:get', () => services.getShortcuts())
  handle('shortcut:set', (map) => services.setShortcuts(map))

  // 全文搜索
  handle('search:fulltext', (novelId, keyword) => services.fullTextSearch(novelId, keyword))
  handle('search:replace', (novelId, find, replace) => services.replaceInChapters(novelId, find, replace))

  // 导出 / 导入 / 备份
  handle('export:novel', async (novelId, format = 'md') => {
    const res = await pickFolder('选择导出目录')
    if (res.canceled || !res.filePaths[0]) return { canceled: true }
    return services.exportNovel(novelId, res.filePaths[0], format)
  })
  handle('import:novel', async () => {
    const res = await pickFolder('选择要导入的项目文件夹')
    if (res.canceled || !res.filePaths[0]) return { canceled: true }
    return services.importNovel(res.filePaths[0])
  })
  handle('backup:novel', async (novelId) => {
    const res = await pickFolder('选择备份保存位置')
    if (res.canceled || !res.filePaths[0]) return { canceled: true }
    return services.backupNovel(novelId, res.filePaths[0])
  })
  handle('backup:exportdb', async () => {
    const res = await dialog.showSaveDialog({
      title: '备份完整数据库',
      defaultPath: `novel-studio-backup-${new Date().toISOString().slice(0, 10)}.db`,
    })
    if (res.canceled || !res.filePath) return { canceled: true }
    fs.copyFileSync(services.dbPath(), res.filePath)
    return { file: res.filePath }
  })
  handle('backup:importdb', async () => {
    const res = await dialog.showOpenDialog({
      title: '选择数据库备份文件',
      filters: [{ name: 'SQLite 数据库', extensions: ['db'] }],
    })
    if (res.canceled || !res.filePaths[0]) return { canceled: true }
    const current = services.dbPath()
    const target = path.join(path.dirname(current), `restore-${Date.now()}.db`)
    fs.copyFileSync(res.filePaths[0], target)
    services.replaceDb(target)
    return { file: target }
  })
  handle('backup:auto', (dir) => services.autoBackupAll(dir))
  handle('folder:pick', async () => {
    const res = await pickFolder('选择一个文件夹')
    if (res.canceled || !res.filePaths[0]) return { canceled: true }
    return { dir: res.filePaths[0] }
  })

  // 导出 PDF
  handle('export:pdf', async (novelId) => {
    const { BrowserWindow } = require('electron')
    const novel = services.getNovel(novelId)
    if (!novel) throw new Error('项目不存在')
    const chapters = services.listChapters(novelId)
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body { font-family: 'Noto Serif SC', 'SimSun', serif; font-size: 14px; line-height: 1.8; max-width: 720px; margin: 0 auto; padding: 40px; color: #333; }
      h1 { text-align: center; font-size: 22px; margin-bottom: 30px; }
      .chapter-title { font-size: 18px; margin: 30px 0 10px; border-bottom: 1px solid #ccc; padding-bottom: 6px; }
      p { text-indent: 2em; margin: 0 0 8px; }
      hr { border: none; border-top: 1px dashed #ccc; margin: 30px 0; }
    </style></head><body><h1>${escapeHtml(novel.name || '未命名')}</h1>`
    for (const ch of chapters) {
      html += `<div class="chapter-title">${escapeHtml(ch.title)}</div>`
      const blocks = (ch.content || '').split(/\n{2,}/)
      for (const b of blocks) {
        const trimmed = b.trim()
        if (!trimmed) continue
        if (/^#{1,6}\s/.test(trimmed)) {
          html += `<h3>${escapeHtml(trimmed.replace(/^#+\s*/, ''))}</h3>`
        } else {
          html += `<p>${escapeHtml(trimmed).replace(/\n/g, '<br/>')}</p>`
        }
      }
    }
    html += '</body></html>'
    const win = new BrowserWindow({ show: false, width: 800, height: 600, webPreferences: { sandbox: true } })
    await win.loadURL('data:text/html,' + encodeURIComponent(html))
    const buf = await win.webContents.printToPDF({
      printBackground: true,
      margin: { top: 30, bottom: 30, left: 25, right: 25 },
    })
    win.close()
    const res = await dialog.showSaveDialog({
      title: '导出 PDF',
      defaultPath: `${sanitize(novel.name)}.pdf`,
      filters: [{ name: 'PDF 文件', extensions: ['pdf'] }],
    })
    if (res.canceled || !res.filePath) return { canceled: true }
    fs.writeFileSync(res.filePath, buf)
    return { file: res.filePath }
  })

  // Word 导出 (.docx)
  handle('export:docx', async (novelId) => {
    const novel = services.getNovel(novelId)
    if (!novel) throw new Error('项目不存在')
    const buffer = await services.exportDocx(novelId)
    const res = await dialog.showSaveDialog({
      title: '导出 Word 文档',
      defaultPath: `${sanitize(novel.name)}.docx`,
      filters: [{ name: 'Word 文档', extensions: ['docx'] }],
    })
    if (res.canceled || !res.filePath) return { canceled: true }
    fs.writeFileSync(res.filePath, buffer)
    return { file: res.filePath }
  })
  handle('chapter:export:docx', async (chapterId) => {
    const chapter = services.getChapter(chapterId)
    if (!chapter) throw new Error('章节不存在')
    const buffer = await services.exportDocx(chapter.novel_id, [chapterId])
    const res = await dialog.showSaveDialog({
      title: '导出章节为 Word 文档',
      defaultPath: `${sanitize(chapter.title)}.docx`,
      filters: [{ name: 'Word 文档', extensions: ['docx'] }],
    })
    if (res.canceled || !res.filePath) return { canceled: true }
    fs.writeFileSync(res.filePath, buffer)
    return { file: res.filePath }
  })

  // 数据库完整性检查
  handle('db:check', async () => {
    const { checkIntegrity } = require('./db')
    return { ok: checkIntegrity() }
  })

  // 数据库修复
  handle('db:repair', async () => {
    const { dbPath } = require('./db')
    const currentPath = dbPath()
    const backupPath = currentPath + '.backup.' + Date.now()

    try {
      // 备份当前数据库
      if (fs.existsSync(currentPath)) {
        fs.copyFileSync(currentPath, backupPath)
      }

      // 尝试用 VACUUM 修复
      const database = require('./db').db()
      if (database) {
        database.exec('VACUUM')
        return { ok: true, message: '数据库已修复', backup: backupPath }
      }
      return { ok: false, error: '数据库未初始化' }
    } catch (e) {
      return { ok: false, error: e.message }
    }
  })
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

module.exports = { registerAll }
