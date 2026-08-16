import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './mobile-v2.css'

// 全局错误处理
window.onerror = (message, source, lineno, colno, error) => {
  console.error('未捕获的错误:', { message, source, lineno, colno, error })
  // 可以在这里发送错误报告到服务器
  return false
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的 Promise 拒绝:', event.reason)
})

// 检测运行环境
const isElectron = window.api && !window.Capacitor
const isCapacitor = window.Capacitor && window.Capacitor.isNativePlatform
const isWeb = !isElectron && !isCapacitor

console.log('运行环境:', { isElectron, isCapacitor, isWeb })

if (isCapacitor) {
  // 在Capacitor环境中，初始化数据库并设置API
  import('./db-capacitor.js').then(({ initDatabase }) => {
    import('./api-capacitor.js').then(({ createApi, createEvents }) => {
      initDatabase().then(() => {
        window.api = createApi()
        window.events = createEvents()
        createRoot(document.getElementById('root')).render(<App />)
      }).catch(err => {
        console.error('数据库初始化失败:', err)
        createRoot(document.getElementById('root')).render(
          <div className="error">
            <h1>数据库初始化失败</h1>
            <p>{err.message}</p>
          </div>
        )
      })
    })
  })
} else if (isWeb) {
  // 在网页环境中，初始化数据库并设置API
  import('./db-web.js').then(({ initDatabase }) => {
    import('./api-web.js').then(({ createApi, createEvents, createAiStream }) => {
      initDatabase().then(() => {
        window.api = createApi()
        window.events = createEvents()
        window.aiStream = createAiStream()
        createRoot(document.getElementById('root')).render(<App />)
      }).catch(err => {
        console.error('数据库初始化失败:', err)
        createRoot(document.getElementById('root')).render(
          <div className="error">
            <h1>数据库初始化失败</h1>
            <p>{err.message}</p>
          </div>
        )
      })
    })
  })
} else {
  // 在Electron环境中，直接渲染
  createRoot(document.getElementById('root')).render(<App />)
}
