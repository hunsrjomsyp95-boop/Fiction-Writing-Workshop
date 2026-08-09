import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react'

const DialogCtx = createContext(null)
export const useDialog = () => useContext(DialogCtx)

export function DialogProvider({ children }) {
  const [state, setState] = useState(null)
  const resolverRef = useRef(null)

  const open = useCallback(
    (type, opts) =>
      new Promise((resolve) => {
        resolverRef.current = resolve
        setState({ type, ...opts, id: Date.now() + Math.random() })
      }),
    []
  )

  const prompt = useCallback((opts) => open('prompt', opts), [open])
  const confirm = useCallback((opts) => open('confirm', opts), [open])

  const close = useCallback((result) => {
    resolverRef.current?.(result)
    resolverRef.current = null
    setState(null)
  }, [])

  return (
    <DialogCtx.Provider value={{ prompt, confirm }}>
      {children}
      {state && <DialogModal state={state} onClose={close} />}
    </DialogCtx.Provider>
  )
}

function DialogModal({ state, onClose }) {
  const [val, setVal] = useState(state.value || '')

  useEffect(() => {
    setVal(state.value || '')
  }, [state.id, state.value])

  const submit = () => {
    if (state.type === 'prompt') onClose(val.trim())
    else onClose(true)
  }

  return (
    <div className='modal-mask' onClick={() => onClose(state.type === 'prompt' ? null : false)}>
      <div
        className='modal'
        style={{ width: state.type === 'confirm' ? 460 : 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className='modal-head'>{state.title || (state.type === 'confirm' ? '确认' : '输入')}</div>
        <div className='modal-body'>
          {state.type === 'confirm' ? (
            <p style={{ lineHeight: 1.8, color: 'var(--text-dim)', whiteSpace: 'pre-wrap' }}>{state.message}</p>
          ) : (
            <div className='form-field'>
              {state.label && <label>{state.label}</label>}
              <input
                autoFocus
                placeholder={state.placeholder || ''}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit()
                }}
              />
            </div>
          )}
        </div>
        <div className='modal-foot'>
          <button onClick={() => onClose(state.type === 'prompt' ? null : false)}>取消</button>
          {state.type === 'prompt' ? (
            <button className='primary' onClick={submit}>
              确定
            </button>
          ) : (
            <button className={state.danger ? 'danger' : 'primary'} onClick={submit}>
              确定
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
