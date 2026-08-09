const services = require('./services')

function getSearchConfig() {
  return {
    provider: services.getSetting('search_provider', 'google'),
    apiKey: services.getSetting('search_api_key', ''),
    engineId: services.getSetting('search_engine_id', ''),
  }
}

function saveSearchConfig(cfg) {
  services.setSetting('search_provider', (cfg.provider || 'google').trim())
  services.setSetting('search_api_key', (cfg.apiKey || '').trim())
  services.setSetting('search_engine_id', (cfg.engineId || '').trim())
  return true
}

async function webSearch(query, count = 5) {
  const cfg = getSearchConfig()
  if (!cfg.apiKey) throw new Error('未配置搜索 API Key，请在「AI 设置 - 联网搜索」中填写')
  if (cfg.provider === 'google' && !cfg.engineId)
    throw new Error('未配置搜索引擎 ID (cx)，请在「AI 设置 - 联网搜索」中填写')

  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('key', cfg.apiKey)
  url.searchParams.set('cx', cfg.engineId)
  url.searchParams.set('q', query)
  url.searchParams.set('num', String(Math.min(count, 10)))
  url.searchParams.set('lr', 'lang_zh-CN')
  url.searchParams.set('hl', 'zh-CN')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(url.toString(), { signal: controller.signal })
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`搜索请求失败 (${res.status}): ${errText.slice(0, 200)}`)
    }
    const data = await res.json()
    if (!data.items || !data.items.length) return []
    return data.items.map((item) => ({
      title: item.title || '',
      link: item.link || '',
      snippet: item.snippet || '',
    }))
  } finally {
    clearTimeout(timer)
  }
}

function formatSearchResults(results) {
  if (!results || !results.length) return '【联网搜索】未找到相关结果。'
  let text = '【联网搜索结果】\n\n'
  for (let i = 0; i < results.length; i++) {
    text += `${i + 1}. ${results[i].title}\n`
    text += `   链接：${results[i].link}\n`
    text += `   摘要：${results[i].snippet}\n\n`
  }
  return text
}

module.exports = { getSearchConfig, saveSearchConfig, webSearch, formatSearchResults }
