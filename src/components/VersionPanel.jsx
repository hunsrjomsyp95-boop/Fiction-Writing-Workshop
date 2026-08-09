import { useState, useEffect } from 'react'
import { diffLines } from 'diff'
import { useDialog } from '../Dialog.jsx'
import { useToast } from '../ToastContext.jsx'

export default function VersionPanel({ chapter, currentContent: _currentContent, onRestore }) {
  const { confirm } = useDialog()
  const toast = useToast()
  const [versions, setVersions] = useState([])
  const [selA, setSelA] = useState(null)
  const [selB, setSelB] = useState(null)
  const [diff, setDiff] = useState([])
  const [viewMode, setViewMode] = useState('unified') // 'unified' | 'side-by-side'
  const [loading, setLoading] = useState(false)
  const [taggingId, setTaggingId] = useState(null)
  const [tagInput, setTagInput] = useState('')

  const load = async () => {
    if (!chapter) {
      setVersions([])
      return
    }
    const list = await window.api.listVersions(chapter.id)
    setVersions(list)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter?.id])

  const compare = async (aId, bId) => {
    if (!aId || !bId || aId === bId) {
      setDiff([])
      return
    }
    setLoading(true)
    try {
      const [a, b] = await Promise.all([window.api.getVersionContent(aId), window.api.getVersionContent(bId)])
      const d = diffLines(a.content, b.content)
      setDiff(d)
    } finally {
      setLoading(false)
    }
  }

  const pick = (kind, id) => {
    if (kind === 'a') {
      setSelA(id)
      compare(id, selB)
    } else {
      setSelB(id)
      compare(selA, id)
    }
  }

  const restore = async (id) => {
    if (
      !(await confirm({ title: '恢复版本', message: '将当前章节内容替换为该版本内容（可先保存一个快照以便回退）？' }))
    )
      return
    const v = await window.api.getVersionContent(id)
    onRestore(v.content)
  }

  const saveTag = async (id) => {
    await window.api.setVersionTag(id, tagInput.trim())
    setTaggingId(null)
    setTagInput('')
    await load()
    toast('标签已保存', 'success')
  }

  const clear = async () => {
    if (!(await confirm({ title: '清空版本历史', message: '确定清空该章节的全部版本历史？', danger: true }))) return
    await window.api.clearVersions(chapter.id)
    setVersions([])
    setSelA(null)
    setSelB(null)
    setDiff([])
  }

  if (!chapter)
    return (
      <div className='hint' style={{ padding: 12 }}>
        选择章节后可保存版本快照并对比前后更改。
      </div>
    )

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className='row'>
        <button className='small' onClick={load}>
          刷新
        </button>
        <button className='small danger' onClick={clear}>
          清空历史
        </button>
      </div>
      <div className='hint'>
        快照会在版本对比中作为比较点。当前文档内容不会自动生成版本，请使用主界面的「快照」按钮手动保存。
      </div>

      {versions.length === 0 ? (
        <div className='hint'>暂无版本记录。保存快照后可在这里对比前后内容更改。</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflow: 'auto', padding: '4px 0' }}>
            {versions.map((v) => (
              <div key={v.id} className='row' style={{ gap: 6, fontSize: 12, padding: '3px 6px', background: 'var(--bg-3)', borderRadius: 4 }}>
                <span className='badge'>v{v.version}</span>
                {v.tag && <span className='badge accent'>{v.tag}</span>}
                <span className='hint'>{v.created_at}</span>
                <div className='grow' />
                {taggingId === v.id ? (
                  <span className='row' style={{ gap: 2 }}>
                    <input
                      style={{ width: 80, fontSize: 11, padding: '1px 4px' }}
                      placeholder='标签名'
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveTag(v.id)}
                      autoFocus
                    />
                    <button className='ghost small' onClick={() => saveTag(v.id)}>✓</button>
                    <button className='ghost small' onClick={() => setTaggingId(null)}>✕</button>
                  </span>
                ) : (
                  <button className='ghost small' onClick={() => { setTaggingId(v.id); setTagInput(v.tag || '') }}>
                    {v.tag ? '改标签' : '打标签'}
                  </button>
                )}
                <button className='ghost small' onClick={() => restore(v.id)}>恢复</button>
              </div>
            ))}
          </div>
          <div className='form-field'>
            <label>对比基准版本</label>
            <select value={selA || ''} onChange={(e) => pick('a', e.target.value ? Number(e.target.value) : null)}>
              <option value=''>- 选择 -</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version}{v.tag ? ` [${v.tag}]` : ''} · {v.created_at}
                </option>
              ))}
            </select>
          </div>
          <div className='form-field'>
            <label>对比目标版本</label>
            <select value={selB || ''} onChange={(e) => pick('b', e.target.value ? Number(e.target.value) : null)}>
              <option value=''>- 选择 -</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version}{v.tag ? ` [${v.tag}]` : ''} · {v.created_at}
                </option>
              ))}
            </select>
          </div>

          {loading && <div className='loading'>对比前..</div>}

          {diff.length > 0 && (
            <div>
              <div className='row' style={{ marginBottom: 6 }}>
                <span className='badge green'>新增（B tA 多）</span>
                <span className='badge red'>删除（A tB 没有可</span>
                <div className='grow' />
                <button
                  className={`small ${viewMode === 'unified' ? 'primary' : ''}`}
                  onClick={() => setViewMode('unified')}
                >
                  统一视图
                </button>
                <button
                  className={`small ${viewMode === 'side-by-side' ? 'primary' : ''}`}
                  onClick={() => setViewMode('side-by-side')}
                >
                  并排对比
                </button>
                <span className='hint' style={{ marginLeft: 8 }}>
                  {diff.length} 段差异
                </span>
              </div>
              {viewMode === 'unified' ? (
                <div className='panel diff-view' style={{ padding: 8, maxHeight: 340, overflow: 'auto' }}>
                  {diff.map((part, i) =>
                    part.added || part.removed ? (
                      <div key={i} className={`diff-line ${part.added ? 'add diff-add' : 'del diff-del'}`}>
                        <span className='mark'>{part.added ? '+' : '-'}</span>
                        <span>{part.value}</span>
                      </div>
                    ) : (
                      <div key={i} className='diff-line'>
                        <span className='mark' />
                        <span className='muted'>{part.value.slice(0, 60)}...</span>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <SideBySideDiff diff={diff} />
              )}
            </div>
          )}

          <div className='list-header' style={{ padding: '8px 4px', border: 'none' }}>
            <h3>版本历史</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {versions.map((v) => (
              <div key={v.id} className='panel row' style={{ padding: '6px 10px', background: 'var(--bg-3)' }}>
                <div className='grow'>
                  <div className='row'>
                    <span className='badge accent'>v{v.version}</span>
                    {v.tag && <span className='badge green'>{v.tag}</span>}
                    <span className='hint'>{v.created_at}</span>
                  </div>
                  <div className='hint' style={{ marginTop: 2 }}>
                    {v.change_summary || `${v.size} 字`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SideBySideDiff({ diff }) {
  const left = [],
    right = []
  for (const part of diff) {
    if (part.removed) {
      const lines = part.value.split('\n')
      for (const line of lines) left.push({ text: line || ' ', type: 'del' })
    } else if (part.added) {
      const lines = part.value.split('\n')
      for (const line of lines) right.push({ text: line || ' ', type: 'add' })
    } else {
      const lines = part.value.split('\n')
      for (const line of lines) {
        left.push({ text: line || ' ', type: 'same' })
        right.push({ text: line || ' ', type: 'same' })
      }
    }
  }
  const rows = Math.max(left.length, right.length)
  while (left.length < rows) left.push({ text: '', type: 'empty' })
  while (right.length < rows) right.push({ text: '', type: 'empty' })

  return (
    <div
      className='panel'
      style={{ display: 'flex', maxHeight: 380, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 6 }}
    >
      <div style={{ flex: 1, minWidth: 0, borderRight: '1px solid var(--border)' }}>
        {left.map((l, i) => (
          <div
            key={i}
            className={`diff-line ${l.type === 'del' ? 'diff-del' : ''}`}
            style={{
              background: l.type === 'del' ? 'rgba(239,68,68,0.12)' : l.type === 'same' ? '' : 'rgba(239,68,68,0.06)',
            }}
          >
            <span className='mark' style={{ color: l.type === 'del' ? '#ef4444' : '#666' }}>
              -
            </span>
            <span>{l.text}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {right.map((r, i) => (
          <div
            key={i}
            className={`diff-line ${r.type === 'add' ? 'diff-add' : ''}`}
            style={{
              background: r.type === 'add' ? 'rgba(34,197,94,0.12)' : r.type === 'same' ? '' : 'rgba(34,197,94,0.06)',
            }}
          >
            <span className='mark' style={{ color: r.type === 'add' ? '#22c55e' : '#666' }}>
              +
            </span>
            <span>{r.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
