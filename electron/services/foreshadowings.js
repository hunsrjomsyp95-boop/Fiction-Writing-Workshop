const { use } = require('./common')

const FORESHADOW_TYPES = [
  '普通',
  '契诃夫之枪',
  '预言暗示',
  '象征伏笔',
  '角色伏笔',
  '对话伏笔',
  '环境伏笔',
  '时间线伏笔',
  '红鲱鱼',
  '平行伏笔',
  '回调伏笔',
]

function listForeshadowings(novelId, status = null) {
  const d = use()
  if (status)
    return d
      .prepare(
        'SELECT f.*, c.title AS chapter_title FROM foreshadowings f LEFT JOIN chapters c ON c.id=f.chapter_id WHERE f.novel_id=? AND f.status=? ORDER BY f.updated_at DESC'
      )
      .all(novelId, status)
  return d
    .prepare(
      'SELECT f.*, c.title AS chapter_title FROM foreshadowings f LEFT JOIN chapters c ON c.id=f.chapter_id WHERE f.novel_id=? ORDER BY f.updated_at DESC'
    )
    .all(novelId)
}
function createForeshadowing(novelId, patch = {}) {
  const d = use()
  const info = d
    .prepare(
      'INSERT INTO foreshadowings (novel_id, title, type, status, chapter_id, setup_desc, call_desc, resolve_desc) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      novelId,
      patch.title || '未命名伏笔',
      patch.type || '普通',
      patch.status || '计划',
      patch.chapter_id || null,
      patch.setup_desc || '',
      patch.call_desc || '',
      patch.resolve_desc || ''
    )
  return d
    .prepare(
      'SELECT f.*, c.title AS chapter_title FROM foreshadowings f LEFT JOIN chapters c ON c.id=f.chapter_id WHERE f.id=?'
    )
    .get(info.lastInsertRowid)
}
function updateForeshadowing(id, patch) {
  const d = use()
  const cur = d.prepare('SELECT * FROM foreshadowings WHERE id=?').get(id)
  if (!cur) return null
  const next = { ...cur, ...patch, id }
  d.prepare(
    "UPDATE foreshadowings SET title=?, type=?, status=?, chapter_id=?, setup_desc=?, call_desc=?, resolve_desc=?, updated_at=datetime('now','localtime') WHERE id=?"
  ).run(next.title, next.type, next.status, next.chapter_id, next.setup_desc, next.call_desc, next.resolve_desc, id)
  return d
    .prepare(
      'SELECT f.*, c.title AS chapter_title FROM foreshadowings f LEFT JOIN chapters c ON c.id=f.chapter_id WHERE f.id=?'
    )
    .get(id)
}
function deleteForeshadowing(id) {
  use().prepare('DELETE FROM foreshadowings WHERE id=?').run(id)
  return true
}

module.exports = { FORESHADOW_TYPES, listForeshadowings, createForeshadowing, updateForeshadowing, deleteForeshadowing }
