const { init, dbPath, replaceDb: _replaceDb } = require('../db')

let db
const stmtCache = new Map()

function use() {
  if (!db) db = init()
  return db
}

// 获取预编译语句（带缓存）
function prepare(sql) {
  const d = use()
  if (!stmtCache.has(sql)) {
    stmtCache.set(sql, d.prepare(sql))
  }
  return stmtCache.get(sql)
}

function replaceDb(newPath) {
  _replaceDb(newPath)
  db = null
  stmtCache.clear() // 清除缓存
  return use()
}

const countChars = (s) => (s || '').replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, '').length

function sanitize(name) {
  return (
    String(name || '')
      .replace(/[\\/:*?"<>|]/g, '_')
      .trim() || 'untitled'
  )
}

function cnToNum(s) {
  const digits = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }
  const units = { 十: 10, 百: 100, 千: 1000, 万: 10000 }
  let total = 0
  let section = 0
  let num = 0
  for (const ch of s) {
    if (ch in digits) num = digits[ch]
    else if (ch in units) {
      const u = units[ch]
      if (u === 10000) {
        section = (section + num) * u
        total += section
        section = 0
        num = 0
      } else {
        section += (num === 0 ? 1 : num) * u
        num = 0
      }
    }
  }
  return total + section + num
}

function parseStoryTimeValue(t) {
  const s = String(t || '')
  const arab = s.match(/\d+/)
  if (arab) return { v: parseFloat(arab[0]), has: true }
  const cn = s.match(/[零一二两三四五六七八九十百千万]+/g)
  if (cn) {
    let best = ''
    for (const c of cn) if (c.length > best.length) best = c
    return { v: cnToNum(best), has: true }
  }
  return { v: 0, has: false }
}

module.exports = { use, prepare, replaceDb, dbPath, countChars, sanitize, cnToNum, parseStoryTimeValue }
