import { useEffect, useRef, useState } from 'react'

export default function SelectionToolbar({ editorView, selection, novelId: _novelId, onAction, onClose }) {
  const elRef = useRef(null)
  const [style, setStyle] = useState({ position: 'fixed', zIndex: 100 })

  useEffect(() => {
    if (!selection || !editorView) return
    const { fromPos, toPos } = selection
    if (!fromPos || !toPos) return
    const scrollDOM = editorView.scrollDOM
    const editorRect = scrollDOM.getBoundingClientRect()
    const tw = elRef.current ? elRef.current.offsetWidth : 340
    const th = elRef.current ? elRef.current.offsetHeight : 36
    let left = Math.min(fromPos.left, toPos.left)
    let top = fromPos.bottom + 4
    if (top + th > editorRect.bottom) top = fromPos.top - th - 4
    if (left + tw > editorRect.right) left = editorRect.right - tw - 4
    if (left < editorRect.left) left = editorRect.left + 4
    setStyle({ left: `${Math.round(left)}px`, top: `${Math.round(top)}px`, position: 'fixed', zIndex: 100 })
  }, [selection, editorView])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selection.text)
    } catch {
      /* clipboard unavailable */
    }
    onClose?.()
  }

  const handleCut = async () => {
    try {
      await navigator.clipboard.writeText(selection.text)
    } catch {
      /* clipboard unavailable */
    }
    if (editorView) {
      editorView.dispatch({
        changes: { from: selection.from, to: selection.to, insert: '' },
        scrollIntoView: true,
      })
    }
    onClose?.()
  }

  const handlePaste = async () => {
    let text = ''
    try {
      text = await navigator.clipboard.readText()
    } catch {
      /* clipboard unavailable */
    }
    if (text && editorView) {
      editorView.dispatch({
        changes: { from: selection.from, to: selection.to, insert: text },
        scrollIntoView: true,
      })
    }
    onClose?.()
  }

  const handleCreateSetting = async () => {
    onAction?.('create_setting', selection.text)
    onClose?.()
  }

  const handleAIOpinion = async () => {
    onAction?.('ai_opinion', selection.text)
    onClose?.()
  }

  const handlePolish = async () => {
    onAction?.('polish', selection.text)
    onClose?.()
  }

  if (!selection) return null

  return (
    <div ref={elRef} className='selection-toolbar' style={style}>
      <button className='stb-btn' onClick={handleCopy} title='复制选中文字'>
        复制
      </button>
      <button className='stb-btn' onClick={handleCut} title='剪切选中文字'>
        剪切
      </button>
      <button className='stb-btn' onClick={handlePaste} title='粘贴'>
        粘贴
      </button>
      <span className='stb-sep' />
      <button className='stb-btn' onClick={handleCreateSetting} title='从选中文字提取创作设定'>
        创设定
      </button>
      <button className='stb-btn' onClick={handleAIOpinion} title='AI 对这段文字的意见'>
        AI 意见
      </button>
      <button className='stb-btn' onClick={handlePolish} title='AI 润色这段文字'>
        润色
      </button>
    </div>
  )
}
