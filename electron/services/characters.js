const { use } = require('./common')

function listCharacters(novelId) {
  return use().prepare('SELECT * FROM characters WHERE novel_id=? ORDER BY updated_at DESC').all(novelId)
}
function createCharacter(novelId, patch = {}) {
  const d = use()
  const info = d
    .prepare(
      `
    INSERT INTO characters (novel_id, name, alias, role, gender, age, appearance, personality, background, relationships, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
    )
    .run(
      novelId,
      patch.name || '未命名',
      patch.alias || '',
      patch.role || '配角',
      patch.gender || '',
      patch.age || '',
      patch.appearance || '',
      patch.personality || '',
      patch.background || '',
      patch.relationships || '',
      patch.notes || ''
    )
  return d.prepare('SELECT * FROM characters WHERE id=?').get(info.lastInsertRowid)
}
function updateCharacter(id, patch) {
  const d = use()
  const cur = d.prepare('SELECT * FROM characters WHERE id=?').get(id)
  if (!cur) return null
  const next = { ...cur, ...patch, id }
  const cols = [
    'name',
    'alias',
    'role',
    'gender',
    'age',
    'appearance',
    'personality',
    'background',
    'relationships',
    'notes',
  ]
  const sets = cols.map((c) => `${c}=?`).join(',')
  d.prepare(`UPDATE characters SET ${sets}, updated_at=datetime('now','localtime') WHERE id=?`).run(
    cols.map((c) => next[c]).concat(id)
  )
  return d.prepare('SELECT * FROM characters WHERE id=?').get(id)
}
function deleteCharacter(id) {
  use().prepare('DELETE FROM characters WHERE id=?').run(id)
  return true
}

module.exports = { listCharacters, createCharacter, updateCharacter, deleteCharacter }
