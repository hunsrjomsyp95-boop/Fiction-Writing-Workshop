const { use, countChars } = require('./common')

function fullTextSearch(novelId, keyword) {
  const d = use()
  const like = `%${keyword}%`
  const ftsQuery = keyword
    .replace(/['"]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => `"${t}"`)
    .join(' ')
  let chapters = []
  if (ftsQuery) {
    try {
      chapters = d
        .prepare(
          `
        SELECT c.id, c.title, c.order_index
        FROM chapters c JOIN chapters_fts f ON c.id = f.rowid
        WHERE c.novel_id = ? AND chapters_fts MATCH ?
        ORDER BY c.order_index
      `
        )
        .all(novelId, ftsQuery)
    } catch (e) {
      // FTS5 查询失败，回退到 LIKE
    }
  }
  // FTS5 无结果时回退到 LIKE（中文分词可能不准确）
  if (!chapters.length) {
    chapters = d
      .prepare(
        'SELECT id, title, order_index FROM chapters WHERE novel_id=? AND (title LIKE ? OR content LIKE ?) ORDER BY order_index'
      )
      .all(novelId, like, like)
  }
  const outlines = d
    .prepare('SELECT id, title FROM outlines WHERE novel_id=? AND (title LIKE ? OR content LIKE ?)')
    .all(novelId, like, like)
    .map((r) => ({ ...r, kind: 'outline' }))
  const characters = d
    .prepare(
      'SELECT id, name AS title FROM characters WHERE novel_id=? AND (name LIKE ? OR alias LIKE ? OR personality LIKE ? OR background LIKE ?)'
    )
    .all(novelId, like, like, like, like)
    .map((r) => ({ ...r, kind: 'character' }))
  const worlds = d
    .prepare('SELECT id, name AS title FROM worlds WHERE novel_id=? AND (name LIKE ? OR content LIKE ?)')
    .all(novelId, like, like)
    .map((r) => ({ ...r, kind: 'world' }))
  const materials = d
    .prepare('SELECT id, title FROM materials WHERE novel_id=? AND (title LIKE ? OR content LIKE ?)')
    .all(novelId, like, like)
    .map((r) => ({ ...r, kind: 'material' }))
  const foreshadowings = d
    .prepare(
      'SELECT id, title FROM foreshadowings WHERE novel_id=? AND (title LIKE ? OR setup_desc LIKE ? OR call_desc LIKE ? OR resolve_desc LIKE ?)'
    )
    .all(novelId, like, like, like, like)
    .map((r) => ({ ...r, kind: 'foreshadowing' }))
  const timeline = d
    .prepare(
      'SELECT id, title FROM timeline_events WHERE novel_id=? AND (title LIKE ? OR description LIKE ? OR location LIKE ?)'
    )
    .all(novelId, like, like, like)
    .map((r) => ({ ...r, kind: 'timeline' }))
  const items = d
    .prepare('SELECT id, name AS title FROM items WHERE novel_id=? AND (name LIKE ? OR description LIKE ?)')
    .all(novelId, like, like)
    .map((r) => ({ ...r, kind: 'item' }))
  return {
    chapters: chapters.map((r) => ({ ...r, kind: 'chapter' })),
    outlines,
    characters,
    worlds,
    materials,
    foreshadowings,
    timeline,
    items,
  }
}
function replaceInChapters(novelId, find, replace) {
  const d = use()
  if (!find) throw new Error('查找内容不能为空')
  const chapters = d.prepare('SELECT id, title, content FROM chapters WHERE novel_id=?').all(novelId)
  const st = d.prepare(`UPDATE chapters SET content=?, word_count=?, updated_at=datetime('now','localtime') WHERE id=?`)
  const tx = d.transaction(() => {
    let total = 0
    for (const ch of chapters) {
      if (!ch.content || !ch.content.includes(find)) continue
      const count = ch.content.split(find).length - 1
      const newContent = ch.content.split(find).join(replace)
      st.run(newContent, countChars(newContent), ch.id)
      total += count
    }
    return total
  })
  const total = tx()
  return { total, affected: chapters.filter((c) => c.content?.includes(find)).length }
}

module.exports = { fullTextSearch, replaceInChapters }
