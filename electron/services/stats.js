const { use } = require('./common')

function getStats(novelId) {
  const d = use()
  const totalWords = d.prepare('SELECT COALESCE(SUM(word_count),0) AS s FROM chapters WHERE novel_id=?').get(novelId).s
  const totalChapters = d.prepare('SELECT COUNT(*) AS c FROM chapters WHERE novel_id=?').get(novelId).c
  const doneChapters = d
    .prepare("SELECT COUNT(*) AS c FROM chapters WHERE novel_id=? AND status='已完成'")
    .get(novelId).c
  const characters = d.prepare('SELECT COUNT(*) AS c FROM characters WHERE novel_id=?').get(novelId).c
  const foreshadowings = d.prepare('SELECT COUNT(*) AS c FROM foreshadowings WHERE novel_id=?').get(novelId).c
  const foreshadowByStatus = d
    .prepare('SELECT status, COUNT(*) AS c FROM foreshadowings WHERE novel_id=? GROUP BY status')
    .all(novelId)
  const worldCount = d.prepare('SELECT COUNT(*) AS c FROM worlds WHERE novel_id=?').get(novelId).c
  const materialCount = d.prepare('SELECT COUNT(*) AS c FROM materials WHERE novel_id=?').get(novelId).c
  const relations = d.prepare('SELECT COUNT(*) AS c FROM relations WHERE novel_id=?').get(novelId).c
  const items = d.prepare('SELECT COUNT(*) AS c FROM items WHERE novel_id=?').get(novelId).c
  const timeline = d.prepare('SELECT COUNT(*) AS c FROM timeline_events WHERE novel_id=?').get(novelId).c
  const wordLog = d.prepare('SELECT day, words FROM word_log WHERE novel_id=? ORDER BY day').all(novelId)
  const byChapter = d
    .prepare('SELECT title, word_count, status FROM chapters WHERE novel_id=? ORDER BY order_index')
    .all(novelId)
  const charactersByRole = d
    .prepare('SELECT role, COUNT(*) AS c FROM characters WHERE novel_id=? GROUP BY role ORDER BY c DESC')
    .all(novelId)
  const relationsByDirection = d
    .prepare('SELECT direction, COUNT(*) AS c FROM relations WHERE novel_id=? GROUP BY direction')
    .all(novelId)
  const relationsByType = d
    .prepare('SELECT type, COUNT(*) AS c FROM relations WHERE novel_id=? GROUP BY type ORDER BY c DESC')
    .all(novelId)
  const worldNames = d
    .prepare('SELECT world_name, COUNT(*) AS c FROM worlds WHERE novel_id=? GROUP BY world_name')
    .all(novelId)
  return {
    totalWords,
    totalChapters,
    doneChapters,
    characters,
    foreshadowings,
    foreshadowByStatus,
    worldCount,
    materialCount,
    relations,
    items,
    timeline,
    wordLog,
    byChapter,
    charactersByRole,
    relationsByDirection,
    relationsByType,
    worldNames,
  }
}

module.exports = { getStats }
