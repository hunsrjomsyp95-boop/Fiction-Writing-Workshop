const { execSync, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

const OLLAMA_URL = 'https://ollama.com/download'
const OLLAMA_API = 'http://localhost:11434'

// 检测 Ollama 是否已安装
function isInstalled() {
  try {
    if (process.platform === 'win32') {
      // Windows: 检查 PATH 或常见安装路径
      try {
        execSync('where ollama', { stdio: 'pipe' })
        return true
      } catch {
        const localPath = path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Ollama', 'ollama.exe')
        return fs.existsSync(localPath)
      }
    } else {
      // macOS / Linux
      execSync('which ollama', { stdio: 'pipe' })
      return true
    }
  } catch {
    return false
  }
}

// 检测 Ollama 服务是否运行中
async function isRunning() {
  try {
    const res = await fetch(`${OLLAMA_API}/api/tags`, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}

// 启动 Ollama 服务
function startService() {
  try {
    if (process.platform === 'win32') {
      // Windows: 后台启动
      const child = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      })
      child.unref()
    } else {
      // macOS / Linux
      const child = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore',
      })
      child.unref()
    }
    return true
  } catch (e) {
    return false
  }
}

// 等待 Ollama 服务就绪
async function waitForReady(maxWait = 10000) {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    if (await isRunning()) return true
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

// 确保 Ollama 运行（自动启动）
async function ensureRunning() {
  if (await isRunning()) return true
  if (!isInstalled()) return false
  startService()
  return await waitForReady()
}

// 获取已安装的模型列表
async function listModels() {
  try {
    const res = await fetch(`${OLLAMA_API}/api/tags`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data.models || []).map((m) => ({
      id: m.name,
      name: m.name,
      size: m.size,
      modified: m.modified_at,
    }))
  } catch {
    return []
  }
}

// 检查某个模型是否已下载
async function hasModel(modelId) {
  const models = await listModels()
  return models.some((m) => m.id === modelId || m.id === modelId + ':latest')
}

// 拉取模型（返回进度流）
async function pullModel(modelId, onProgress) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30 * 60 * 1000) // 30 分钟超时
  try {
    const res = await fetch(`${OLLAMA_API}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelId, stream: true }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`拉取失败: ${res.status}`)

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const data = JSON.parse(line)
          onProgress?.(data)
        } catch { /* skip */ }
      }
    }

    // 处理剩余缓冲区
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer)
        onProgress?.(data)
      } catch { /* skip */ }
    }
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('下载超时（30分钟），请检查网络后重试')
    throw e
  } finally {
    clearTimeout(timer)
  }
}

// 获取 Ollama 安装下载链接
function getDownloadUrl() {
  return OLLAMA_URL
}

// 获取 Ollama 服务 API 地址
function getApiUrl() {
  return OLLAMA_API
}

module.exports = {
  isInstalled,
  isRunning,
  startService,
  waitForReady,
  ensureRunning,
  listModels,
  hasModel,
  pullModel,
  getDownloadUrl,
  getApiUrl,
}
