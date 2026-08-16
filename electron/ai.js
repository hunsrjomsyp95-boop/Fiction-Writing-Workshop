const services = require('./services')
const { getProviderById } = require('./ai-providers')
const memory = require('./ai-memory')

// 规范化 Base URL：去掉结尾斜杠、去掉误填的完整 /chat/completions 路径
function normalizeBaseUrl(url) {
  let u = String(url || '')
    .trim()
    .replace(/\/+$/, '')
  u = u.replace(/\/chat\/completions\/?$/i, '')
  return u
}

function getConfig() {
  const provider = services.getSetting('ai_provider', 'xiaomi')
  const providerDef = getProviderById(provider)
  const model = services.getSetting('ai_model', providerDef.models[0]?.id || '')

  // 优先使用服务商内置 URL，自定义模式用用户填写的
  let baseUrl
  if (provider === 'custom') {
    baseUrl = normalizeBaseUrl(services.getSetting('ai_base_url', ''))
  } else {
    baseUrl = providerDef.baseUrl
  }

  // 模型级别 URL 覆盖（如 MiMo Plan 用不同的 API 地址）
  const modelDef = providerDef.models.find((m) => m.id === model)
  if (modelDef?.baseUrl) {
    baseUrl = modelDef.baseUrl
  }

  return {
    provider,
    baseUrl,
    apiKey: services.getSetting('ai_api_key', ''),
    model,
    temperature: Number(services.getSetting('ai_temperature', '0.7')),
    noApiKey: providerDef.noApiKey || false,
  }
}

function saveConfig(cfg) {
  services.setSetting('ai_provider', cfg.provider || 'xiaomi')
  if (cfg.provider === 'custom') {
    services.setSetting('ai_base_url', normalizeBaseUrl(cfg.baseUrl))
  }
  services.setSetting('ai_api_key', (cfg.apiKey || '').trim())
  services.setSetting('ai_model', (cfg.model || '').trim())
  services.setSetting('ai_temperature', String(Number(cfg.temperature) || 0.7))
  return true
}

async function chat(messages, opts = {}) {
  const cfg = getConfig()
  if (!cfg.apiKey && !cfg.noApiKey && !opts.allowEmptyKey) {
    throw new Error('未配置 API Key，请先在「AI 设置」中填写')
  }

  const url = `${cfg.baseUrl}/chat/completions`
  const body = {
    model: opts.model || cfg.model,
    temperature: opts.temperature !== undefined ? opts.temperature : cfg.temperature,
    messages,
    stream: opts.stream || false,
  }
  if (opts.maxTokens) body.max_tokens = opts.maxTokens
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), (opts.timeout || 180) * 1000)
  const headers = { 'Content-Type': 'application/json' }
  if (cfg.apiKey) headers.Authorization = `Bearer ${cfg.apiKey}`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
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
    const content = data.choices?.[0]?.message?.content || ''
    if (data.usage) {
      try {
        services.logAiUsage({ model: data.model || opts.model || cfg.model, ...data.usage })
      } catch (e) {
        /* ignore */
      }
    }
    return { content, usage: data.usage, model: data.model }
  } finally {
    clearTimeout(timer)
  }
}

async function chatStream(messages, opts = {}) {
  const cfg = getConfig()
  if (!cfg.apiKey && !cfg.noApiKey && !opts.allowEmptyKey) {
    throw new Error('未配置 API Key，请先在「AI 设置」中填写')
  }

  const url = `${cfg.baseUrl}/chat/completions`
  const body = {
    model: opts.model || cfg.model,
    temperature: opts.temperature !== undefined ? opts.temperature : cfg.temperature,
    messages,
    stream: true,
  }
  if (opts.maxTokens) body.max_tokens = opts.maxTokens
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), (opts.timeout || 180) * 1000)
  const headers = { 'Content-Type': 'application/json' }
  if (cfg.apiKey) headers.Authorization = `Bearer ${cfg.apiKey}`

  const decoder = new TextDecoder()
  let buffer = ''
  let fullContent = ''

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
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

    const reader = res.body.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed === 'data: [DONE]') continue
        if (!trimmed.startsWith('data: ')) continue

        try {
          const json = JSON.parse(trimmed.slice(6))
          const delta = json.choices?.[0]?.delta?.content || ''
          if (delta) {
            fullContent += delta
            if (opts.onChunk) opts.onChunk(delta)
          }
        } catch {
          // ignore parse errors
        }
      }
    }

    return { content: fullContent }
  } finally {
    clearTimeout(timer)
  }
}

async function testConnection() {
  const cfg = getConfig()
  if (!cfg.baseUrl) throw new Error('未配置 API 地址，请先选择服务商')
  if (!cfg.model) throw new Error('未选择模型，请先选择模型')
  try {
    const res = await chat([{ role: 'user', content: '请回复：连接成功' }], { maxTokens: 16, timeout: 15 })
    return { ...res, model: cfg.model }
  } catch (e) {
    // 包装常见错误为更友好的提示
    const msg = e.message || String(e)
    if (msg.includes('fetch failed') || msg.includes('ECONNREFUSED') || msg.includes('ENOTFOUND')) {
      throw new Error(`无法连接到服务器 (${cfg.baseUrl})，请检查网络或 API 地址是否正确`)
    }
    if (msg.includes('401') || msg.includes('Unauthorized')) {
      throw new Error('API Key 无效或已过期，请检查 Key 是否正确')
    }
    if (msg.includes('403') || msg.includes('Forbidden')) {
      throw new Error('API Key 权限不足或账户余额不足')
    }
    if (msg.includes('404') || msg.includes('Not Found')) {
      throw new Error(`接口不存在 (${cfg.baseUrl}/chat/completions)，请检查 API 地址或模型名称`)
    }
    if (msg.includes('429') || msg.includes('Too Many Requests')) {
      throw new Error('请求过于频繁，请稍后再试')
    }
    if (msg.includes('500') || msg.includes('502') || msg.includes('503')) {
      throw new Error('服务商服务器错误，请稍后再试')
    }
    if (msg.includes('abort') || msg.includes('timeout')) {
      throw new Error('连接超时（15秒），请检查网络或服务商状态')
    }
    throw new Error(msg)
  }
}

// 获取缓存的项目上下文
function getCachedProjectContext(novelId) {
  return memory.getProjectContext(novelId)
}

// 获取对话历史
function getConversationHistory(novelId) {
  return memory.getConversationHistory(novelId)
}

// 添加对话到历史
function addToConversationHistory(novelId, role, content, model = '', tokens = 0) {
  memory.addToHistory(novelId, role, content, model, tokens)
}

// 获取格式化的对话历史用于 AI 上下文
function getHistoryForContext(novelId, maxMessages = 10) {
  return memory.getHistoryForContext(novelId, maxMessages)
}

// 清除对话历史
function clearConversationHistory(novelId) {
  memory.clearHistory(novelId)
}

// 清除上下文缓存
function clearContextCache(novelId) {
  memory.clearContextCache(novelId)
}

// 获取缓存统计
function getCacheStats() {
  return memory.getCacheStats()
}

// 错字错词 AI 校对
async function aiProofread(text) {
  const res = await chat(
    [
      {
        role: 'system',
        content:
          '你是一位严谨的中文文字校对专家。请找出用户文本中的错别字、错词、语病，只返回 JSON 数组，不要其他内容。数组元素格式：{"wrong":"原文错误片段","right":"正确写法","reason":"简要原因"}。如无问题返回空数组 []。',
      },
      { role: 'user', content: text.slice(0, 500000) },
    ],
    { temperature: 0.1, maxTokens: 4000 }
  )
  return parseAIList(res.content)
}

// 大纲/剧情 AI 辅助
async function aiAssistant(prompt, text = '') {
  const res = await chat(
    [
      {
        role: 'system',
        content: '你是资深的小说创作助手，擅长网文/出版小说的结构、人物、世界观设计，能给出具体可执行的建议。',
      },
      { role: 'user', content: prompt + (text ? `\n\n——以下是相关文本——\n${text.slice(0, 500000)}` : '') },
    ],
    { temperature: 0.8, maxTokens: 8192 }
  )
  return { content: res.content }
}

async function aiAssistantWithSystem(systemPrompt, prompt, text = '') {
  const res = await chat(
    [
      { role: 'system', content: systemPrompt || '你是资深的小说创作助手。' },
      { role: 'user', content: prompt + (text ? `\n\n——以下是相关文本——\n${text.slice(0, 500000)}` : '') },
    ],
    { temperature: 0.8, maxTokens: 8192 }
  )
  return { content: res.content }
}

async function aiAssistantStream(prompt, text = '', callbacks = {}) {
  const messages = [
    {
      role: 'system',
      content: '你是资深的小说创作助手，擅长网文/出版小说的结构、人物、世界观设计，能给出具体可执行的建议。',
    },
    { role: 'user', content: prompt + (text ? `\n\n——以下是相关文本——\n${text.slice(0, 500000)}` : '') },
  ]
  return await chatStream(messages, {
    temperature: 0.8,
    maxTokens: 8192,
    onChunk: callbacks.onChunk,
  })
}

async function aiAssistantWithSystemStream(systemPrompt, prompt, text = '', callbacks = {}) {
  const messages = [
    { role: 'system', content: systemPrompt || '你是资深的小说创作助手。' },
    { role: 'user', content: prompt + (text ? `\n\n——以下是相关文本——\n${text.slice(0, 500000)}` : '') },
  ]
  return await chatStream(messages, {
    temperature: 0.8,
    maxTokens: 8192,
    onChunk: callbacks.onChunk,
  })
}

// 资料自动分类（本地关键词 + AI 可选）
const TYPE_KEYWORDS = [
  { type: '灵感素材', keywords: ['灵感', '点子', '脑洞', '创意', '想法', '构思', '桥段', '素材', '梗'] },
  { type: '人物设定', keywords: ['人物', '角色', '主角', '配角', '反派', '性格', '外貌', '人设'] },
  {
    type: '世界观设定',
    keywords: [
      '世界观',
      '设定',
      '魔法',
      '体系',
      '规则',
      '地图',
      '地理',
      '历史',
      '王朝',
      '组织',
      '势力',
      '种族',
      '修炼',
      '境界',
    ],
  },
  { type: '剧情大纲', keywords: ['剧情', '大纲', '情节', '冲突', '高潮', '伏笔', '结局', '章节', '套路'] },
  { type: '考据资料', keywords: ['考据', '历史', '文化', '知识', '考究', '资料', '记载', '文献', '风俗'] },
  { type: '文笔词句', keywords: ['文笔', '词汇', '描写', '句子', '金句', '对话', '写法', '技巧'] },
]

function classifyLocal(text) {
  const scores = TYPE_KEYWORDS.map((t) => ({
    type: t.type,
    score: t.keywords.reduce((s, k) => s + (text.includes(k) ? 1 : 0), 0),
  })).sort((a, b) => b.score - a.score)
  if (scores[0].score > 0) return scores[0].type
  return '未分类'
}

async function classifyMaterialAI(text) {
  const res = await chat(
    [
      {
        role: 'system',
        content: `你是资料分类助手。请将以下创作资料归类到这些类型之一：${TYPE_KEYWORDS.map((t) => t.type).join('、')}。只返回类型名称，不要其他文字。`,
      },
      { role: 'user', content: text.slice(0, 500000) },
    ],
    { temperature: 0, maxTokens: 20 }
  )
  const t = res.content.trim()
  return TYPE_KEYWORDS.some((x) => x.type === t) ? t : '未分类'
}

// 通用：把内容归类到指定的分类集合之一，返回分类名
async function aiClassifyTo(text, categories) {
  const list = Array.isArray(categories) ? categories : String(categories || '').split('|')
  if (!list.length) return ''
  const res = await chat(
    [
      {
        role: 'system',
        content: `你是设定分类助手。请把以下内容归类到这些类别之一（只选一个，且只返回类别名称）：${list.join('、')}`,
      },
      { role: 'user', content: text.slice(0, 500000) },
    ],
    { temperature: 0, maxTokens: 30 }
  )
  const t = String(res.content || '').trim()
  return list.find((x) => x === t) || list[0]
}

// 词条拆分提取：把设定文本拆成结构化词条，供写入设定库
async function aiExtractTerms(text) {
  const res = await chat(
    [
      {
        role: 'system',
        content:
          '你是世界设定整理专家。请把以下设定文本拆解为若干独立的设定词条，每个词条要精简、可独立成条。只返回 JSON，不要其他文字。格式：{"items":[{"title":"词条名","category":"地理/历史/势力组织/魔法修炼体系/政治制度/文化习俗/科技物品/神祇信仰/种族/人物/事件/其他","content":"词条内容（100字以内，提炼要点）"}]}',
      },
      { role: 'user', content: text.slice(0, 500000) },
    ],
    { temperature: 0.2, maxTokens: 8192 }
  )
  const parsed = parseAIList(res.content)
  if (parsed.length) {
    return parsed
      .filter((it) => it.title)
      .map((it) => ({
        title: it.title,
        category: it.category || '其他',
        content: it.content || '',
      }))
  }
  return []
}

// AI 生成世界地图节点数据
async function aiGenerateMapNodes(text) {
  try {
    const res = await chat(
      [
        {
          role: 'system',
          content: `你是一位奇幻世界地图设计师。根据给定的地点信息，生成地图节点和连线数据。
只输出 JSON，不要任何说明文字。
格式：
{
  "nodes": [
    {"name": "地点名", "icon": "mountain|building|home|waves|tree", "color": "#hex", "note": "简短描述"}
  ],
  "edges": [
    {"from": "地点A", "to": "地点B", "label": "关系"}
  ]
}
规则：
- icon 选最匹配的：mountain=山/山脉 building=城市/国家 home=村庄/门派 waves=河流/海洋 tree=森林
- color 用深色系：大陆#f59e0b 城市#22c55e 村庄#ec4899 河流#5ba3ff 森林#14b8a6 山脉#94a3b8
- 边表示地理相邻或包含关系
- 最多 15 个节点
- 如果输入中没有明确的地点信息，根据内容推断可能的地点`,
        },
        { role: 'user', content: text.slice(0, 500000) },
      ],
      { temperature: 0.4, maxTokens: 2000 }
    )
    const raw = res.content || ''
    let jsonStr = ''
    // 尝试从 markdown 代码块提取
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenced) {
      jsonStr = fenced[1].trim()
    } else {
      // 尝试匹配 JSON 对象（支持嵌套）
      const match = raw.match(/\{[\s\S]*\}/)
      jsonStr = match ? match[0] : ''
    }
    if (!jsonStr) {
      throw new Error('AI 返回的内容无法解析为 JSON，请检查世界设定中是否有地理信息')
    }
    let json
    try {
      json = JSON.parse(jsonStr)
    } catch (parseErr) {
      throw new Error('JSON 解析失败，请检查世界设定中是否有地理信息')
    }
    if (!json.nodes?.length) {
      throw new Error('AI 未返回有效的地点数据，请确保世界设定中有地理条目')
    }
    return json
  } catch (e) {
    const msg = e.message || '未知错误'
    if (msg.includes('未配置') || msg.includes('API Key')) {
      throw new Error('请先在「设置 → AI 设置」中配置 AI 服务商和 API Key')
    }
    throw new Error(`AI 生成失败：${msg}`)
  }
}

// AI 生成世界地图 SVG
async function aiGenerateMap(text) {
  try {
    const res = await chat(
      [
        {
          role: 'system',
          content:
            '你是一位专业的奇幻世界地图设计师。根据给定的地点信息生成一段 SVG 代码可视化世界地图。要求：1. 只输出一段完整 SVG，不要任何说明文字；2. SVG 尺寸 width="800" height="500"；3. 背景深色 #0f172a，奇幻风格；4. 每个地点用圆形+标签，按地理逻辑分布；5. 用颜色区分地点类型（大陆#f59e0b 国家#6366f1 城市#22c55e 门派#ec4899 秘境#a78bfa 遗迹#94a3b8 战场#ef4444 自然#14b8a6 建筑#60a5fa 其他#94a3b8）；6. 添加边框和图例；7. 文字用 font-family="PingFang SC, Microsoft YaHei, sans-serif"。',
        },
        { role: 'user', content: text.slice(0, 500000) },
      ],
      { temperature: 0.4, maxTokens: 4000 }
    )
    return extractSvg(res.content)
  } catch (e) {
    const msg = e.message || '未知错误'
    if (msg.includes('未配置') || msg.includes('API Key')) {
      throw new Error('请先在「设置 → AI 设置」中配置 AI 服务商和 API Key')
    }
    if (msg.includes('Ollama') || msg.includes('ollama')) {
      throw new Error('本地模型启动失败，请确保 Ollama 已安装并运行')
    }
    throw new Error(`AI 生成失败：${msg}`)
  }
}

function extractSvg(content) {
  const m = String(content || '').match(/<svg[\s\S]*?<\/svg>/i)
  if (m) return m[0]
  const fenced = String(content || '').match(/```(?:svg|html)?\s*([\s\S]*?)```/i)
  if (fenced) {
    const inner = fenced[1].match(/<svg[\s\S]*?<\/svg>/i)
    if (inner) return inner[0]
  }
  return String(content || '').trim()
}

function parseAIList(content) {
  try {
    const cleaned = content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()
    const arr = JSON.parse(cleaned)
    if (Array.isArray(arr)) return arr
    const m = cleaned.match(/\[[\s\S]*\]/)
    if (m) return JSON.parse(m[0])
    return []
  } catch (e) {
    return []
  }
}

// 设定详细分类体系
const SETTING_CATEGORIES = [
  '世界核心',
  '世界结构',
  '地理地貌',
  '气候环境',
  '自然资源',
  '历史纪年',
  '重大事件',
  '势力组织',
  '种族民族',
  '力量体系',
  '神明信仰',
  '政治制度',
  '经济体系',
  '社会文化',
  '科技器物',
  '人物角色',
  '剧情主线',
  '地点场景',
  '物品道具',
  '规则禁忌',
  '其他',
]

// 把用户写在设定里的内容交给 AI 做详细分类分析
async function aiAnalyzeSettings(text) {
  const res = await chat(
    [
      {
        role: 'system',
        content: `你是一位资深的世界观设定分析师。请把用户提供的设定内容拆解为若干条独立的设定条目，并为每条做详细分类。
分类必须且只能从以下类别中选择一个：${SETTING_CATEGORIES.join('、')}。
只返回 JSON，不要任何其他文字。格式：{"items":[{"title":"条目名称","category":"分类名","summary":"一句话摘要","key_points":["要点1","要点2"],"source":"如果该条源自具体某条设定，填来源名称，否则留空"}]}
要求：拆分要细而全，同一内容不要重复拆分；summary 不超过30字。`,
      },
      { role: 'user', content: text.slice(0, 500000) },
    ],
    { temperature: 0.2, maxTokens: 8192 }
  )
  const parsed = parseAIList(res.content)
  if (parsed.length) {
    return {
      items: parsed
        .filter((it) => it.title)
        .map((it) => ({
          title: it.title,
          category: SETTING_CATEGORIES.includes(it.category) ? it.category : '其他',
          summary: it.summary || '',
          key_points: Array.isArray(it.key_points) ? it.key_points : [],
          source: it.source || '',
        })),
    }
  }
  // 兜底：尝试解析对象形式
  try {
    const cleaned = res.content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()
    const obj = JSON.parse(cleaned)
    if (obj && Array.isArray(obj.items)) {
      return { items: obj.items.filter((it) => it.title) }
    }
  } catch (e) {
    /* ignore */
  }
  return { items: [], raw: res.content }
}

// AI 实体提取：从任意文本中提取人物/世界观/物品/年表事件/伏笔
async function aiExtractEntities(text) {
  const res = await chat(
    [
      {
        role: 'system',
        content: `你是一位资深的小说内容分析专家，擅长从文本中提取所有有价值的信息。请仔细分析用户提供的文本，尽可能完整地提取其中的所有设定元素。

只返回 JSON，不要任何其他文字。
输出格式：
{
  "characters": [
    {
      "name": "角色名（必填）",
      "alias": "别名/外号/称号，没有则留空",
      "role": "主角/重要配角/配角/反派/龙套/未定",
      "gender": "男/女/未知",
      "age": "年龄或年龄段，没有则留空",
      "appearance": "外貌描述，包括身高、体型、发型、面容、穿着等所有可见特征，越详细越好",
      "personality": "性格特点，包括优点、缺点、习惯、说话方式、行为模式等",
      "background": "背景故事，包括出身、经历、动机、目标、秘密等",
      "relationships": "与其他角色的关系，格式如：张三(师徒)、李四(恋人)、王五(宿敌)",
      "notes": "其他重要信息，如特殊能力、持有物品、所属势力、口头禅等"
    }
  ],
  "worlds": [
    {
      "name": "设定名称（必填）",
      "category": "地理/历史/势力组织/魔法修炼体系/政治制度/文化习俗/科技物品/神祇信仰/种族/事件/其他",
      "content": "详细的设定内容，包括规则、特征、历史、现状等，尽可能完整"
    }
  ],
  "items": [
    {
      "name": "物品/道具/地点名称（必填）",
      "category": "物品/道具/关键地点/武器/防具/丹药/功法秘籍/状态/其他",
      "description": "详细描述，包括外观、功能、来历、使用条件等",
      "location": "所在位置或持有者，没有则留空",
      "importance": "普通/重要/稀有/绝世"
    }
  ],
  "events": [
    {
      "title": "事件名称（必填）",
      "story_time": "故事内时间，如：开元三年春、2024年、上古时期等",
      "description": "事件的详细描述，包括起因、经过、结果",
      "location": "发生地点，没有则留空",
      "status": "进行中/已完成/未来/历史/旁支"
    }
  ],
  "foreshadowings": [
    {
      "title": "伏笔名称（必填）",
      "type": "普通/重要/核心",
      "setup_desc": "伏笔的铺设描述，即在文中如何埋下的",
      "call_desc": "伏笔的呼应描述，即如何被提及或暗示的，没有则留空",
      "resolve_desc": "伏笔的回收描述，即如何揭晓的，没有则留空",
      "status": "计划/已埋/已呼/已回/已废"
    }
  ]
}

提取要求：
1. 尽可能完整提取，不要遗漏任何有价值的信息
2. 如果文本中提到了多个名字但没有明确说明是同一人，分别提取
3. 人物关系要提取所有明确提到的关系
4. 世界观设定要提取所有提到的规则、体系、地理等
5. 物品要提取所有提到的道具、武器、地点等
6. 伏笔要提取所有悬念、暗示、未解之谜
7. 如果某个字段在文本中没有提到，留空字符串""，不要编造
8. 如果某类没有提取到，返回空数组 []
9. 角色名、设定名等必须与原文一致，不要修改`,
      },
      { role: 'user', content: text.slice(0, 500000) },
    ],
    { temperature: 0.1, maxTokens: 16384 }
  )

  // 尝试解析 JSON 对象
  try {
    const cleaned = res.content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()
    const obj = JSON.parse(cleaned)
    if (obj && typeof obj === 'object') {
      return {
        characters: Array.isArray(obj.characters) ? obj.characters.filter((c) => c.name) : [],
        worlds: Array.isArray(obj.worlds) ? obj.worlds.filter((w) => w.name) : [],
        items: Array.isArray(obj.items) ? obj.items.filter((i) => i.name) : [],
        events: Array.isArray(obj.events) ? obj.events.filter((e) => e.title) : [],
        foreshadowings: Array.isArray(obj.foreshadowings) ? obj.foreshadowings.filter((f) => f.title) : [],
      }
    }
  } catch (e) {
    /* ignore */
  }

  // 兜底：尝试数组形式（旧格式兼容）
  const arr = parseAIList(res.content)
  if (arr.length) {
    return {
      items: arr
        .filter((i) => i.title || i.name)
        .map((i) => ({ name: i.name || i.title, description: i.content || i.description || '' })),
    }
  }
  return { characters: [], worlds: [], items: [], events: [], foreshadowings: [] }
}

async function aiFilterContent(content, topic) {
  const res = await chat(
    [
      {
        role: 'system',
        content:
          '你是一位资料筛选助手。用户正在搜集创作资料，他会提供一个感兴趣的主题，以及一段爬取到的网页内容。请判断这段内容是否与主题相关、有参考价值。只返回 JSON，不要其他文字。格式：{"relevant": true/false, "reason": "简要理由", "confidence": "high/medium/low"}',
      },
      { role: 'user', content: `主题：${topic}\n\n网页内容：\n${(content || '').slice(0, 100000)}` },
    ],
    { temperature: 0, maxTokens: 300 }
  )
  try {
    const cleaned = res.content
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()
    return JSON.parse(cleaned)
  } catch {
    return { relevant: true, reason: 'AI 分析失败，默认保留', confidence: 'low' }
  }
}

module.exports = {
  getConfig,
  saveConfig,
  chat,
  chatStream,
  testConnection,
  aiProofread,
  aiAssistant,
  aiAssistantWithSystem,
  aiAssistantStream,
  aiAssistantWithSystemStream,
  classifyMaterialAI,
  classifyLocal,
  aiAnalyzeSettings,
  SETTING_CATEGORIES,
  normalizeBaseUrl,
  aiClassifyTo,
  aiExtractTerms,
  aiGenerateMap,
  aiGenerateMapNodes,
  aiExtractEntities,
  aiFilterContent,
  getCachedProjectContext,
  getConversationHistory,
  addToConversationHistory,
  clearConversationHistory,
  clearContextCache,
  getCacheStats,
  getHistoryForContext,
}
