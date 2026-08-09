import { useState, useEffect } from 'react'
import { useShortcuts, buildCombo, formatKey } from '../shortcuts.jsx'
import { useToast } from '../ToastContext.jsx'

export default function ShortcutModal({ onClose }) {
  const toast = useToast()
  const { map, setKey, reset, actions } = useShortcuts()
  const [recording, setRecording] = useState(null)
  const [conflicts, setConflicts] = useState([])

  useEffect(() => {
    if (!recording) return
    const handler = (e) => {
      e.preventDefault()
      e.stopPropagation()
      const combo = buildCombo(e)
      if (!combo) return
      const dup = Object.entries(map).find(([k, c]) => c && c.toLowerCase() === combo.toLowerCase() && k !== recording)
      if (dup) {
        setConflicts((cs) => [...cs, { combo, action: recording, conflict: dup[0] }])
        toast(`快捷键 ${combo} 已被 ${actions.find((a) => a.key === dup[0])?.label} 占用`, 'error')
      }
      setKey(recording, combo)
      setRecording(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [recording, map, setKey, actions, toast])

  const groups = {}
  for (const a of actions) (groups[a.group] = groups[a.group] || []).push(a)

  return (
    <div className='modal-mask' onClick={onClose}>
      <div className='modal' style={{ width: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className='modal-head'>
          自定义快捷键
          <div className='spacer' />
          <button
            className='small'
            onClick={async () => {
              await reset()
              toast('已恢复默认快捷键', 'success')
            }}
          >
            恢复默认
          </button>
          <button className='ghost small' onClick={onClose}>
            关闭
          </button>
        </div>
        <div className='modal-body' style={{ maxHeight: '64vh' }}>
          {recording && (
            <div className='panel' style={{ padding: 12, marginBottom: 10, border: '1px solid var(--accent)' }}>
              正在为 {actions.find((a) => a.key === recording)?.label} 设置快捷键，请按下组合键… Esc 取消
            </div>
          )}
          {conflicts.length > 0 && (
            <div className='panel' style={{ padding: 10, marginBottom: 10, border: '1px solid var(--yellow)' }}>
              {conflicts.map((c, i) => (
                <div key={i} className='hint' style={{ color: 'var(--yellow)' }}>
                  「{c.combo}」已绑定到多个动作，可能导致冲突，请留意
                </div>
              ))}
              <button className='small ghost' onClick={() => setConflicts([])}>
                忽略
              </button>
            </div>
          )}
          {Object.entries(groups).map(([g, list]) => (
            <div key={g}>
              <div className='row' style={{ margin: '8px 0 4px' }}>
                <b style={{ fontSize: 13 }}>{g}</b>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {list.map((a) => (
                  <div key={a.key} className='row panel' style={{ padding: '7px 12px', background: 'var(--bg-3)' }}>
                    <span className='grow'>{a.label}</span>
                    <span className='badge accent' style={{ minWidth: 90, justifyContent: 'center' }}>
                      {formatKey(map[a.key])}
                    </span>
                    <button
                      className={`small ${recording === a.key ? 'primary' : ''}`}
                      onClick={() => setRecording(recording === a.key ? null : a.key)}
                    >
                      {recording === a.key ? '请按快捷键' : '改'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className='hint' style={{ marginTop: 10 }}>
            提示：全局快捷键在编辑器内也会生效；如果与编辑器内置的
            Ctrl+F（查找）、Ctrl+H（替换）、Ctrl+Z（撤销）等冲突，浏览器会优先处理内置功能。
          </div>
        </div>
      </div>
    </div>
  )
}
