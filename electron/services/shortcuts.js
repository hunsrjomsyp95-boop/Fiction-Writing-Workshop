const { getSetting, setSetting } = require('./settings')

function getShortcuts() {
  const v = getSetting('shortcuts', '')
  if (!v) return null
  try {
    return JSON.parse(v)
  } catch (e) {
    return null
  }
}
function setShortcuts(map) {
  setSetting('shortcuts', JSON.stringify(map || {}))
  return true
}

module.exports = { getShortcuts, setShortcuts }
