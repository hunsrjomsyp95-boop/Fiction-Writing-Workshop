import { useState } from 'react'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'

export default function AccountModal({ user, onClose, onLock }) {
  const toast = useToast()
  const { confirm } = useDialog()
  const [mode, setMode] = useState('info')
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [busy, setBusy] = useState(false)

  const changePw = async () => {
    if (newPw.length < 4) {
      toast('新密码至少4位', 'error')
      return
    }
    setBusy(true)
    try {
      await window.api.authChangePassword(user.username, oldPw, newPw)
      toast('密码已修改', 'success')
      setMode('info')
      setOldPw('')
      setNewPw('')
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    if (
      !(await confirm({
        title: '关闭登录',
        message: '关闭后将不再要求密码登录，且无法撤销（需重新注册账号）。确定关闭？',
        danger: true,
      }))
    )
      return
    setBusy(true)
    try {
      await window.api.authDisable(user.username, oldPw)
      toast('登录已关闭', 'success')
      onLock()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='modal-mask'>
      <div className='modal' style={{ width: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className='modal-head'>
          账号
          <div className='spacer' />
          <button className='ghost small' onClick={onClose}>
            关闭
          </button>
        </div>
        <div className='modal-body'>
          {mode === 'info' && (
            <>
              <div className='row'>
                <span className='badge green'>当前用户：{user?.username}</span>
              </div>
              <div className='hint'>本地账号，密码以加盐哈希形式仅保存在本机数据库中。</div>
              <div className='row' style={{ gap: 8 }}>
                <button className='small primary' onClick={() => setMode('pw')}>
                  修改密码
                </button>
                <button className='small' onClick={onLock}>
                  锁定（下次需密码解锁）
                </button>
              </div>
              <div className='row' style={{ marginTop: 12 }}>
                <input
                  type='password'
                  style={{ flex: 1 }}
                  placeholder='输入当前密码以关闭登录'
                  value={oldPw}
                  onChange={(e) => setOldPw(e.target.value)}
                />
                <button className='small danger' onClick={disable} disabled={busy}>
                  关闭登录
                </button>
              </div>
            </>
          )}
          {mode === 'pw' && (
            <>
              <div className='form-field'>
                <label>当前密码</label>
                <input type='password' value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
              </div>
              <div className='form-field'>
                <label>新密码（至少 4 位）</label>
                <input type='password' value={newPw} onChange={(e) => setNewPw(e.target.value)} />
              </div>
              <div className='row right'>
                <button onClick={() => setMode('info')}>返回</button>
                <button className='primary' onClick={changePw} disabled={busy}>
                  确认修改
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
