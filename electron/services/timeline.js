const { use, parseStoryTimeValue } = require('./common')

function listTimeline(novelId) {
  return use()
    .prepare(
      'SELECT t.*, c.title AS chapter_title FROM timeline_events t LEFT JOIN chapters c ON c.id=t.chapter_id WHERE t.novel_id=? ORDER BY t.order_index, t.id'
    )
    .all(novelId)
}
function createTimelineEvent(novelId, patch = {}) {
  const d = use()
  const max = d.prepare('SELECT COALESCE(MAX(order_index),0) AS m FROM timeline_events WHERE novel_id=?').get(novelId).m
  const info = d
    .prepare(
      'INSERT INTO timeline_events (novel_id, title, story_time, description, location, chapter_id, status, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      novelId,
      patch.title || '未命名事件',
      patch.story_time || '',
      patch.description || '',
      patch.location || '',
      patch.chapter_id || null,
      patch.status || '进行中',
      max + 1
    )
  return d
    .prepare(
      'SELECT t.*, c.title AS chapter_title FROM timeline_events t LEFT JOIN chapters c ON c.id=t.chapter_id WHERE t.id=?'
    )
    .get(info.lastInsertRowid)
}
function updateTimelineEvent(id, patch) {
  const d = use()
  const cur = d.prepare('SELECT * FROM timeline_events WHERE id=?').get(id)
  if (!cur) return null
  const next = { ...cur, ...patch, id }
  d.prepare(
    "UPDATE timeline_events SET title=?, story_time=?, description=?, location=?, chapter_id=?, status=?, updated_at=datetime('now','localtime') WHERE id=?"
  ).run(next.title, next.story_time, next.description, next.location, next.chapter_id, next.status, id)
  return d
    .prepare(
      'SELECT t.*, c.title AS chapter_title FROM timeline_events t LEFT JOIN chapters c ON c.id=t.chapter_id WHERE t.id=?'
    )
    .get(id)
}
function deleteTimelineEvent(id) {
  use().prepare('DELETE FROM timeline_events WHERE id=?').run(id)
  return true
}
function reorderTimeline(novelId, ids) {
  const d = use()
  const st = d.prepare('UPDATE timeline_events SET order_index=? WHERE id=? AND novel_id=?')
  const tx = d.transaction(() => {
    ids.forEach((id, i) => st.run(i + 1, id, novelId))
  })
  tx()
  return listTimeline(novelId)
}
function sortTimelineByStoryTime(novelId) {
  const d = use()
  const events = d.prepare('SELECT * FROM timeline_events WHERE novel_id=?').all(novelId)
  events.sort((a, b) => {
    const va = parseStoryTimeValue(a.story_time)
    const vb = parseStoryTimeValue(b.story_time)
    if (va.has !== vb.has) return va.has ? -1 : 1
    if (va.has && vb.has) return va.v - vb.v || a.story_time.localeCompare(b.story_time, 'zh') || a.id - b.id
    return a.id - b.id
  })
  const st = d.prepare('UPDATE timeline_events SET order_index=? WHERE id=?')
  const tx = d.transaction(() => {
    events.forEach((e, i) => st.run(i + 1, e.id))
  })
  tx()
  return listTimeline(novelId)
}

module.exports = {
  listTimeline,
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
  reorderTimeline,
  sortTimelineByStoryTime,
}
