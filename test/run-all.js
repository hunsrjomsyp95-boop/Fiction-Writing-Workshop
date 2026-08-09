const { execFile } = require('child_process')
const path = require('path')
const os = require('os')

const electron = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe')

const tests = [
  ['后端全量回归', 'full-test.js', 60000],
  ['码字/登录逻辑', 'auth-typing-test.js', 60000],
  ['年表排序', 'timeline-sort-test.js', 60000],
  ['AI 分类', 'ai-classify-test.js', 60000],
  ['提示词库', 'prompts-test.js', 60000],
  ['功能2专项', 'features2-test.js', 60000],
  ['URL规范化', 'url-test.js', 60000],
  ['E2E-基础', 'e2e.js', 60000],
  ['E2E-页面切换', 'e2e-full.js', 90000],
  ['E2E-交互深测', 'e2e-extra.js', 90000],
  ['E2E-登录', 'e2e-auth.js', 90000],
  ['E2E-弹窗', 'e2e-dialog.js', 90000],
  ['E2E-快捷键', 'e2e-shortcut.js', 90000],
  ['E2E-关系网', 'e2e-graph.js', 90000],
  ['E2E-AI思考', 'e2e-think.js', 90000],
  ['E2E-AI思考导航', 'e2e-thinknav.js', 90000],
  ['E2E-参数表单', 'e2e-params.js', 90000],
  ['E2E-功能2UI', 'e2e-f2.js', 90000],
]

let idx = 0
function runOne(label, file, timeout) {
  return new Promise((resolve) => {
    const appdata = path.join(os.tmpdir(), `reg-${Date.now()}-${idx++}`)
    const env = { ...process.env, APPDATA: appdata }
    execFile(electron, [path.join(__dirname, file)], { env, timeout, windowsHide: true }, (err, stdout, stderr) => {
      const out = String(stdout || '')
      const match = out.match(/测试完成：(\d+) 通过，(\d+) 失败/) || out.match(/完成：(\d+) 通过，(\d+) 失败/) || out.match(/E2E 完成：(\d+) 通过，(\d+) 失败/)
      const errMark = String(stderr || '').includes('UnhandledPromiseRejection') || String(stderr || '').includes('Error:') && !String(stderr || '').includes('Autofill')
      resolve({ label, ok: !err && !errMark, match, hasError: errMark, timeout: err && err.killed })
    })
  })
}

;(async () => {
  const results = []
  for (const [label, file, timeout] of tests) {
    process.stdout.write(`运行 ${label} (${file}) ... `)
    const r = await runOne(label, file, timeout)
    const detail = r.match ? ` ${r.match[0]}` : (r.timeout ? ' 超时' : '')
    process.stdout.write(`${r.ok ? '✓' : '✗'}${detail}\n`)
    results.push(r)
  }
  const fail = results.filter((r) => !r.ok)
  console.log(`\n========================================`)
  console.log(`全部 ${results.length} 个测试套件：${results.length - fail.length} 通过，${fail.length} 失败`)
  for (const f of fail) console.log(`  失败: ${f.label}`)
  process.exit(fail.length ? 1 : 0)
})()
