import * as services from './services-web'
import { exportDatabase, importDatabase, saveDatabase } from './db-web'

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
      // 网页版使用文件选择器
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.docx'
      
      return new Promise((resolve, reject) => {
        input.onchange = async (e) => {
          const file = e.target.files[0]
          if (!file) {
            reject(new Error('未选择文件'))
            return
          }
          
          try {
            // 使用 mammoth.js 解析 docx
            const mammoth = await import('mammoth')
            const arrayBuffer = await file.arrayBuffer()
            const result = await mammoth.extractRawText({ arrayBuffer })
            resolve({ 
              title: file.name.replace('.docx', ''), 
              content: result.value 
            })
          } catch (err) {
            reject(err)
          }
        }
        input.click()
      })
    },
    importMaterial: async (novelId) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.txt,.md,.docx'
      
      return new Promise((resolve, reject) => {
        input.onchange = async (e) => {
          const file = e.target.files[0]
          if (!file) {
            reject(new Error('未选择文件'))
            return
          }
          
          try {
            const content = await file.text()
            resolve({ title: file.name, content })
          } catch (err) {
            reject(err)
          }
        }
        input.click()
      })
    },
    batchImportMaterial: async (novelId) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.txt,.md,.docx'
      input.multiple = true
      
      return new Promise((resolve, reject) => {
        input.onchange = async (e) => {
          const files = Array.from(e.target.files)
          if (files.length === 0) {
            reject(new Error('未选择文件'))
            return
          }
          
          try {
            const results = []
            for (const file of files) {
              const content = await file.text()
              results.push({ title: file.name, content })
            }
            resolve(results)
          } catch (err) {
            reject(err)
          }
        }
        input.click()
      })
    },
    exportMaterial: async (id) => {
      const material = await services.getMaterialById(id)
      if (!material) throw new Error('素材不存在')
      
      // 创建下载
      const blob = new Blob([material.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${material.title}.txt`
      a.click()
      URL.revokeObjectURL(url)
      
      return {
        title: material.title,
        content: material.content,
        type: material.type
      }
    },
    crawlMaterial: async (novelId, url, topic, force) => {
      // 网页版爬取功能受限
      throw new Error('网页版爬取功能暂不支持')
    },
    
    // 设置相关
    getSetting: (key, def) => services.getSetting(key, def),
    setSetting: (key, value) => services.setSetting(key, value),
    
    // 错字检查相关
    typoCheck: async (text, opts) => {
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
      const provider = await services.getSetting('ai_provider', 'xiaomi')
      const model = await services.getSetting('ai_model', '')
      const baseUrl = await services.getSetting('ai_base_url', '')
      const apiKey = await services.getSetting('ai_api_key', '')
      const temperature = await services.getSetting('ai_temperature', '0.7')
      
      return {
        provider,
        baseUrl,
        apiKey,
        model,
        temperature: Number(temperature)
      }
    },
    aiSaveConfig: async (cfg) => {
      await services.setSetting('ai_provider', cfg.provider || 'xiaomi')
      if (cfg.provider === 'custom') {
        await services.setSetting('ai_base_url', (cfg.baseUrl || '').replace(/\/+$/, '').replace(/\/chat\/completions\/?$/i, ''))
      }
      await services.setSetting('ai_api_key', (cfg.apiKey || '').trim())
      await services.setSetting('ai_model', (cfg.model || '').trim())
      await services.setSetting('ai_temperature', String(Number(cfg.temperature) || 0.7))
      return true
    },
    aiTest: async () => {
      const provider = await services.getSetting('ai_provider', 'xiaomi')
      const model = await services.getSetting('ai_model', '')
      const baseUrl = await services.getSetting('ai_base_url', '')
      const apiKey = await services.getSetting('ai_api_key', '')
      
      if (!apiKey) {
        throw new Error('请先配置API Key')
      }
      
      if (!model) {
        throw new Error('请先选择模型')
      }
      
      try {
        const response = await callAI({ baseUrl, apiKey, model }, '你好', '请回复"测试成功"')
        return { ok: true, message: 'AI配置测试成功' }
      } catch (err) {
        throw new Error(err.message)
      }
    },
    aiProofread: async (text) => {
      const provider = await services.getSetting('ai_provider', 'xiaomi')
      const model = await services.getSetting('ai_model', '')
      const baseUrl = await services.getSetting('ai_base_url', '')
      const apiKey = await services.getSetting('ai_api_key', '')
      
      if (!apiKey) {
        throw new Error('请先配置AI服务')
      }
      
      const prompt = '请检查以下文字中的错别字、语法错误，并返回修改建议。返回JSON格式：{ "text": "修改后的文本", "issues": [{ "wrong": "错误", "right": "正确", "index": 0 }] }'
      
      try {
        const response = await callAI({ baseUrl, apiKey, model }, prompt, text)
        // 尝试解析JSON响应
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
          }
        } catch (e) {
          // 解析失败，返回原始文本
        }
        return { text, issues: [] }
      } catch (err) {
        throw new Error('AI校对失败: ' + err.message)
      }
    },
    aiAssistant: async (prompt, text) => {
      const provider = await services.getSetting('ai_provider', 'xiaomi')
      const model = await services.getSetting('ai_model', '')
      const baseUrl = await services.getSetting('ai_base_url', '')
      const apiKey = await services.getSetting('ai_api_key', '')
      
      if (!apiKey) {
        throw new Error('请先配置AI服务')
      }
      
      try {
        const response = await callAI({ baseUrl, apiKey, model }, prompt, text)
        return { response }
      } catch (err) {
        throw new Error('AI助手失败: ' + err.message)
      }
    },
    aiAssistantWithSystem: async (sys, prompt, text) => {
      const provider = await services.getSetting('ai_provider', 'xiaomi')
      const model = await services.getSetting('ai_model', '')
      const baseUrl = await services.getSetting('ai_base_url', '')
      const apiKey = await services.getSetting('ai_api_key', '')
      
      if (!apiKey) {
        throw new Error('请先配置AI服务')
      }
      
      try {
        const response = await callAI({ baseUrl, apiKey, model }, prompt, text, sys)
        return { response }
      } catch (err) {
        throw new Error('AI助手失败: ' + err.message)
      }
    },
    aiAnalyzeSettings: async (text) => {
      const provider = await services.getSetting('ai_provider', 'xiaomi')
      const model = await services.getSetting('ai_model', '')
      const baseUrl = await services.getSetting('ai_base_url', '')
      const apiKey = await services.getSetting('ai_api_key', '')
      
      if (!apiKey) {
        return { settings: {} }
      }
      
      const prompt = `请从以下文本中提取世界观设定信息，返回JSON格式：
{
  "settings": {
    "magic_system": "魔法体系描述",
    "technology_level": "科技水平",
    "social_structure": "社会结构",
    "geography": "地理环境",
    "history": "历史背景"
  }
}
只返回JSON，不要其他内容。`
      
      try {
        const response = await callAI({ baseUrl, apiKey, model }, prompt, text)
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
          }
        } catch (e) {
          // 解析失败
        }
        return { settings: {} }
      } catch (err) {
        return { settings: {} }
      }
    },
    aiClassifyTo: async (text, categories) => {
      const provider = await services.getSetting('ai_provider', 'xiaomi')
      const model = await services.getSetting('ai_model', '')
      const baseUrl = await services.getSetting('ai_base_url', '')
      const apiKey = await services.getSetting('ai_api_key', '')
      
      if (!apiKey) {
        return { category: categories[0] || '未分类' }
      }
      
      const prompt = `请将以下文本分类到这些类别之一：${categories.join('、')}
只返回类别名称，不要其他内容。`
      
      try {
        const response = await callAI({ baseUrl, apiKey, model }, prompt, text)
        const category = response.trim()
        if (categories.includes(category)) {
          return { category }
        }
        return { category: categories[0] || '未分类' }
      } catch (err) {
        return { category: categories[0] || '未分类' }
      }
    },
    aiExtractTerms: async (text) => {
      const provider = await services.getSetting('ai_provider', 'xiaomi')
      const model = await services.getSetting('ai_model', '')
      const baseUrl = await services.getSetting('ai_base_url', '')
      const apiKey = await services.getSetting('ai_api_key', '')
      
      if (!apiKey) {
        return { terms: [] }
      }
      
      const prompt = `请从以下文本中提取专有名词（人名、地名、组织名、物品名等），返回JSON格式：
{
  "terms": [
    { "name": "名称", "type": "类型", "description": "简短描述" }
  ]
}
只返回JSON，不要其他内容。`
      
      try {
        const response = await callAI({ baseUrl, apiKey, model }, prompt, text)
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
          }
        } catch (e) {
          // 解析失败
        }
        return { terms: [] }
      } catch (err) {
        return { terms: [] }
      }
    },
    aiGenerateMap: async (text) => {
      const provider = await services.getSetting('ai_provider', 'xiaomi')
      const model = await services.getSetting('ai_model', '')
      const baseUrl = await services.getSetting('ai_base_url', '')
      const apiKey = await services.getSetting('ai_api_key', '')
      
      if (!apiKey) {
        return { map: {} }
      }
      
      const prompt = `请根据以下文本生成一个思维导图结构，返回JSON格式：
{
  "map": {
    "name": "中心主题",
    "children": [
      { "name": "子主题", "children": [] }
    ]
  }
}
只返回JSON，不要其他内容。`
      
      try {
        const response = await callAI({ baseUrl, apiKey, model }, prompt, text)
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
          }
        } catch (e) {
          // 解析失败
        }
        return { map: {} }
      } catch (err) {
        return { map: {} }
      }
    },
    aiClassify: async (text, useAI) => {
      const provider = await services.getSetting('ai_provider', 'xiaomi')
      const model = await services.getSetting('ai_model', '')
      const baseUrl = await services.getSetting('ai_base_url', '')
      const apiKey = await services.getSetting('ai_api_key', '')
      
      if (!apiKey || !useAI) {
        return '未分类'
      }
      
      const categories = ['玄幻', '科幻', '都市', '历史', '军事', '游戏', '体育', '悬疑', '灵异', '言情', '武侠', '仙侠', '奇幻', '轻小说', '短篇', '现实', '网文', '剧本', '其他']
      
      const prompt = `请将以下文本分类到这些类别之一：${categories.join('、')}
只返回类别名称，不要其他内容。`
      
      try {
        const response = await callAI({ baseUrl, apiKey, model }, prompt, text)
        const category = response.trim()
        if (categories.includes(category)) {
          return category
        }
        return '未分类'
      } catch (err) {
        return '未分类'
      }
    },
    aiExtractEntities: async (text) => {
      const provider = await services.getSetting('ai_provider', 'xiaomi')
      const model = await services.getSetting('ai_model', '')
      const baseUrl = await services.getSetting('ai_base_url', '')
      const apiKey = await services.getSetting('ai_api_key', '')
      
      if (!apiKey) {
        return { entities: [] }
      }
      
      const prompt = `请从以下文本中提取实体信息，返回JSON格式：
{
  "entities": [
    { "name": "名称", "type": "人物/地点/物品/事件", "description": "简短描述" }
  ]
}
只返回JSON，不要其他内容。`
      
      try {
        const response = await callAI({ baseUrl, apiKey, model }, prompt, text)
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
          }
        } catch (e) {
          // 解析失败
        }
        return { entities: [] }
      } catch (err) {
        return { entities: [] }
      }
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
    
    // 地图相关
    listMapViews: (novelId, type) => services.listMapViews(novelId, type),
    createMapView: (novelId, type, name) => services.createMapView(novelId, type, name),
    updateMapView: (id, params) => services.updateMapView(id, params),
    deleteMapView: (id) => services.deleteMapView(id),
    listMapNodes: (novelId, viewId) => services.listMapNodes(novelId, viewId),
    createMapNode: (novelId, params) => services.createMapNode(novelId, params),
    updateMapNode: (id, params) => services.updateMapNode(id, params),
    deleteMapNode: (id) => services.deleteMapNode(id),
    listMapEdges: (novelId, viewId) => services.listMapEdges(novelId, viewId),
    createMapEdge: (novelId, fromId, toId, label, viewId) => services.createMapEdge(novelId, fromId, toId, label, viewId),
    deleteMapEdge: (id) => services.deleteMapEdge(id),
    deleteEdgesByNode: (nodeId) => services.deleteEdgesByNode(nodeId),
    
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
      
      // 创建下载
      if (result.files && result.files.length > 0) {
        if (result.files.length === 1) {
          const blob = new Blob([result.files[0].content], { type: 'text/plain' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = result.files[0].name
          a.click()
          URL.revokeObjectURL(url)
        } else {
          // 多个文件打包下载（需要 zip 库）
          for (const file of result.files) {
            const blob = new Blob([file.content], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = file.name
            a.click()
            URL.revokeObjectURL(url)
          }
        }
      }
      
      return {
        novelName: result.novelName,
        files: result.files,
        totalWords: result.totalWords
      }
    },
    importNovel: async () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.txt,.md,.docx'
      
      return new Promise((resolve, reject) => {
        input.onchange = async (e) => {
          const file = e.target.files[0]
          if (!file) {
            reject(new Error('未选择文件'))
            return
          }
          
          try {
            const content = await file.text()
            resolve({ title: file.name, content })
          } catch (err) {
            reject(err)
          }
        }
        input.click()
      })
    },
    backupNovel: async (novelId) => {
      // 网页版备份功能：导出数据库
      const blob = exportDatabase()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `novel-studio-backup-${new Date().toISOString().split('T')[0]}.db`
      a.click()
      URL.revokeObjectURL(url)
      
      return { success: true }
    },
    backupExportDb: async () => {
      const blob = exportDatabase()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `novel-studio-${new Date().toISOString().split('T')[0]}.db`
      a.click()
      URL.revokeObjectURL(url)
      
      return { success: true }
    },
    backupImportDb: async () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.db,.sqlite'
      
      return new Promise((resolve, reject) => {
        input.onchange = async (e) => {
          const file = e.target.files[0]
          if (!file) {
            reject(new Error('未选择文件'))
            return
          }
          
          try {
            await importDatabase(file)
            resolve({ success: true })
          } catch (err) {
            reject(err)
          }
        }
        input.click()
      })
    },
    autoBackup: async (dir) => {
      // 网页版自动备份功能
      return { count: 0 }
    },
    pickFolder: async () => {
      // 网页版文件夹选择功能
      throw new Error('网页版不支持文件夹选择')
    },
    searchWeb: async (query, count) => {
      // 网页版联网搜索功能
      return { results: [] }
    },
    searchConfigGet: async () => {
      return await services.getSetting('search_config', {})
    },
    searchConfigSave: async (cfg) => {
      await services.setSetting('search_config', cfg)
    },
    formatText: async (text) => {
      return services.formatText(text)
    },
    exportNovelAsPdf: async (novelId) => {
      // 网页版PDF导出功能
      throw new Error('网页版PDF导出功能暂不支持')
    },
    exportDocx: async (novelId) => {
      // 网页版Word导出功能
      throw new Error('网页版Word导出功能暂不支持')
    },
    exportChapterDocx: async (chapterId) => {
      throw new Error('网页版Word导出功能暂不支持')
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
    },
    
    // 网页版特有功能
    exportDatabase: async () => {
      const blob = exportDatabase()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `novel-studio-${new Date().toISOString().split('T')[0]}.db`
      a.click()
      URL.revokeObjectURL(url)
    },
    importDatabase: async () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.db,.sqlite'
      
      return new Promise((resolve, reject) => {
        input.onchange = async (e) => {
          const file = e.target.files[0]
          if (!file) {
            reject(new Error('未选择文件'))
            return
          }
          
          try {
            await importDatabase(file)
            resolve({ success: true })
          } catch (err) {
            reject(err)
          }
        }
        input.click()
      })
    },
    saveDatabase: async () => {
      await saveDatabase()
      return { success: true }
    }
  }
}

// 创建事件适配层
export function createEvents() {
  return {
    onAutoBackup: (cb) => {
      // 网页版不需要自动备份事件
      return () => {} // 返回空的取消订阅函数
    }
  }
}

// 创建流式AI适配层
export function createAiStream() {
  const listeners = {
    chunk: [],
    done: [],
    error: []
  }
  
  // 带CORS代理的fetch
  async function fetchWithCors(url, options) {
    const urls = [
      url,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    ]
    
    for (const u of urls) {
      try {
        const res = await fetch(u, options)
        if (res.ok) return res
      } catch (e) {
        continue
      }
    }
    throw new Error('所有请求方式都失败')
  }
  
  return {
    assistant: async (requestId, prompt, text) => {
      try {
        const provider = await services.getSetting('ai_provider', 'xiaomi')
        const model = await services.getSetting('ai_model', '')
        const baseUrl = await services.getSetting('ai_base_url', '')
        const apiKey = await services.getSetting('ai_api_key', '')
        
        if (!apiKey) {
          throw new Error('请先配置AI服务')
        }
        
        const url = `${baseUrl}/chat/completions`
        const messages = [{ role: 'user', content: `${prompt}\n\n${text}` }]
        
        const body = {
          model: model,
          temperature: 0.7,
          messages,
          stream: true,
        }
        
        const headers = { 'Content-Type': 'application/json' }
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`
        }
        
        const res = await fetchWithCors(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        })
        
        if (!res.ok) {
          throw new Error(`API 请求失败 (${res.status})`)
        }
        
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let content = ''
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim() !== '')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              
              try {
                const json = JSON.parse(data)
                const delta = json.choices?.[0]?.delta?.content || ''
                if (delta) {
                  content += delta
                  listeners.chunk.forEach(cb => cb(requestId, delta))
                }
              } catch (e) {
                // 解析失败，跳过
              }
            }
          }
        }
        
        listeners.done.forEach(cb => cb(requestId, content))
      } catch (err) {
        listeners.error.forEach(cb => cb(requestId, err.message))
      }
    },
    assistantWithSystem: async (requestId, systemPrompt, prompt, text) => {
      try {
        const provider = await services.getSetting('ai_provider', 'xiaomi')
        const model = await services.getSetting('ai_model', '')
        const baseUrl = await services.getSetting('ai_base_url', '')
        const apiKey = await services.getSetting('ai_api_key', '')
        
        if (!apiKey) {
          throw new Error('请先配置AI服务')
        }
        
        const url = `${baseUrl}/chat/completions`
        const messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${prompt}\n\n${text}` }
        ]
        
        const body = {
          model: model,
          temperature: 0.7,
          messages,
          stream: true,
        }
        
        const headers = { 'Content-Type': 'application/json' }
        if (apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`
        }
        
        const res = await fetchWithCors(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        })
        
        if (!res.ok) {
          throw new Error(`API 请求失败 (${res.status})`)
        }
        
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let content = ''
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim() !== '')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              
              try {
                const json = JSON.parse(data)
                const delta = json.choices?.[0]?.delta?.content || ''
                if (delta) {
                  content += delta
                  listeners.chunk.forEach(cb => cb(requestId, delta))
                }
              } catch (e) {
                // 解析失败，跳过
              }
            }
          }
        }
        
        listeners.done.forEach(cb => cb(requestId, content))
      } catch (err) {
        listeners.error.forEach(cb => cb(requestId, err.message))
      }
    },
    onChunk: (cb) => {
      listeners.chunk.push(cb)
      return () => {
        listeners.chunk = listeners.chunk.filter(fn => fn !== cb)
      }
    },
    onDone: (cb) => {
      listeners.done.push(cb)
      return () => {
        listeners.done = listeners.done.filter(fn => fn !== cb)
      }
    },
    onError: (cb) => {
      listeners.error.push(cb)
      return () => {
        listeners.error = listeners.error.filter(fn => fn !== cb)
      }
    }
  }
}

// AI调用辅助函数
async function callAI(config, prompt, text, systemPrompt = null) {
  let url = `${config.baseUrl}/chat/completions`
  
  const messages = []
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }
  messages.push({ role: 'user', content: `${prompt}\n\n${text}` })
  
  const body = {
    model: config.model,
    temperature: config.temperature || 0.7,
    messages,
    stream: false,
  }
  
  const bodyStr = JSON.stringify(body)
  
  const makeHeaders = (extra = {}) => {
    const h = { 'Content-Type': 'application/json', ...extra }
    if (config.apiKey) h['Authorization'] = `Bearer ${config.apiKey}`
    return h
  }
  
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 180 * 1000)
  
  // CORS代理列表
  const attempts = [
    // 直接调用（部分API支持CORS）
    { url, headers: makeHeaders() },
    // corsproxy.io
    { url: `https://corsproxy.io/?${encodeURIComponent(url)}`, headers: makeHeaders() },
    // thingproxy
    { url: `https://thingproxy.freeboard.io/fetch/${url}`, headers: makeHeaders() },
    // cors.sh
    { url: `https://cors.sh/${url}`, headers: makeHeaders({ 'x-cors-api-key': 'temp_key' }) },
  ]
  
  let lastError = null
  
  for (const attempt of attempts) {
    try {
      const res = await fetch(attempt.url, {
        method: 'POST',
        headers: attempt.headers,
        body: bodyStr,
        signal: controller.signal,
      })
      
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        let detail = ''
        try {
          const errJson = JSON.parse(errText)
          detail = errJson.error?.message || errJson.message || errText.slice(0, 300)
        } catch {
          detail = errText.slice(0, 300)
        }
        throw new Error(`API 请求失败 (${res.status}): ${detail}`)
      }
      
      const data = await res.json()
      clearTimeout(timer)
      return data.choices?.[0]?.message?.content || ''
    } catch (err) {
      lastError = err
      if (err.name === 'AbortError') break
      continue
    }
  }
  
  clearTimeout(timer)
  throw new Error('网页版无法直接调用AI API（CORS限制）。请使用桌面版的AI功能，或部署自己的后端代理。')
}