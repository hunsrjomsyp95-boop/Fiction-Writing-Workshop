const { use } = require('./common')

function listMaterials(novelId, type = null) {
  const d = use()
  if (type)
    return d.prepare('SELECT * FROM materials WHERE novel_id=? AND type=? ORDER BY updated_at DESC').all(novelId, type)
  return d.prepare('SELECT * FROM materials WHERE novel_id=? ORDER BY updated_at DESC').all(novelId)
}
function queryMaterials(novelId, keyword = '', type = null) {
  const d = use()
  const like = `%${keyword}%`
  let sql = 'SELECT * FROM materials WHERE novel_id=?'
  const args = [novelId]
  if (type) {
    sql += ' AND type=?'
    args.push(type)
  }
  if (keyword) {
    sql += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ? OR source LIKE ?)'
    args.push(like, like, like, like)
  }
  sql += ' ORDER BY updated_at DESC'
  return d.prepare(sql).all(...args)
}
function getMaterialById(id) {
  return use().prepare('SELECT * FROM materials WHERE id=?').get(id)
}
function getMaterialTypes(novelId) {
  return use()
    .prepare('SELECT DISTINCT type FROM materials WHERE novel_id=? ORDER BY type')
    .all(novelId)
    .map((r) => r.type)
}
function createMaterial(novelId, patch = {}) {
  const d = use()
  const info = d
    .prepare('INSERT INTO materials (novel_id, title, type, content, source, tags) VALUES (?, ?, ?, ?, ?, ?)')
    .run(
      novelId,
      patch.title || '未命名资料',
      patch.type || '未分类',
      patch.content || '',
      patch.source || '',
      patch.tags || ''
    )
  return d.prepare('SELECT * FROM materials WHERE id=?').get(info.lastInsertRowid)
}
function updateMaterial(id, patch) {
  const d = use()
  const cur = d.prepare('SELECT * FROM materials WHERE id=?').get(id)
  if (!cur) return null
  const next = { ...cur, ...patch, id }
  d.prepare(
    "UPDATE materials SET title=?, type=?, content=?, source=?, tags=?, updated_at=datetime('now','localtime') WHERE id=?"
  ).run(next.title, next.type, next.content, next.source, next.tags, id)
  return d.prepare('SELECT * FROM materials WHERE id=?').get(id)
}
function deleteMaterial(id) {
  use().prepare('DELETE FROM materials WHERE id=?').run(id)
  return true
}

module.exports = {
  listMaterials,
  queryMaterials,
  getMaterialById,
  getMaterialTypes,
  createMaterial,
  updateMaterial,
  deleteMaterial,
}
