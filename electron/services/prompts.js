const { use } = require('./common')

function listPrompts(novelId = null) {
  const d = use()
  let rows
  if (novelId)
    rows = d.prepare('SELECT * FROM prompts WHERE novel_id IS NULL OR novel_id=? ORDER BY category, name').all(novelId)
  else rows = d.prepare('SELECT * FROM prompts ORDER BY category, name').all()
  return rows.map((r) => {
    try {
      r.params = JSON.parse(r.params || '[]')
    } catch (e) {
      r.params = []
    }
    return r
  })
}
function createPrompt(novelId, patch = {}) {
  const d = use()
  const info = d
    .prepare(
      'INSERT INTO prompts (novel_id, name, category, system_prompt, user_prompt, params, builtin) VALUES (?, ?, ?, ?, ?, ?, 0)'
    )
    .run(
      novelId || null,
      patch.name || '新提示词',
      patch.category || '通用',
      patch.system_prompt || '',
      patch.user_prompt || '',
      JSON.stringify(patch.params || [])
    )
  return d.prepare('SELECT * FROM prompts WHERE id=?').get(info.lastInsertRowid)
}
function updatePrompt(id, patch) {
  const d = use()
  const cur = d.prepare('SELECT * FROM prompts WHERE id=?').get(id)
  if (!cur) return null
  const next = { ...cur, ...patch, id }
  d.prepare('UPDATE prompts SET name=?, category=?, system_prompt=?, user_prompt=?, params=? WHERE id=?').run(
    next.name,
    next.category,
    next.system_prompt,
    next.user_prompt,
    JSON.stringify(next.params || []),
    id
  )
  return d.prepare('SELECT * FROM prompts WHERE id=?').get(id)
}
function deletePrompt(id) {
  use().prepare('DELETE FROM prompts WHERE id=?').run(id)
  return true
}

module.exports = { listPrompts, createPrompt, updatePrompt, deletePrompt }
