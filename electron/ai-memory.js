const services = require('./services')

// 内存缓存：项目上下文
const contextCache = new Map() // novelId -> { data, timestamp, hash }
const CONTEXT_TTL = 5 * 60 * 1000 // 5 分钟缓存

// 获取项目上下文哈希（用于判断是否需要更新缓存）
function getContextHash(novelId) {
  const d = services.use()
  try {
    const counts = d.prepare(`
      SELECT
        (SELECT COUNT(*) FROM worlds WHERE novel_id = ?) as worlds,
        (SELECT COUNT(*) FROM characters WHERE novel_id = ?) as chars,
        (SELECT COUNT(*) FROM outlines WHERE novel_id = ?) as outlines,
        (SELECT COUNT(*) FROM timeline_events WHERE novel_id = ?) as timeline,
        (SELECT COUNT(*) FROM foreshadowings WHERE novel_id = ?) as fsh,
        (SELECT COUNT(*) FROM world_rules WHERE novel_id = ?) as rules
    `).get(novelId, novelId, novelId, novelId, novelId, novelId)
    return `${counts.worlds}-${counts.chars}-${counts.outlines}-${counts.timeline}-${counts.fsh}-${counts.rules}`
  } catch {
    return ''
  }
}

// 获取项目上下文（带缓存）
function getProjectContext(novelId) {
  const now = Date.now()
  const cached = contextCache.get(novelId)
  const currentHash = getContextHash(novelId)

  // 缓存有效且未过期
  if (cached && cached.hash === currentHash && (now - cached.timestamp) < CONTEXT_TTL) {
    return cached.data
  }

  // 重新构建上下文
  const context = buildProjectContext(novelId)
  contextCache.set(novelId, { data: context, timestamp: now, hash: currentHash })
  return context
}

// 构建项目上下文
function buildProjectContext(novelId) {
  const d = services.use()
  try {
    const worlds = d.prepare('SELECT name, content, category FROM worlds WHERE novel_id = ?').all(novelId)
    const chars = d.prepare('SELECT name, role, personality, background FROM characters WHERE novel_id = ?').all(novelId)
    const outlines = d.prepare('SELECT title, content FROM outlines WHERE novel_id = ?').all(novelId)
    const timeline = d.prepare('SELECT story_time, title FROM timeline_events WHERE novel_id = ? ORDER BY order_index').all(novelId)
    const fsh = d.prepare('SELECT title, status FROM foreshadowings WHERE novel_id = ?').all(novelId)
    const rules = d.prepare('SELECT era, type, item, content FROM world_rules WHERE novel_id = ?').all(novelId)

    const parts = []

    if (worlds.length) {
      const worldText = worlds.map(w => `${w.name}：${(w.content || '').slice(0, 120)}`).join('\n').slice(0, 8000)
      parts.push(`【世界观】\n${worldText}`)
    }

    if (chars.length) {
      const charText = chars.map(c => `${c.name}（${c.role}）：${(c.personality || c.background || '').slice(0, 100)}`).join('\n').slice(0, 5000)
      parts.push(`【人物】\n${charText}`)
    }

    if (outlines.length) {
      const outlineText = outlines.map(o => `${o.title}：${(o.content || '').slice(0, 100)}`).join('\n').slice(0, 4000)
      parts.push(`【大纲】\n${outlineText}`)
    }

    if (timeline.length) {
      const timeText = timeline.map(t => `${t.story_time || '?'} ${t.title}`).join('；').slice(0, 1500)
      parts.push(`【故事年表】\n${timeText}`)
    }

    if (fsh.length) {
      const fshText = fsh.map(f => `${f.title}(${f.status})`).join('、').slice(0, 1500)
      parts.push(`【伏笔状态】\n${fshText}`)
    }

    if (rules.length) {
      const ruleText = rules.map(r =>
        `${r.era}/${r.type === '史实' ? '史实' : '架空'}：${r.item}${r.content ? ' - ' + r.content.slice(0, 80) : ''}`
      ).join('\n').slice(0, 3000)
      parts.push(`【真实与幻想规则】\n${ruleText}`)
    }

    return parts.join('\n\n')
  } catch (e) {
    return ''
  }
}

// 获取对话历史（从数据库）
function getConversationHistory(novelId, limit = 20) {
  const d = services.use()
  try {
    return d.prepare(`
      SELECT role, content, model, tokens, created_at
      FROM ai_conversations
      WHERE novel_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(novelId, limit).reverse()
  } catch {
    return []
  }
}

// 添加对话到历史（持久化到数据库）
function addToHistory(novelId, role, content, model = '', tokens = 0) {
  const d = services.use()
  try {
    d.prepare(`
      INSERT INTO ai_conversations (novel_id, role, content, model, tokens)
      VALUES (?, ?, ?, ?, ?)
    `).run(novelId, role, content, model, tokens)

    // 清理旧记录，每个项目最多保留 100 条
    d.prepare(`
      DELETE FROM ai_conversations
      WHERE novel_id = ? AND id NOT IN (
        SELECT id FROM ai_conversations
        WHERE novel_id = ?
        ORDER BY created_at DESC
        LIMIT 100
      )
    `).run(novelId, novelId)
  } catch (e) {
    // 忽略写入错误
  }
}

// 清除对话历史
function clearHistory(novelId) {
  const d = services.use()
  try {
    d.prepare('DELETE FROM ai_conversations WHERE novel_id = ?').run(novelId)
  } catch (e) {
    // 忽略
  }
}

// 清除项目上下文缓存
function clearContextCache(novelId) {
  if (novelId) {
    contextCache.delete(novelId)
  } else {
    contextCache.clear()
  }
}

// 获取缓存统计
function getCacheStats() {
  const d = services.use()
  try {
    const convCount = d.prepare('SELECT COUNT(*) as count FROM ai_conversations').get()
    return {
      contextCacheSize: contextCache.size,
      totalConversations: convCount.count,
    }
  } catch {
    return {
      contextCacheSize: contextCache.size,
      totalConversations: 0,
    }
  }
}

// 获取对话历史用于 AI 上下文（格式化为 messages）
function getHistoryForContext(novelId, maxMessages = 10) {
  const history = getConversationHistory(novelId, maxMessages)
  return history.map(h => ({ role: h.role, content: h.content }))
}

module.exports = {
  getProjectContext,
  getConversationHistory,
  addToHistory,
  clearHistory,
  clearContextCache,
  getCacheStats,
  buildProjectContext,
  getHistoryForContext,
}
