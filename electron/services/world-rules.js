const { use } = require('./common')
const { getSetting, setSetting } = require('./settings')

function listWorldRules(novelId, era = null) {
  const d = use()
  if (era)
    return d.prepare('SELECT * FROM world_rules WHERE novel_id=? AND era=? ORDER BY type DESC, item').all(novelId, era)
  return d.prepare('SELECT * FROM world_rules WHERE novel_id=? ORDER BY era, type DESC, item').all(novelId)
}
function listRuleEras(novelId) {
  return use()
    .prepare('SELECT DISTINCT era FROM world_rules WHERE novel_id=? ORDER BY era')
    .all(novelId)
    .map((r) => r.era)
}
function listCustomEras(novelId) {
  try {
    return JSON.parse(getSetting(`rule_eras:${novelId}`, '[]') || '[]')
  } catch (e) {
    return []
  }
}
function addCustomEra(novelId, name) {
  name = String(name || '').trim()
  if (!name) return listCustomEras(novelId)
  const list = listCustomEras(novelId)
  if (!list.includes(name)) {
    list.push(name)
    setSetting(`rule_eras:${novelId}`, JSON.stringify(list))
  }
  return list
}
function createWorldRule(novelId, patch = {}) {
  const d = use()
  const info = d
    .prepare('INSERT INTO world_rules (novel_id, era, item, type, content, verified) VALUES (?, ?, ?, ?, ?, ?)')
    .run(
      novelId,
      patch.era || '架空',
      patch.item || '新规则',
      patch.type || '史实',
      patch.content || '',
      patch.verified ? 1 : 0
    )
  return d.prepare('SELECT * FROM world_rules WHERE id=?').get(info.lastInsertRowid)
}
function updateWorldRule(id, patch) {
  const d = use()
  const cur = d.prepare('SELECT * FROM world_rules WHERE id=?').get(id)
  if (!cur) return null
  const next = { ...cur, ...patch, id }
  d.prepare(
    "UPDATE world_rules SET era=?, item=?, type=?, content=?, verified=?, updated_at=datetime('now','localtime') WHERE id=?"
  ).run(next.era, next.item, next.type, next.content, next.verified ? 1 : 0, id)
  return d.prepare('SELECT * FROM world_rules WHERE id=?').get(id)
}
function deleteWorldRule(id) {
  use().prepare('DELETE FROM world_rules WHERE id=?').run(id)
  return true
}

module.exports = {
  listWorldRules,
  listRuleEras,
  listCustomEras,
  addCustomEra,
  createWorldRule,
  updateWorldRule,
  deleteWorldRule,
}
