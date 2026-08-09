const { use } = require('./common')

function hashPassword(password, salt) {
  const crypto = require('crypto')
  const s = salt || crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(String(password), s, 64).toString('hex')
  return { salt: s, hash: `${s}:${hash}` }
}
function verifyPassword(password, stored) {
  const [s] = String(stored).split(':')
  return hashPassword(password, s).hash === stored
}
function authCheck() {
  const { getSetting } = require('./settings')
  const enabled = getSetting('auth_enabled', '0') === '1'
  const hasUsers = use().prepare('SELECT COUNT(*) AS c FROM users').get().c > 0
  return { enabled, hasUsers }
}
function registerUser(username, password) {
  const { setSetting } = require('./settings')
  username = String(username || '').trim()
  if (!username || !password) throw new Error('用户名和密码不能为空')
  if (username.length < 2) throw new Error('用户名至少 2 个字符')
  if (String(password).length < 4) throw new Error('密码至少 4 位')
  const d = use()
  if (d.prepare('SELECT id FROM users WHERE username=?').get(username)) throw new Error('用户名已存在')
  d.prepare('INSERT INTO users (username, password_hash) VALUES (?,?)').run(username, hashPassword(password).hash)
  setSetting('auth_enabled', '1')
  return { username }
}
function loginUser(username, password) {
  const { setSetting } = require('./settings')
  username = String(username || '').trim()
  const user = use().prepare('SELECT * FROM users WHERE username=?').get(username)
  if (!user || !verifyPassword(password, user.password_hash)) throw new Error('用户名或密码错误')
  setSetting('auth_enabled', '1')
  return { username }
}
function changePassword(username, oldPw, newPw) {
  const d = use()
  const user = d.prepare('SELECT * FROM users WHERE username=?').get(String(username || '').trim())
  if (!user || !verifyPassword(oldPw, user.password_hash)) throw new Error('原密码错误')
  if (String(newPw).length < 4) throw new Error('新密码至少 4 位')
  d.prepare('UPDATE users SET password_hash=? WHERE username=?').run(hashPassword(newPw).hash, user.username)
  return true
}
function disableAuth(username, password) {
  const { setSetting } = require('./settings')
  const d = use()
  const user = d.prepare('SELECT * FROM users WHERE username=?').get(String(username || '').trim())
  if (!user || !verifyPassword(password, user.password_hash)) throw new Error('密码验证失败')
  setSetting('auth_enabled', '0')
  return true
}

module.exports = { authCheck, registerUser, loginUser, changePassword, disableAuth }
