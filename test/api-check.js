const { app } = require('electron')
app.whenReady().then(async () => {
  const os = require('os')
  const path = require('path')
  const fs = require('fs')
  process.env.APPDATA = path.join(os.tmpdir(), 'novel-studio-api-test')
  fs.rmSync(process.env.APPDATA, { recursive: true, force: true })
  const services = require('./electron/services')
  const ai = require('./electron/ai')
  let passed = 0, failed = 0
  const check = (c, m) => { if (c) { passed++; console.log('  PASS:', m) } else { failed++; console.log('  FAIL:', m) } }

  // 模拟 SiliconFlow 配置
  services.setSetting('ai_base_url', 'https://api.siliconflow.cn/v1/chat/completions')
  services.setSetting('ai_api_key', 'sk-test123')
  services.setSetting('ai_model', 'deepseek-ai/DeepSeek-V4-Flash')
  services.setSetting('ai_temperature', '0.7')

  // 检查 URL 被规范化
  const cfg = ai.getConfig()
  check(cfg.baseUrl === 'https://api.siliconflow.cn/v1', `URL 规范化：${cfg.baseUrl}`)
  check(cfg.model === 'deepseek-ai/DeepSeek-V4-Flash', `模型名保留：${cfg.model}`)

  // 发出真实请求（会失败但能验证链路是否正确）
  try {
    const res = await ai.chat([
      { role: 'user', content: '回复"ok"即可' }
    ], { maxTokens: 4 })
    check(true, `API 请求成功：${res.content}`)
  } catch (e) {
    const msg = e.message || ''
    if (msg.includes('400')) {
      check(msg.includes('deepseek-v4') || msg.includes('model'), `API 链路通，但模型名需改为 deepseek-v4-flash（${msg.slice(0, 60)}）`)
    } else if (msg.includes('401') || msg.includes('403') || msg.includes('Auth')) {
      check(false, `API 地址通但 Key 无效（${msg.slice(0, 60)}）`)
    } else if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) {
      check(false, `API 地址不通（${msg.slice(0, 60)}）`)
    } else {
      check(false, `其他错误：${msg.slice(0, 80)}`)
    }
  }

  console.log(`\n========== API 配置测试：${passed} 通过，${failed} 失败 ==========`)
  app.exit(failed > 0 ? 1 : 0)
})