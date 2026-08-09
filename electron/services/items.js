const { use } = require('./common')

function listItems(novelId, category = null) {
  const d = use()
  if (category)
    return d
      .prepare(
        'SELECT i.*, c.name AS owner_name FROM items i LEFT JOIN characters c ON c.id=i.owner_id WHERE i.novel_id=? AND i.category=? ORDER BY i.updated_at DESC'
      )
      .all(novelId, category)
  return d
    .prepare(
      'SELECT i.*, c.name AS owner_name FROM items i LEFT JOIN characters c ON c.id=i.owner_id WHERE i.novel_id=? ORDER BY i.category, i.updated_at DESC'
    )
    .all(novelId)
}
function createItem(novelId, patch = {}) {
  const d = use()
  const info = d
    .prepare(
      'INSERT INTO items (novel_id, name, category, description, owner_id, location, importance, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      novelId,
      patch.name || '未命名',
      patch.category || '物品',
      patch.description || '',
      patch.owner_id || null,
      patch.location || '',
      patch.importance || '普通',
      patch.tags || ''
    )
  return d
    .prepare('SELECT i.*, c.name AS owner_name FROM items i LEFT JOIN characters c ON c.id=i.owner_id WHERE i.id=?')
    .get(info.lastInsertRowid)
}
function updateItem(id, patch) {
  const d = use()
  const cur = d.prepare('SELECT * FROM items WHERE id=?').get(id)
  if (!cur) return null
  const next = { ...cur, ...patch, id }
  d.prepare(
    "UPDATE items SET name=?, category=?, description=?, owner_id=?, location=?, importance=?, tags=?, updated_at=datetime('now','localtime') WHERE id=?"
  ).run(next.name, next.category, next.description, next.owner_id, next.location, next.importance, next.tags, id)
  return d
    .prepare('SELECT i.*, c.name AS owner_name FROM items i LEFT JOIN characters c ON c.id=i.owner_id WHERE i.id=?')
    .get(id)
}
function deleteItem(id) {
  use().prepare('DELETE FROM items WHERE id=?').run(id)
  return true
}

module.exports = { listItems, createItem, updateItem, deleteItem }
