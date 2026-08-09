const services = require('./services')

// 用词典做错字错词匹配
function dictCheck(text) {
  const dict = services.listTypoDict()
  const results = []
  for (const item of dict) {
    if (!item.wrong) continue
    let idx = 0
    for (;;) {
      const pos = text.indexOf(item.wrong, idx)
      if (pos === -1) break
      results.push({
        kind: 'dictionary',
        wrong: item.wrong,
        right: item.right,
        note: item.note,
        start: pos,
        end: pos + item.wrong.length,
        source: item.source,
      })
      idx = pos + item.wrong.length
    }
  }
  return results
}

// 词频统计：找出文中出现频率过高、可能用错的关键字/词
function frequencyCheck(text, top = 30) {
  const cleaned = text.replace(/[\s\n\r\d\w\p{P}\p{S}]/gu, '')
  if (!cleaned) return []
  const freq = {}
  const samples = {}
  for (const ch of cleaned) {
    freq[ch] = (freq[ch] || 0) + 1
    if (!samples[ch]) samples[ch] = text.indexOf(ch)
  }
  const total = cleaned.length
  const sorted = Object.keys(freq)
    .map((ch) => ({ ch, count: freq[ch], rate: freq[ch] / total, sample: samples[ch] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, top)
  return sorted
}

// 常见高频功能字是否被误用（极简启发式，供参考）
function patternCheck(text) {
  const issues = []
  const rules = [
    [/在\s*次|再\s*来/g, '在/再使用需检查'],
    [/做为/g, '“做为”应为“作为”'],
    [/必需/g, '“必需”通常应为“必须”（作副词）'],
  ]
  for (const [re, note] of rules) {
    let m
    const g = new RegExp(re.source, 'g')
    while ((m = g.exec(text)) !== null) {
      issues.push({
        kind: 'pattern',
        wrong: m[0],
        right: note.includes('做为') ? '作为' : note.includes('必需') ? '必须' : '',
        note,
        start: m.index,
        end: m.index + m[0].length,
        source: '启发式',
      })
    }
  }
  return issues
}

function runCheck(text, options = {}) {
  const dict = dictCheck(text)
  const patterns = patternCheck(text)
  const freq = options.includeFrequency ? frequencyCheck(text, options.top || 30) : []
  const merged = dict.concat(patterns).sort((a, b) => a.start - b.start || a.end - b.end)
  return { issues: merged, frequency: freq }
}

// 应用到文本：把范围内的错误替换为正确值
function applyFix(text, issues) {
  const sorted = [...issues].filter((i) => i.wrong && i.right).sort((a, b) => b.start - a.start)
  let out = text
  let count = 0
  for (const item of sorted) {
    if (item.start < 0 || item.end > out.length || item.start > item.end) continue
    const seg = out.slice(item.start, item.end)
    if (seg !== item.wrong) continue
    out = out.slice(0, item.start) + item.right + out.slice(item.end)
    count++
  }
  return { text: out, count }
}

module.exports = { runCheck, applyFix, frequencyCheck, patternCheck }
