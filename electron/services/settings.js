const { use } = require('./common')

function getSetting(key, def = '') {
  const r = use().prepare('SELECT value FROM settings WHERE key=?').get(key)
  return r ? r.value : def
}
function setSetting(key, value) {
  use()
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value')
    .run(key, value)
  return true
}

module.exports = { getSetting, setSetting }
