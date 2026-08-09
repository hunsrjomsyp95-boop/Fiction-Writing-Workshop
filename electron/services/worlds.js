const { use } = require('./common')

function listWorlds(novelId, worldName = null) {
  const d = use()
  if (worldName)
    return d
      .prepare('SELECT * FROM worlds WHERE novel_id=? AND world_name=? ORDER BY category, name')
      .all(novelId, worldName)
  return d.prepare('SELECT * FROM worlds WHERE novel_id=? ORDER BY world_name, category, name').all(novelId)
}
function listWorldNames(novelId) {
  return use()
    .prepare('SELECT DISTINCT world_name FROM worlds WHERE novel_id=? ORDER BY world_name')
    .all(novelId)
    .map((r) => r.world_name)
}
function createWorld(novelId, patch = {}) {
  const d = use()
  const info = d
    .prepare('INSERT INTO worlds (novel_id, name, category, content, world_name) VALUES (?, ?, ?, ?, ?)')
    .run(novelId, patch.name || '未命名', patch.category || '其他', patch.content || '', patch.world_name || '主世界')
  return d.prepare('SELECT * FROM worlds WHERE id=?').get(info.lastInsertRowid)
}
function updateWorld(id, patch) {
  const d = use()
  const cur = d.prepare('SELECT * FROM worlds WHERE id=?').get(id)
  if (!cur) return null
  const next = { ...cur, ...patch, id }
  d.prepare(
    "UPDATE worlds SET name=?, category=?, content=?, world_name=?, updated_at=datetime('now','localtime') WHERE id=?"
  ).run(next.name, next.category, next.content, next.world_name || '主世界', id)
  return d.prepare('SELECT * FROM worlds WHERE id=?').get(id)
}
function deleteWorld(id) {
  use().prepare('DELETE FROM worlds WHERE id=?').run(id)
  return true
}

module.exports = { listWorlds, listWorldNames, createWorld, updateWorld, deleteWorld }
