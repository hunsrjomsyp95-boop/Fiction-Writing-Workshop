const { use } = require('./common')

function listOutlines(novelId) {
  return use().prepare('SELECT * FROM outlines WHERE novel_id=? ORDER BY order_index').all(novelId)
}
function createOutline(novelId, { title = '新大纲', content = '', parentId = null, type = '节点' }) {
  const d = use()
  const max = d.prepare('SELECT COALESCE(MAX(order_index), 0) AS m FROM outlines WHERE novel_id=?').get(novelId).m
  const info = d
    .prepare('INSERT INTO outlines (novel_id, parent_id, title, content, type, order_index) VALUES (?, ?, ?, ?, ?, ?)')
    .run(novelId, parentId, title, content, type, max + 1)
  return d.prepare('SELECT * FROM outlines WHERE id=?').get(info.lastInsertRowid)
}
function updateOutline(id, patch) {
  const d = use()
  const cur = d.prepare('SELECT * FROM outlines WHERE id=?').get(id)
  if (!cur) return null
  const next = { ...cur, ...patch, id }
  d.prepare(
    "UPDATE outlines SET title=?, content=?, type=?, order_index=?, updated_at=datetime('now','localtime') WHERE id=?"
  ).run(next.title, next.content, next.type, next.order_index, id)
  return d.prepare('SELECT * FROM outlines WHERE id=?').get(id)
}
function deleteOutline(id) {
  const d = use()
  d.prepare('DELETE FROM outlines WHERE id=? OR parent_id=?').run(id, id)
  return true
}

module.exports = { listOutlines, createOutline, updateOutline, deleteOutline }
