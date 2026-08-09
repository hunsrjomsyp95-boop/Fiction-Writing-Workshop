import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 全局错误处理
window.onerror = (message, source, lineno, colno, error) => {
  console.error('未捕获的错误:', { message, source, lineno, colno, error })
  // 可以在这里发送错误报告到服务器
  return false
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的 Promise 拒绝:', event.reason)
})

createRoot(document.getElementById('root')).render(<App />)
