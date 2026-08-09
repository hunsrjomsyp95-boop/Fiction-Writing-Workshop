const { use } = require('./common')

function listTypoDict() {
  return use().prepare('SELECT * FROM typo_dict ORDER BY wrong').all()
}
function addTypo({ wrong, right, note = '', source = '用户' }) {
  use()
    .prepare('INSERT INTO typo_dict (wrong, right, note, source) VALUES (?, ?, ?, ?)')
    .run(wrong, right, note, source)
  return true
}
function updateTypo(id, patch) {
  const d = use()
  const cur = d.prepare('SELECT * FROM typo_dict WHERE id=?').get(id)
  if (!cur) return null
  const next = { ...cur, ...patch, id }
  d.prepare('UPDATE typo_dict SET wrong=?, right=?, note=? WHERE id=?').run(next.wrong, next.right, next.note, id)
  return d.prepare('SELECT * FROM typo_dict WHERE id=?').get(id)
}
function deleteTypo(id) {
  use().prepare('DELETE FROM typo_dict WHERE id=?').run(id)
  return true
}
function getTypoRecords(novelId, chapterId = null) {
  const d = use()
  if (chapterId)
    return d
      .prepare('SELECT * FROM typo_records WHERE novel_id=? AND chapter_id=? ORDER BY id DESC')
      .all(novelId, chapterId)
  return d.prepare('SELECT * FROM typo_records WHERE novel_id=? ORDER BY id DESC').all(novelId)
}
function clearTypoRecords(novelId, chapterId = null) {
  const d = use()
  if (chapterId) return d.prepare('DELETE FROM typo_records WHERE novel_id=? AND chapter_id=?').run(novelId, chapterId)
  return d.prepare('DELETE FROM typo_records WHERE novel_id=?').run(novelId)
}

module.exports = { listTypoDict, addTypo, updateTypo, deleteTypo, getTypoRecords, clearTypoRecords }
