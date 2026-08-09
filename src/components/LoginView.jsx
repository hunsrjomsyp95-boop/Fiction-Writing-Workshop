import { useState, useEffect } from 'react'
import { useToast } from '../ToastContext.jsx'

export default function LoginView({ onSuccess }) {
  const toast = useToast()
  const [hasUsers, setHasUsers] = useState(null)
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    window.api.authCheck().then((a) => {
      setHasUsers(a.hasUsers)
      setMode(a.hasUsers ? 'login' : 'register')
    })
  }, [])

  const submit = async () => {
    if (!username.trim()) {
      toast('请输入用户名', 'error')
      return
    }
    if (!password) {
      toast('请输入密码', 'error')
      return
    }
    if (mode === 'register') {
      if (password.length < 4) {
        toast('密码至少 4 位', 'error')
        return
      }
      if (password !== confirm) {
        toast('两次输入的密码不一致', 'error')
        return
      }
    }
    setBusy(true)
    try {
      const user =
        mode === 'register'
          ? await window.api.authRegister(username, password)
          : await window.api.authLogin(username, password)
      onSuccess(user)
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(1200px 600px at 50% 20%, #2b2b45 0%, #1e1e2e 60%)',
      }}
    >
      <div className='panel' style={{ width: 360, padding: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✍️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>小说创作工坊</h1>
          <div className='hint' style={{ marginTop: 6 }}>
            本地账号 · 密码仅保存在本机
          </div>
        </div>

        <div className='row' style={{ marginBottom: 16, justifyContent: 'center' }}>
          <div
            className={`tab ${mode === 'login' ? 'active' : ''}`}
            style={{ borderRadius: 6 }}
            onClick={() => setMode('login')}
          >
            登录
          </div>
          {!hasUsers && (
            <div
              className={`tab ${mode === 'register' ? 'active' : ''}`}
              style={{ borderRadius: 6 }}
              onClick={() => setMode('register')}
            >
              注册
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input placeholder='用户名' value={username} onChange={(e) => setUsername(e.target.value)} />
          <input
            type='password'
            placeholder='密码'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          {mode === 'register' && (
            <input
              type='password'
              placeholder='确认密码'
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          )}
          <button className='primary' style={{ padding: '10px 0', fontSize: 14 }} onClick={submit} disabled={busy}>
            {busy ? '处理中..' : mode === 'register' ? '创建账号' : '解锁进入'}
          </button>
        </div>

        <div className='hint' style={{ textAlign: 'center', marginTop: 16 }}>
          {mode === 'login' && hasUsers ? '忘记密码无法找回，请谨慎保管。' : '创建后每次打开软件需输入密码解锁。'}
        </div>
      </div>
    </div>
  )
}
