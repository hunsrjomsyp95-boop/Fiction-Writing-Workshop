const { use } = require('./common')
const { getSetting, setSetting } = require('./settings')

const typingSession = new Map()

function addTypingWords(novelId, words) {
  if (!novelId || !words || words <= 0) return getTypingStats(novelId)
  const now = new Date()
  const day = now.toISOString().slice(0, 10)
  const hour = String(now.getHours()).padStart(2, '0')
  use()
    .prepare(
      `INSERT INTO typing_stats (novel_id, day, hour, words) VALUES (?, ?, ?, ?)
    ON CONFLICT(novel_id, day, hour) DO UPDATE SET words = words + excluded.words`
    )
    .run(novelId, day, hour, Math.round(words))
  const s = typingSession.get(novelId) || { words: 0, startedAt: now.toISOString() }
  s.words += words
  typingSession.set(novelId, s)
  return getTypingStats(novelId)
}
function getTypingStats(novelId) {
  const d = use()
  const now = new Date()
  const day = now.toISOString().slice(0, 10)
  const today = d
    .prepare('SELECT COALESCE(SUM(words),0) AS s FROM typing_stats WHERE novel_id=? AND day=?')
    .get(novelId, day).s
  const hourly = d
    .prepare(
      'SELECT hour, SUM(words) AS words FROM typing_stats WHERE novel_id=? AND day=? GROUP BY hour ORDER BY hour'
    )
    .all(novelId, day)
  const session = typingSession.get(novelId) || { words: 0 }
  return { today, session: session.words, hourly: hourly.map((h) => ({ hour: h.hour, words: h.words })) }
}
function resetTypingSession() {
  typingSession.clear()
  return true
}
function getWritingStreak(novelId) {
  const d = use()
  const rows = d
    .prepare('SELECT DISTINCT day FROM typing_stats WHERE novel_id=? AND words>0 ORDER BY day DESC')
    .all(novelId)
  if (rows.length === 0) return 0
  let streak = 1
  for (let i = 1; i < rows.length; i++) {
    const prev = new Date(rows[i - 1].day + 'T00:00:00')
    const curr = new Date(rows[i].day + 'T00:00:00')
    const diff = Math.round((prev - curr) / 86400000)
    if (diff === 1) {
      streak++
    } else {
      break
    }
  }
  return streak
}
function addFocusSession(novelId, minutes) {
  const key = `focus_sessions:${novelId}`
  const existing = getSetting(key, '[]')
  let sessions = []
  try {
    sessions = JSON.parse(existing)
  } catch (e) {
    /* fallback to empty array */
  }
  sessions.push({ date: new Date().toISOString().slice(0, 10), minutes, ts: Date.now() })
  if (sessions.length > 365) sessions = sessions.slice(-365)
  setSetting(key, JSON.stringify(sessions))
  return true
}
function getFocusStats(novelId) {
  const key = `focus_sessions:${novelId}`
  const raw = getSetting(key, '[]')
  let sessions = []
  try {
    sessions = JSON.parse(raw)
  } catch (e) {
    /* fallback to empty array */
  }
  const totalMinutes = sessions.reduce((s, x) => s + (x.minutes || 0), 0)
  const today = new Date().toISOString().slice(0, 10)
  const todayMinutes = sessions.filter((x) => x.date === today).reduce((s, x) => s + (x.minutes || 0), 0)
  return { totalMinutes, totalSessions: sessions.length, todayMinutes, sessions }
}

module.exports = {
  addTypingWords,
  getTypingStats,
  resetTypingSession,
  getWritingStreak,
  addFocusSession,
  getFocusStats,
}
