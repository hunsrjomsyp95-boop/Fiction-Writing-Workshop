const { use } = require('./common')

function listCharacters(novelId) {
  return use().prepare('SELECT * FROM characters WHERE novel_id=? ORDER BY order_index ASC, updated_at DESC').all(novelId)
}
function createCharacter(novelId, patch = {}) {
  const d = use()
  const maxOrder = d.prepare('SELECT COALESCE(MAX(order_index),0) as m FROM characters WHERE novel_id=?').get(novelId).m
  const info = d
    .prepare(
      `
    INSERT INTO characters (novel_id, name, alias, role, gender, age, appearance, personality, background, relationships, notes, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      patch.notes || '',
      maxOrder + 1
    )
  return d.prepare('SELECT * FROM characters WHERE id=?').get(info.lastInsertRowid)
}
function updateCharacter(id, patch) {
  const d = use()
  const cols = ['name', 'alias', 'role', 'gender', 'age', 'appearance', 'personality', 'background', 'relationships', 'notes', 'icon']
  const sets = []
  const vals = []
  for (const c of cols) {
    if (patch[c] !== undefined) {
      sets.push(`${c}=?`)
      vals.push(patch[c])
    }
  }
  if (sets.length === 0) return d.prepare('SELECT * FROM characters WHERE id=?').get(id)
  d.prepare(`UPDATE characters SET ${sets.join(',')}, updated_at=datetime('now','localtime') WHERE id=?`).run(...vals, id)
  return d.prepare('SELECT * FROM characters WHERE id=?').get(id)
}
function updateCharactersOrder(ids) {
  const d = use()
  const stmt = d.prepare('UPDATE characters SET order_index=? WHERE id=?')
  const tx = d.transaction((list) => {
    list.forEach((id, idx) => stmt.run(idx, id))
  })
  tx(ids)
  return true
}
function deleteCharacter(id) {
  use().prepare('DELETE FROM characters WHERE id=?').run(id)
  return true
}

module.exports = { listCharacters, createCharacter, updateCharacter, updateCharactersOrder, deleteCharacter }
