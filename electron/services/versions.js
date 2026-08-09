const { use } = require('./common')

function listVersions(chapterId) {
  return use()
    .prepare(
      'SELECT id, version, change_summary, tag, created_at, length(content) AS size FROM chapter_versions WHERE chapter_id=? ORDER BY version DESC'
    )
    .all(chapterId)
}
function saveVersion(chapterId, content, changeSummary = '') {
  const d = use()
  const max = d
    .prepare('SELECT COALESCE(MAX(version), 0) AS m FROM chapter_versions WHERE chapter_id=?')
    .get(chapterId).m
  const info = d
    .prepare('INSERT INTO chapter_versions (chapter_id, version, content, change_summary) VALUES (?, ?, ?, ?)')
    .run(chapterId, max + 1, content, changeSummary)
  return d.prepare('SELECT * FROM chapter_versions WHERE id=?').get(info.lastInsertRowid)
}
function getVersionContent(id) {
  return use().prepare('SELECT content FROM chapter_versions WHERE id=?').get(id)
}
function deleteVersions(chapterId) {
  use().prepare('DELETE FROM chapter_versions WHERE chapter_id=?').run(chapterId)
  return true
}

function setVersionTag(id, tag) {
  use().prepare('UPDATE chapter_versions SET tag=? WHERE id=?').run(tag || '', id)
  return true
}

module.exports = { listVersions, saveVersion, getVersionContent, deleteVersions, setVersionTag }
