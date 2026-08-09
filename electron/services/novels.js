const { use } = require('./common')

function listNovels() {
  return use().prepare('SELECT * FROM novels ORDER BY updated_at DESC').all()
}
function createNovel({ name, description = '', genre = '', target_words = 0 }) {
  const d = use()
  const info = d
    .prepare('INSERT INTO novels (name, description, genre, target_words) VALUES (?, ?, ?, ?)')
    .run(name, description, genre, target_words || 0)
  return d.prepare('SELECT * FROM novels WHERE id = ?').get(info.lastInsertRowid)
}
function getNovel(id) {
  return use().prepare('SELECT * FROM novels WHERE id = ?').get(id)
}
function updateNovel(id, patch) {
  const d = use()
  const cur = getNovel(id)
  if (!cur) return null
  const next = { ...cur, ...patch, id }
  d.prepare(
    "UPDATE novels SET name=?, description=?, genre=?, target_words=?, updated_at=datetime('now','localtime') WHERE id=?"
  ).run(next.name, next.description, next.genre, next.target_words || 0, id)
  return getNovel(id)
}
function deleteNovel(id) {
  use().prepare('DELETE FROM novels WHERE id=?').run(id)
  return true
}

module.exports = { listNovels, createNovel, getNovel, updateNovel, deleteNovel }
