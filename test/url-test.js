const { app } = require('electron')
app.whenReady().then(async () => {
  const os = require('os')
  const path = require('path')
  const fs = require('fs')
  process.env.APPDATA = path.join(os.tmpdir(), 'novel-studio-url-test')
  fs.rmSync(process.env.APPDATA, { recursive: true, force: true })
  const services = require('../electron/services')
  const ai = require('../electron/ai')
  let passed = 0, failed = 0
  const check = (c, m) => { if (c) { passed++; console.log('  PASS:', m) } else { failed++; console.log('  FAIL:', m) } }

  // 各种用户可能误填的 URL 都应规范化
  const cases = [
    ['https://api.siliconflow.cn/v1', 'https://api.siliconflow.cn/v1'],
    ['https://api.siliconflow.cn/v1/chat/completions', 'https://api.siliconflow.cn/v1'],
    ['https://api.siliconflow.cn/v1/chat/completions/', 'https://api.siliconflow.cn/v1'],
    ['https://api.openai.com/v1/chat/completions', 'https://api.openai.com/v1'],
    ['https://api.deepseek.com', 'https://api.deepseek.com'],
    ['https://api.deepseek.com/chat/completions', 'https://api.deepseek.com'],
  ]
  for (const [input, expect] of cases) {
    const got = ai.normalizeBaseUrl(input)
    check(got === expect, `normalize(${input}) = ${got}`)
  }

  // 保存再读取，确认持久化已规范化
  services.setSetting('ai_base_url', 'https://api.siliconflow.cn/v1/chat/completions')
  check(ai.getConfig().baseUrl === 'https://api.siliconflow.cn/v1', '保存完整 URL 后读取自动修正')

  // 拼出的请求 URL 正确
  services.setSetting('ai_api_key', 'sk-test')
  let builtUrl = ''
  global.fetch = async (url) => { builtUrl = url; return { ok: true, text: async () => '', json: async () => ({ choices: [{ message: { content: 'ok' } }], usage: null }) } }
  await ai.chat([{ role: 'user', content: 'hi' }], { allowEmptyKey: true })
  check(builtUrl === 'https://api.siliconflow.cn/v1/chat/completions', `请求 URL = ${builtUrl}`)

  console.log(`\n========== URL 规范化测试：${passed} 通过，${failed} 失败 ==========`)
  app.exit(failed > 0 ? 1 : 0)
})
