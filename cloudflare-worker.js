// Cloudflare Worker - AI API CORS 代理
// 部署方法：
// 1. 访问 https://dash.cloudflare.com
// 2. 注册/登录后，点击左侧 "Workers 和 Pages"
// 3. 点击 "创建应用程序" -> "创建 Worker"
// 4. 把下面的代码粘贴进去，点击 "部署"
// 5. 记下你的 Worker URL（如 https://ai-proxy.xxx.workers.dev）

const ALLOWED_ORIGINS = [
  'https://hunsrjomsyp95-boop.github.io',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:8080',
]

export default {
  async fetch(request) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return handleOptions(request)
    }

    // 只允许 POST 请求
    if (request.method !== 'POST') {
      return new Response('Only POST allowed', { status: 405 })
    }

    try {
      const url = new URL(request.url)
      
      // 从请求路径中获取目标URL
      // 使用方式：POST /proxy/https://api.example.com/v1/chat/completions
      const targetPath = url.pathname.replace('/proxy/', '')
      const targetUrl = decodeURIComponent(targetPath)
      
      if (!targetUrl || !targetUrl.startsWith('http')) {
        return jsonResponse({ error: 'Invalid target URL' }, 400)
      }

      // 获取请求体
      const body = await request.text()
      
      // 获取原始请求的 headers
      const headers = new Headers()
      headers.set('Content-Type', 'application/json')
      
      // 传递 Authorization header
      const auth = request.headers.get('Authorization')
      if (auth) {
        headers.set('Authorization', auth)
      }

      // 转发请求到目标 API
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body,
      })

      // 获取响应
      const responseBody = await response.text()

      // 返回带 CORS 头的响应
      return new Response(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    } catch (err) {
      return jsonResponse({ error: err.message }, 500)
    }
  },
}

function handleOptions(request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}