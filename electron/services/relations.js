const { use } = require('./common')

function listRelations(novelId, charId = null) {
  const d = use()
  const base =
    'SELECT r.*, a.name AS char_a_name, b.name AS char_b_name FROM relations r LEFT JOIN characters a ON a.id=r.char_a_id LEFT JOIN characters b ON b.id=r.char_b_id'
  if (charId)
    return d
      .prepare(`${base} WHERE r.novel_id=? AND (r.char_a_id=? OR r.char_b_id=?) ORDER BY r.updated_at DESC`)
      .all(novelId, charId, charId)
  return d.prepare(`${base} WHERE r.novel_id=? ORDER BY r.updated_at DESC`).all(novelId)
}
function createRelation(novelId, patch = {}) {
  const d = use()
  if (!patch.char_a_id || !patch.char_b_id || patch.char_a_id === patch.char_b_id)
    throw new Error('关系需要两个不同的人物')
  const info = d
    .prepare(
      'INSERT INTO relations (novel_id, char_a_id, char_b_id, type, label, direction, description) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      novelId,
      patch.char_a_id,
      patch.char_b_id,
      patch.type || '认识',
      patch.label || '',
      patch.direction || '双向',
      patch.description || ''
    )
  return d
    .prepare(
      'SELECT r.*, a.name AS char_a_name, b.name AS char_b_name FROM relations r LEFT JOIN characters a ON a.id=r.char_a_id LEFT JOIN characters b ON b.id=r.char_b_id WHERE r.id=?'
    )
    .get(info.lastInsertRowid)
}
function updateRelation(id, patch) {
  const d = use()
  const cur = d.prepare('SELECT * FROM relations WHERE id=?').get(id)
  if (!cur) return null
  const next = { ...cur, ...patch, id }
  d.prepare(
    "UPDATE relations SET type=?, label=?, direction=?, description=?, updated_at=datetime('now','localtime') WHERE id=?"
  ).run(next.type, next.label, next.direction, next.description, id)
  return d
    .prepare(
      'SELECT r.*, a.name AS char_a_name, b.name AS char_b_name FROM relations r LEFT JOIN characters a ON a.id=r.char_a_id LEFT JOIN characters b ON b.id=r.char_b_id WHERE r.id=?'
    )
    .get(id)
}
function deleteRelation(id) {
  use().prepare('DELETE FROM relations WHERE id=?').run(id)
  return true
}

module.exports = { listRelations, createRelation, updateRelation, deleteRelation }
