const { contextBridge, ipcRenderer } = require('electron')

function makeApi(names) {
  const api = {}
  for (const [key, name] of Object.entries(names)) {
    api[key] = (...args) =>
      ipcRenderer.invoke(name, ...args).then((res) => {
        if (!res.ok) {
          const err = new Error(res.error)
          err.isIpcError = true
          throw err
        }
        return res.data
      })
  }
  return api
}

const names = {
  listNovels: 'novel:list',
  createNovel: 'novel:create',
  getNovel: 'novel:get',
  updateNovel: 'novel:update',
  deleteNovel: 'novel:delete',
  listChapters: 'chapter:list',
  getChapter: 'chapter:get',
  createChapter: 'chapter:create',
  updateChapter: 'chapter:update',
  deleteChapter: 'chapter:delete',
  batchDeleteChapters: 'chapter:batch-delete',
  batchUpdateChapters: 'chapter:batch-update',
  reorderChapters: 'chapter:reorder',
  listVersions: 'version:list',
  saveVersion: 'version:save',
  getVersionContent: 'version:get',
  clearVersions: 'version:clear',
  setVersionTag: 'version:tag',
  listOutlines: 'outline:list',
  createOutline: 'outline:create',
  updateOutline: 'outline:update',
  deleteOutline: 'outline:delete',
  listCharacters: 'character:list',
  createCharacter: 'character:create',
  updateCharacter: 'character:update',
  deleteCharacter: 'character:delete',
  updateCharactersOrder: 'character:update-order',
  characterAppearances: 'character:appearances',
  listWorlds: 'world:list',
  listWorldNames: 'world:names',
  createWorld: 'world:create',
  updateWorld: 'world:update',
  deleteWorld: 'world:delete',
  listMaterials: 'material:list',
  queryMaterials: 'material:query',
  getMaterialTypes: 'material:types',
  createMaterial: 'material:create',
  updateMaterial: 'material:update',
  deleteMaterial: 'material:delete',
  importDocxChapter: 'chapter:import:docx',
  importMaterial: 'material:import',
  batchImportMaterial: 'material:batchImport',
  exportMaterial: 'material:export',
  crawlMaterial: 'material:crawl',
  getSetting: 'setting:get',
  setSetting: 'setting:set',
  typoCheck: 'typo:check',
  typoApply: 'typo:apply',
  typoDictList: 'typo:dict:list',
  typoDictAdd: 'typo:dict:add',
  typoDictUpdate: 'typo:dict:update',
  typoDictDelete: 'typo:dict:delete',
  typoRecordsGet: 'typo:records:get',
  typoRecordsClear: 'typo:records:clear',
  aiGetConfig: 'ai:config:get',
  aiSaveConfig: 'ai:config:save',
  aiTest: 'ai:test',
  aiProofread: 'ai:proofread',
  aiAssistant: 'ai:assistant',
  aiAssistantWithSystem: 'ai:assistant:system',
  aiAnalyzeSettings: 'ai:analyze-settings',
  aiClassifyTo: 'ai:classify-to',
  aiExtractTerms: 'ai:extract-terms',
  aiGenerateMap: 'ai:generate-map',
  aiGenerateMapNodes: 'ai:generate-map-nodes',
  aiClassify: 'ai:classify',
  aiExtractEntities: 'ai:extract-entities',
  aiGetContext: 'ai:get-context',
  aiGetHistory: 'ai:get-history',
  aiAddHistory: 'ai:add-history',
  aiClearHistory: 'ai:clear-history',
  aiClearCache: 'ai:clear-cache',
  aiCacheStats: 'ai:cache-stats',
  aiHistoryContext: 'ai:history-context',
  listForeshadowings: 'foreshadow:list',
  createForeshadowing: 'foreshadow:create',
  updateForeshadowing: 'foreshadow:update',
  deleteForeshadowing: 'foreshadow:delete',
  listTimeline: 'timeline:list',
  createTimelineEvent: 'timeline:create',
  updateTimelineEvent: 'timeline:update',
  deleteTimelineEvent: 'timeline:delete',
  reorderTimeline: 'timeline:reorder',
  sortTimelineByStoryTime: 'timeline:sort',
  listRelations: 'relation:list',
  createRelation: 'relation:create',
  updateRelation: 'relation:update',
  deleteRelation: 'relation:delete',
  listItems: 'item:list',
  createItem: 'item:create',
  updateItem: 'item:update',
  deleteItem: 'item:delete',
  listMapViews: 'map:views',
  createMapView: 'map:view:create',
  updateMapView: 'map:view:update',
  deleteMapView: 'map:view:delete',
  listMapNodes: 'map:nodes',
  createMapNode: 'map:node:create',
  updateMapNode: 'map:node:update',
  deleteMapNode: 'map:node:delete',
  listMapEdges: 'map:edges',
  createMapEdge: 'map:edge:create',
  deleteMapEdge: 'map:edge:delete',
  listPrompts: 'prompt:list',
  createPrompt: 'prompt:create',
  updatePrompt: 'prompt:update',
  deletePrompt: 'prompt:delete',
  listWorldRules: 'rule:list',
  listRuleEras: 'rule:eras',
  getCustomRuleEras: 'rule:custom-eras',
  addCustomRuleEra: 'rule:add-era',
  createWorldRule: 'rule:create',
  updateWorldRule: 'rule:update',
  deleteWorldRule: 'rule:delete',
  getStats: 'stats:get',
  getAiUsage: 'usage:get',
  clearAiUsage: 'usage:clear',
  addTypingWords: 'typing:add',
  getTypingStats: 'typing:get',
  resetTypingSession: 'typing:reset',
  getWritingStreak: 'typing:streak',
  addFocusSession: 'focus:add',
  getFocusStats: 'focus:stats',
  authCheck: 'auth:check',
  authRegister: 'auth:register',
  authLogin: 'auth:login',
  authChangePassword: 'auth:change-password',
  authDisable: 'auth:disable',
  getShortcuts: 'shortcut:get',
  setShortcuts: 'shortcut:set',
  fullTextSearch: 'search:fulltext',
  replaceInChapters: 'search:replace',
  exportNovel: 'export:novel',
  importNovel: 'import:novel',
  importChapterFile: 'import:chapter-file',
  backupNovel: 'backup:novel',
  backupExportDb: 'backup:exportdb',
  backupImportDb: 'backup:importdb',
  autoBackup: 'backup:auto',
  pickFolder: 'folder:pick',
  searchWeb: 'search:web',
  searchConfigGet: 'search:config:get',
  searchConfigSave: 'search:config:save',
  formatText: 'format:text',
  exportNovelAsPdf: 'export:pdf',
  exportDocx: 'export:docx',
  exportChapterDocx: 'chapter:export:docx',
  dbCheck: 'db:check',
  dbRepair: 'db:repair',
}

contextBridge.exposeInMainWorld('api', makeApi(names))

contextBridge.exposeInMainWorld('events', {
  onAutoBackup: (cb) => ipcRenderer.on('backup:event', (_e, data) => cb(data)),
})

// 流式 AI 助手
contextBridge.exposeInMainWorld('aiStream', {
  assistant: (requestId, prompt, text) => {
    ipcRenderer.send('ai:assistant:stream', requestId, prompt, text)
  },
  assistantWithSystem: (requestId, systemPrompt, prompt, text) => {
    ipcRenderer.send('ai:assistant:system:stream', requestId, systemPrompt, prompt, text)
  },
  onChunk: (cb) => {
    const handler = (_e, requestId, chunk) => cb(requestId, chunk)
    ipcRenderer.on('ai:stream:chunk', handler)
    return () => ipcRenderer.removeListener('ai:stream:chunk', handler)
  },
  onDone: (cb) => {
    const handler = (_e, requestId, content) => cb(requestId, content)
    ipcRenderer.on('ai:stream:done', handler)
    return () => ipcRenderer.removeListener('ai:stream:done', handler)
  },
  onError: (cb) => {
    const handler = (_e, requestId, error) => cb(requestId, error)
    ipcRenderer.on('ai:stream:error', handler)
    return () => ipcRenderer.removeListener('ai:stream:error', handler)
  },
})
