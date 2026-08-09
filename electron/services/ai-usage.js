const { use } = require('./common')

function logAiUsage({ model = '', prompt_tokens = 0, completion_tokens = 0 }) {
  const day = new Date().toISOString().slice(0, 10)
  use()
    .prepare('INSERT INTO ai_usage (day, model, prompt_tokens, completion_tokens) VALUES (?, ?, ?, ?)')
    .run(day, model, prompt_tokens || 0, completion_tokens || 0)
  return true
}
function getAiUsage() {
  const d = use()
  const total = d
    .prepare(
      'SELECT COALESCE(SUM(prompt_tokens),0) AS prompt, COALESCE(SUM(completion_tokens),0) AS completion, COUNT(*) AS calls FROM ai_usage'
    )
    .get()
  const byDay = d
    .prepare(
      'SELECT day, SUM(prompt_tokens) AS prompt, SUM(completion_tokens) AS completion, COUNT(*) AS calls FROM ai_usage GROUP BY day ORDER BY day DESC LIMIT 30'
    )
    .all()
  const byModel = d
    .prepare(
      'SELECT model, SUM(prompt_tokens) AS prompt, SUM(completion_tokens) AS completion, COUNT(*) AS calls FROM ai_usage GROUP BY model ORDER BY calls DESC'
    )
    .all()
  return { ...total, byDay, byModel }
}
function clearAiUsage() {
  use().prepare('DELETE FROM ai_usage').run()
  return true
}

module.exports = { logAiUsage, getAiUsage, clearAiUsage }
