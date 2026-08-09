import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'

const STORAGE_KEY = 'novel-staging-notes'

export default function StagingPanel({ onInsert }) {
  const toast = useToast()
  const { confirm } = useDialog()
  const [notes, setNotes] = useState([])
  const [input, setInput] = useState('')
  const [expanded, setExpanded] = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setNotes(JSON.parse(saved))
    } catch {
      // ignore
    }
  }, [])

  const save = (next) => {
    setNotes(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const add = () => {
    const text = input.trim()
    if (!text) return
    save([{ id: Date.now(), text, time: new Date().toLocaleString() }, ...notes])
    setInput('')
    toast('已暂存', 'success')
  }

  const remove = async (id) => {
    if (!(await confirm({ title: '删除便签', message: '确定删除这条便签？', danger: true }))) return
    save(notes.filter((n) => n.id !== id))
  }

  const copyText = (text) => {
    navigator.clipboard.writeText(text)
    toast('已复制', 'success')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      add()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6 }}>
        <textarea
          ref={inputRef}
          rows={2}
          placeholder='快速记录灵感片段... Ctrl+Enter 保存'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ flex: 1, resize: 'none', fontSize: 13 }}
        />
        <button className='small primary' onClick={add} title='保存 (Ctrl+Enter)' style={{ alignSelf: 'flex-end' }}>
          <Plus size={14} />
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '6px 10px' }}>
        {notes.length === 0 && <div className='hint' style={{ padding: 16, textAlign: 'center' }}>暂无便签，记录你的灵感吧</div>}
        {notes.map((n) => (
          <div key={n.id} className='staging-note'>
            <div className='staging-note-header'>
              <span className='staging-note-time'>{n.time}</span>
              <div className='grow' />
              <button className='ghost small' title='复制' onClick={() => copyText(n.text)}>
                <Copy size={12} />
              </button>
              {onInsert && (
                <button className='ghost small' title='插入到正文' onClick={() => onInsert(n.text)}>
                  插入
                </button>
              )}
              <button className='ghost small danger' title='删除' onClick={() => remove(n.id)}>
                <Trash2 size={12} />
              </button>
              <button className='ghost small' onClick={() => setExpanded(expanded === n.id ? null : n.id)}>
                {expanded === n.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
            <div className={`staging-note-body ${expanded === n.id ? 'expanded' : ''}`}>
              {n.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
