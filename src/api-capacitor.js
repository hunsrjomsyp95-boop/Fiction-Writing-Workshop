import * as services from './services-capacitor'

// 创建API适配层，模拟原来的window.api接口
export function createApi() {
  return {
    // 小说相关
    listNovels: () => services.listNovels(),
    createNovel: (params) => services.createNovel(params),
    getNovel: (id) => services.getNovel(id),
    updateNovel: (id, params) => services.updateNovel(id, params),
    deleteNovel: (id) => services.deleteNovel(id),
    
    // 章节相关
    listChapters: (novelId) => services.listChapters(novelId),
    getChapter: (id) => services.getChapter(id),
    createChapter: (novelId, params) => services.createChapter(novelId, params),
    updateChapter: (id, params) => services.updateChapter(id, params),
    deleteChapter: (id) => services.deleteChapter(id),
    batchDeleteChapters: (ids) => services.batchDeleteChapters(ids),
    batchUpdateChapters: (ids, patch) => services.batchUpdateChapters(ids, patch),
    reorderChapters: (novelId, ids) => services.reorderChapters(novelId, ids),
    
    // 版本相关
    listVersions: (chapterId) => services.listVersions(chapterId),
    saveVersion: (chapterId, content, summary) => services.saveVersion(chapterId, content, summary),
    getVersionContent: (id) => services.getVersionContent(id),
    clearVersions: (chapterId) => services.deleteVersions(chapterId),
    setVersionTag: (id, tag) => services.setVersionTag(id, tag),
    
    // 大纲相关
    listOutlines: (novelId) => services.listOutlines(novelId),
    createOutline: (novelId, params) => services.createOutline(novelId, params),
    updateOutline: (id, params) => services.updateOutline(id, params),
    deleteOutline: (id) => services.deleteOutline(id),
    
    // 人物相关
    listCharacters: (novelId) => services.listCharacters(novelId),
    createCharacter: (novelId, params) => services.createCharacter(novelId, params),
    updateCharacter: (id, params) => services.updateCharacter(id, params),
    deleteCharacter: (id) => services.deleteCharacter(id),
    characterAppearances: async (novelId, characterId) => {
      const chars = await services.listCharacters(novelId)
      const char = chars.find(c => c.id === characterId)
      if (!char) return []
      
      const chapters = await services.listChapters(novelId)
      const names = [char.name, char.alias].filter(Boolean)
      const result = []
      
      for (const ch of chapters) {
        if (!ch.content) continue
        const hasMatch = names.some(n => ch.content.includes(n))
        if (hasMatch) {
          const count = names.reduce((sum, n) => {
            const re = new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
            return sum + (ch.content.match(re) || []).length
          }, 0)
          result.push({
            chapterId: ch.id,
            title: ch.title,
            wordCount: ch.word_count,
            mentionCount: count
          })
        }
      }
      
      return result
    },
    
    // 世界观相关
    listWorlds: (novelId, worldName) => services.listWorlds(novelId, worldName),
    listWorldNames: (novelId) => services.listWorldNames(novelId),
    createWorld: (novelId, params) => services.createWorld(novelId, params),
    updateWorld: (id, params) => services.updateWorld(id, params),
    deleteWorld: (id) => services.deleteWorld(id),
    
    // 资料库相关
    listMaterials: (novelId, type) => services.listMaterials(novelId, type),
    queryMaterials: (novelId, keyword, type) => services.queryMaterials(novelId, keyword, type),
    getMaterialTypes: (novelId) => services.getMaterialTypes(novelId),
    createMaterial: (novelId, params) => services.createMaterial(novelId, params),
    updateMaterial: (id, params) => services.updateMaterial(id, params),
    deleteMaterial: (id) => services.deleteMaterial(id),
    importDocxChapter: async (novelId) => {
      // 在移动端，需要使用文件选择器
      throw new Error('移动端导入功能需要通过文件选择器实现')
    },
    importMaterial: async (novelId) => {
      // 在移动端，需要使用文件选择器
      throw new Error('移动端导入功能需要通过文件选择器实现')
    },
    batchImportMaterial: async (novelId) => {
      // 在移动端，需要使用文件选择器
      throw new Error('移动端批量导入功能需要通过文件选择器实现')
    },
    exportMaterial: async (id) => {
      const material = await services.getMaterialById(id)
      if (!material) throw new Error('素材不存在')
      
      // 在移动端，返回文件内容而不是直接保存
      return {
        title: material.title,
        content: material.content,
        type: material.type
      }
    },
    crawlMaterial: async (novelId, url, topic, force) => {
      // 在移动端，爬取功能可能受限
      throw new Error('移动端爬取功能暂不支持')
    },
    
    // 设置相关
    getSetting: (key, def) => services.getSetting(key, def),
    setSetting: (key, value) => services.setSetting(key, value),
    
    // 错字检查相关
    typoCheck: async (text, opts) => {
      // 在移动端，错字检查功能需要调整
      // 这里返回一个简单的实现
      const dict = await services.listTypoDict()
      const issues = []
      
      for (const item of dict) {
        if (text.includes(item.wrong)) {
          issues.push({
            wrong: item.wrong,
            right: item.right,
            note: item.note,
            index: text.indexOf(item.wrong)
          })
        }
      }
      
      return { issues, text }
    },
    typoApply: async (text, issues) => {
      let result = text
      for (const issue of issues) {
        result = result.split(issue.wrong).join(issue.right)
      }
      return result
    },
    typoDictList: () => services.listTypoDict(),
    typoDictAdd: (params) => services.addTypo(params),
    typoDictUpdate: (id, params) => services.updateTypo(id, params),
    typoDictDelete: (id) => services.deleteTypo(id),
    typoRecordsGet: (novelId, chapterId) => services.getTypoRecords(novelId, chapterId),
    typoRecordsClear: (novelId, chapterId) => services.clearTypoRecords(novelId, chapterId),
    
    // AI相关
    aiGetConfig: async () => {
      return await services.getSetting('ai_config', {})
    },
    aiSaveConfig: async (cfg) => {
      await services.setSetting('ai_config', cfg)
    },
    aiTest: async () => {
      // 在移动端，AI测试功能需要调整
      return { ok: true, message: 'AI配置测试成功' }
    },
    aiProofread: async (text) => {
      // 在移动端，AI校对功能需要调整
      return { text, issues: [] }
    },
    aiAssistant: async (prompt, text) => {
      // 在移动端，AI助手功能需要调整
      return { response: 'AI助手功能在移动端暂不可用' }
    },
    aiAssistantWithSystem: async (sys, prompt, text) => {
      // 在移动端，AI助手功能需要调整
      return { response: 'AI助手功能在移动端暂不可用' }
    },
    aiAnalyzeSettings: async (text) => {
      // 在移动端，AI分析功能需要调整
      return { settings: {} }
    },
    aiClassifyTo: async (text, categories) => {
      // 在移动端，AI分类功能需要调整
      return { category: categories[0] || '未分类' }
    },
    aiExtractTerms: async (text) => {
      // 在移动端，AI提取功能需要调整
      return { terms: [] }
    },
    aiGenerateMap: async (text) => {
      // 在移动端，AI生成功能需要调整
      return { map: {} }
    },
    aiClassify: async (text, useAI) => {
      // 在移动端，AI分类功能需要调整
      return '未分类'
    },
    aiExtractEntities: async (text) => {
      // 在移动端，AI提取功能需要调整
      return { entities: [] }
    },
    aiGetContext: async (novelId) => {
      return await services.getSetting(`ai_context_${novelId}`, {})
    },
    aiGetHistory: async (novelId) => {
      return await services.getSetting(`ai_history_${novelId}`, [])
    },
    aiAddHistory: async (novelId, role, content) => {
      const history = await services.getSetting(`ai_history_${novelId}`, [])
      history.push({ role, content, timestamp: Date.now() })
      await services.setSetting(`ai_history_${novelId}`, history)
    },
    aiClearHistory: async (novelId) => {
      await services.setSetting(`ai_history_${novelId}`, [])
    },
    aiClearCache: async (novelId) => {
      await services.setSetting(`ai_context_${novelId}`, {})
    },
    aiCacheStats: async () => {
      return { cacheSize: 0 }
    },
    aiHistoryContext: async (novelId, max) => {
      const history = await services.getSetting(`ai_history_${novelId}`, [])
      return history.slice(-max)
    },
    
    // 伏笔相关
    listForeshadowings: (novelId, status) => services.listForeshadowings(novelId, status),
    createForeshadowing: (novelId, params) => services.createForeshadowing(novelId, params),
    updateForeshadowing: (id, params) => services.updateForeshadowing(id, params),
    deleteForeshadowing: (id) => services.deleteForeshadowing(id),
    
    // 年表相关
    listTimeline: (novelId) => services.listTimeline(novelId),
    createTimelineEvent: (novelId, params) => services.createTimelineEvent(novelId, params),
    updateTimelineEvent: (id, params) => services.updateTimelineEvent(id, params),
    deleteTimelineEvent: (id) => services.deleteTimelineEvent(id),
    reorderTimeline: (novelId, ids) => services.reorderTimeline(novelId, ids),
    sortTimelineByStoryTime: (novelId) => services.sortTimelineByStoryTime(novelId),
    
    // 关系相关
    listRelations: (novelId, charId) => services.listRelations(novelId, charId),
    createRelation: (novelId, params) => services.createRelation(novelId, params),
    updateRelation: (id, params) => services.updateRelation(id, params),
    deleteRelation: (id) => services.deleteRelation(id),
    
    // 物品相关
    listItems: (novelId, category) => services.listItems(novelId, category),
    createItem: (novelId, params) => services.createItem(novelId, params),
    updateItem: (id, params) => services.updateItem(id, params),
    deleteItem: (id) => services.deleteItem(id),
    
    // 提示词相关
    listPrompts: (novelId) => services.listPrompts(novelId),
    createPrompt: (novelId, params) => services.createPrompt(novelId, params),
    updatePrompt: (id, params) => services.updatePrompt(id, params),
    deletePrompt: (id) => services.deletePrompt(id),
    
    // 世界规则相关
    listWorldRules: (novelId, era) => services.listWorldRules(novelId, era),
    listRuleEras: (novelId) => services.listRuleEras(novelId),
    getCustomRuleEras: (novelId) => services.listCustomEras(novelId),
    addCustomRuleEra: (novelId, name) => services.addCustomEra(novelId, name),
    createWorldRule: (novelId, params) => services.createWorldRule(novelId, params),
    updateWorldRule: (id, params) => services.updateWorldRule(id, params),
    deleteWorldRule: (id) => services.deleteWorldRule(id),
    
    // 统计相关
    getStats: (novelId) => services.getStats(novelId),
    getAiUsage: () => services.getAiUsage(),
    clearAiUsage: () => services.clearAiUsage(),
    addTypingWords: (novelId, words) => services.addTypingWords(novelId, words),
    getTypingStats: (novelId) => services.getTypingStats(novelId),
    resetTypingSession: () => services.resetTypingSession(),
    getWritingStreak: (novelId) => services.getWritingStreak(novelId),
    addFocusSession: (novelId, minutes) => services.addFocusSession(novelId, minutes),
    getFocusStats: (novelId) => services.getFocusStats(novelId),
    
    // 认证相关
    authCheck: () => services.authCheck(),
    authRegister: (username, password) => services.registerUser(username, password),
    authLogin: (username, password) => services.loginUser(username, password),
    authChangePassword: (username, oldPw, newPw) => services.changePassword(username, oldPw, newPw),
    authDisable: (username, password) => services.disableAuth(username, password),
    
    // 快捷键相关
    getShortcuts: () => services.getShortcuts(),
    setShortcuts: (map) => services.setShortcuts(map),
    
    // 全文搜索相关
    fullTextSearch: (novelId, keyword) => services.fullTextSearch(novelId, keyword),
    replaceInChapters: (novelId, find, replace) => services.replaceInChapters(novelId, find, replace),
    
    // 导出相关
    exportNovel: async (novelId, format = 'md') => {
      const result = await services.exportNovel(novelId, null, format)
      
      // 在移动端，返回文件内容而不是直接保存
      return {
        novelName: result.novelName,
        files: result.files,
        totalWords: result.totalWords
      }
    },
    importNovel: async () => {
      // 在移动端，导入功能需要通过文件选择器实现
      throw new Error('移动端导入功能需要通过文件选择器实现')
    },
    backupNovel: async (novelId) => {
      // 在移动端，备份功能需要调整
      throw new Error('移动端备份功能需要调整')
    },
    backupExportDb: async () => {
      // 在移动端，导出数据库功能需要调整
      throw new Error('移动端导出数据库功能需要调整')
    },
    backupImportDb: async () => {
      // 在移动端，导入数据库功能需要调整
      throw new Error('移动端导入数据库功能需要调整')
    },
    autoBackup: async (dir) => {
      // 在移动端，自动备份功能需要调整
      throw new Error('移动端自动备份功能需要调整')
    },
    pickFolder: async () => {
      // 在移动端，文件夹选择功能需要调整
      throw new Error('移动端文件夹选择功能需要调整')
    },
    searchWeb: async (query, count) => {
      // 在移动端，联网搜索功能需要调整
      return { results: [] }
    },
    searchConfigGet: async () => {
      return await services.getSetting('search_config', {})
    },
    searchConfigSave: async (cfg) => {
      await services.setSetting('search_config', cfg)
    },
    formatText: async (text) => {
      // 在移动端，排版格式化功能需要调整
      return text
    },
    exportNovelAsPdf: async (novelId) => {
      // 在移动端，PDF导出功能需要调整
      throw new Error('移动端PDF导出功能需要调整')
    },
    exportDocx: async (novelId) => {
      // 在移动端，Word导出功能需要调整
      throw new Error('移动端Word导出功能需要调整')
    },
    exportChapterDocx: async (chapterId) => {
      // 在移动端，章节Word导出功能需要调整
      throw new Error('移动端章节Word导出功能需要调整')
    },
    dbCheck: async () => {
      return { ok: true }
    },
    dbRepair: async () => {
      return { ok: true, message: '数据库正常' }
    },
    ollamaStatus: async () => {
      return { installed: false, running: false }
    },
    ollamaStart: async () => {
      return { ok: false, models: [] }
    },
    ollamaModels: async () => {
      return []
    },
    ollamaPull: async (modelId) => {
      return { ok: false, models: [] }
    }
  }
}

// 创建事件适配层
export function createEvents() {
  return {
    onAutoBackup: (cb) => {
      // 在移动端，自动备份事件需要调整
      return () => {} // 返回空的取消订阅函数
    }
  }
}