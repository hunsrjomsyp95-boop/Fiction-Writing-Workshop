import { useState, useEffect, useCallback, useRef } from 'react'
import { ToastCtx } from './ToastContext.jsx'
import Home from './components/Home.jsx'
import Workspace from './components/Workspace.jsx'
import LoginView from './components/LoginView.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { DialogProvider } from './Dialog.jsx'
import { ShortcutProvider } from './shortcuts.jsx'
import { ThemeProvider } from './themes.jsx'
import BackgroundCanvas from './BackgroundCanvas.jsx'

export default function App() {
  const [currentNovel, setCurrentNovel] = useState(null)
  const [auth, setAuth] = useState(null)
  const [user, setUser] = useState(null)
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const toast = useCallback((msg, type = 'info', duration = 2600) => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duration)
  }, [])

  useEffect(() => {
    window.api.authCheck().then((a) => {
      setAuth(a)
      if (!a.enabled) setUser({ username: '本地' })
    })
  }, [])

  useEffect(() => {
    return window.events.onAutoBackup(({ ok, at, count }) => {
      if (ok) toast(`自动备份完成：${count} 个项目 (${at})`, 'success')
    })
  }, [toast])

  if (auth === null)
    return (
      <div className='center' style={{ height: '100%' }}>
        <div className='spinner' />
      </div>
    )

  // 启用了登录但未解锁 → 显示登录界面
  if (auth.enabled && !user) {
    return (
      <ErrorBoundary>
        <ToastCtx.Provider value={toast}>
          <DialogProvider>
            <ThemeProvider>
              <BackgroundCanvas />
              <div className='app'>
                <LoginView onSuccess={(u) => setUser(u)} />
              </div>
              <div className='toast-container'>
                {toasts.map((t) => (
                  <div key={t.id} className={`toast ${t.type}`}>
                    <span className='toast-icon'>{t.type === 'error' ? '✕' : t.type === 'success' ? '✓' : 'ℹ'}</span>
                    <span className='toast-msg'>{t.msg}</span>
                  </div>
                ))}
              </div>
            </ThemeProvider>
          </DialogProvider>
        </ToastCtx.Provider>
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <ToastCtx.Provider value={toast}>
        <DialogProvider>
          <ShortcutProvider>
            <ThemeProvider>
              <BackgroundCanvas />
              <div className='app'>
                {currentNovel ? (
                  <Workspace
                    novel={currentNovel}
                    user={user}
                    onExit={() => setCurrentNovel(null)}
                    onLock={() => setUser(null)}
                  />
                ) : (
                  <Home onOpen={(novel) => setCurrentNovel(novel)} toast={toast} />
                )}
              </div>
              <div className='toast-container'>
                {toasts.map((t) => (
                  <div key={t.id} className={`toast ${t.type}`}>
                    <span className='toast-icon'>{t.type === 'error' ? '✕' : t.type === 'success' ? '✓' : 'ℹ'}</span>
                    <span className='toast-msg'>{t.msg}</span>
                  </div>
                ))}
              </div>
            </ThemeProvider>
          </ShortcutProvider>
        </DialogProvider>
      </ToastCtx.Provider>
    </ErrorBoundary>
  )
}
