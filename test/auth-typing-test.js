const { app } = require('electron')
app.whenReady().then(async () => {
  const os = require('os')
  const path = require('path')
  const fs = require('fs')
  process.env.APPDATA = path.join(os.tmpdir(), 'novel-studio-auth-test')
  fs.rmSync(process.env.APPDATA, { recursive: true, force: true })
  const services = require('../electron/services')
  let passed = 0, failed = 0
  const check = (c, m) => { if (c) { passed++; console.log('  PASS:', m) } else { failed++; console.log('  FAIL:', m) } }

  // ========== 手打码字统计 ==========
  const novel = services.createNovel({ name: '码字测试' })
  let t = services.getTypingStats(novel.id)
  check(t.today === 0 && t.session === 0, '初始码字为 0')
  t = services.addTypingWords(novel.id, 25)
  check(t.today === 25 && t.session === 25, '累加 25 字')
  t = services.addTypingWords(novel.id, 100)
  check(t.today === 125, '今日累计 125')
  check(t.hourly.length === 1 && t.hourly[0].words === 125, '按小时聚合')
  services.addTypingWords(novel.id, 0)
  services.addTypingWords(novel.id, -5)
  check(services.getTypingStats(novel.id).today === 125, '0/负数不计数')
  services.resetTypingSession()
  check(services.getTypingStats(novel.id).session === 0, '重置本次会话，今日保留')
  check(services.getTypingStats(novel.id).today === 125, '重置后今日仍在')

  // ========== 本地登录 ==========
  let a = services.authCheck()
  check(a.enabled === false && a.hasUsers === false, '初始未启用、无账号')
  const u = services.registerUser('writer01', '1234')
  check(u.username === 'writer01', '注册账号')
  a = services.authCheck()
  check(a.enabled === true && a.hasUsers === true, '注册后启用登录')
  let loginOk = false
  try { services.loginUser('writer01', '1234'); loginOk = true } catch (e) {}
  check(loginOk, '正确密码登录')
  let badLogin = false
  try { services.loginUser('writer01', 'wrong'); } catch (e) { badLogin = true }
  check(badLogin, '错误密码被拒')
  let dup = false
  try { services.registerUser('writer01', '5678') } catch (e) { dup = true }
  check(dup, '重复用户名被拒')
  let shortPw = false
  try { services.registerUser('writer02', '12') } catch (e) { shortPw = true }
  check(shortPw, '过短密码被拒')
  check(services.changePassword('writer01', '1234', 'abcd'), '修改密码')
  let oldPwFail = false
  try { services.changePassword('writer01', '1234', '0000') } catch (e) { oldPwFail = true }
  check(oldPwFail, '旧密码错误无法改')
  let oldLogin = false
  try { services.loginUser('writer01', '1234') } catch (e) { oldLogin = true }
  check(oldLogin, '旧密码已失效')
  loginOk = false
  try { services.loginUser('writer01', 'abcd'); loginOk = true } catch (e) {}
  check(loginOk, '新密码可登录')
  let disableFail = false
  try { services.disableAuth('writer01', 'wrong') } catch (e) { disableFail = true }
  check(disableFail, '错误密码无法关闭登录')
  check(services.disableAuth('writer01', 'abcd'), '正确密码关闭登录')
  check(services.authCheck().enabled === false, '登录已关闭')

  console.log(`\n========== 码字/登录测试：${passed} 通过，${failed} 失败 ==========`)
  app.exit(failed > 0 ? 1 : 0)
})
