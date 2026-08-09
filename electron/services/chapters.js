const { use, countChars } = require('./common')

function listChapters(novelId) {
  return use().prepare('SELECT * FROM chapters WHERE novel_id=? ORDER BY order_index').all(novelId)
}
function getChapter(id) {
  return use().prepare('SELECT * FROM chapters WHERE id=?').get(id)
}
async function importDocxAsChapter(novelId, filePath) {
  const path = require('path')
  const mammoth = require('mammoth')
  const result = await mammoth.extractRawText({ path: filePath })
  const title = path.basename(filePath, path.extname(filePath))
  return createChapter(novelId, { title, content: result.value })
}
function createChapter(novelId, { title = '新章节', content = '' } = {}) {
  const d = use()
  const max = d.prepare('SELECT COALESCE(MAX(order_index), 0) AS m FROM chapters WHERE novel_id=?').get(novelId).m
  const info = d
    .prepare('INSERT INTO chapters (novel_id, title, content, order_index, word_count) VALUES (?, ?, ?, ?, ?)')
    .run(novelId, title, content, max + 1, countChars(content))
  return getChapter(info.lastInsertRowid)
}
function updateChapter(id, patch) {
  const d = use()
  const cur = getChapter(id)
  if (!cur) return null
  const content = patch.content !== undefined ? patch.content : cur.content
  const next = { ...cur, ...patch, id, content, word_count: countChars(content) }
  const cols = ['title', 'content', 'order_index', 'status', 'summary', 'scene', 'notes', 'word_count']
  const sets = cols.map((c) => `${c}=?`).join(',')
  d.prepare(`UPDATE chapters SET ${sets}, updated_at=datetime('now','localtime') WHERE id=?`).run(
    next.title,
    next.content,
    next.order_index,
    next.status,
    next.summary,
    next.scene || '',
    next.notes || '',
    next.word_count,
    id
  )
  if (patch.content !== undefined && patch.content !== cur.content) {
    logWords(novelIdOfChapter(id), next.word_count)
  }
  return getChapter(id)
}
function novelIdOfChapter(chapterId) {
  const r = use().prepare('SELECT novel_id FROM chapters WHERE id=?').get(chapterId)
  return r ? r.novel_id : null
}
function logWords(novelId, words) {
  if (!novelId) return
  const day = new Date().toISOString().slice(0, 10)
  use()
    .prepare(
      `INSERT INTO word_log (novel_id, day, words) VALUES (?, ?, ?)
    ON CONFLICT(novel_id, day) DO UPDATE SET words = MAX(word_log.words, excluded.words)`
    )
    .run(novelId, day, words)
}
function deleteChapter(id) {
  use().prepare('DELETE FROM chapters WHERE id=?').run(id)
  use().prepare('DELETE FROM chapter_versions WHERE chapter_id=?').run(id)
  return true
}
function batchDeleteChapters(ids) {
  const d = use()
  const tx = d.transaction(() => {
    const delCh = d.prepare('DELETE FROM chapters WHERE id=?')
    const delVer = d.prepare('DELETE FROM chapter_versions WHERE chapter_id=?')
    for (const id of ids) {
      delCh.run(id)
      delVer.run(id)
    }
  })
  tx()
  return true
}
function batchUpdateChapters(ids, patch) {
  const d = use()
  const validCols = ['title', 'status', 'summary', 'scene', 'notes']
  const sets = validCols.filter((c) => patch[c] !== undefined)
  if (!sets.length) return false
  const setClause = sets.map((c) => `${c}=?`).join(',')
  const st = d.prepare(`UPDATE chapters SET ${setClause}, updated_at=datetime('now','localtime') WHERE id=?`)
  const tx = d.transaction(() => {
    for (const id of ids) st.run(...sets.map((c) => patch[c]), id)
  })
  tx()
  return true
}
function reorderChapters(novelId, ids) {
  const d = use()
  const st = d.prepare('UPDATE chapters SET order_index=? WHERE id=? AND novel_id=?')
  const tx = d.transaction(() => {
    ids.forEach((id, i) => st.run(i + 1, id, novelId))
  })
  tx()
  return listChapters(novelId)
}

module.exports = {
  listChapters,
  getChapter,
  importDocxAsChapter,
  createChapter,
  updateChapter,
  deleteChapter,
  batchDeleteChapters,
  batchUpdateChapters,
  reorderChapters,
}
