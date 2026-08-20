import { useState, useEffect } from 'react'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'

const KIND_LABELS = {
  chapter: '章节',
  outline: '大纲',
  character: '人物',
  world: '世界观',
  material: '资料',
  foreshadowing: '伏笔',
  timeline: '年表',
  item: '物品',
}

export default function SearchModal({ novel, onClose, onJump, onReplace }) {
  const toast = useToast()
  const { confirm } = useDialog()
  const [mode, setMode] = useState('search')
  const [kw, setKw] = useState('')
  const [results, setResults] = useState(null)
  const [searched, setSearched] = useState(false)
  const [find, setFind] = useState('')
  const [replace, setReplace] = useState('')
  const [replacing, setReplacing] = useState(false)

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const run = async () => {
    if (!kw.trim()) {
      setResults(null)
      return
    }
    setResults(await window.api.fullTextSearch(novel.id, kw.trim()))
    setSearched(true)
  }

  const total = results ? Object.values(results).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0) : 0

  const doReplace = async () => {
    if (!find.trim()) {
      toast('请输入要查找的内容', 'error')
      return
    }
    if (
      !(await confirm({
        title: '全局替换',
        message: `确定将所有章节中的「${find}」替换为「${replace}」？此操作不可撤销，建议先备份。`,
        danger: true,
      }))
    )
      return
    setReplacing(true)
    try {
      const res = await window.api.replaceInChapters(novel.id, find, replace)
      toast(`已替换 ${res.total} 处，涉及 ${res.affected} 个章节`, 'success')
      if (onReplace) onReplace()
    } catch (e) {
      toast('替换失败：' + e.message, 'error')
    } finally {
      setReplacing(false)
    }
  }

  return (
    <div className='modal-mask'>
      <div className='modal' style={{ width: 720 }} onClick={(e) => e.stopPropagation()}>
        <div className='modal-head'>
          <div className='tabs' style={{ background: 'none', border: 'none', padding: 0 }}>
            <div className={`tab ${mode === 'search' ? 'active' : ''}`} onClick={() => setMode('search')}>
              全文搜索
            </div>
            <div className={`tab ${mode === 'replace' ? 'active' : ''}`} onClick={() => setMode('replace')}>
              全局替换
            </div>
          </div>
          <div className='spacer' />
          <button className='ghost small' onClick={onClose}>
            关闭
          </button>
        </div>
        <div className='modal-body'>
          {mode === 'search' ? (
            <>
              <div className='row'>
                <input
                  className='grow'
                  autoFocus
                  placeholder='搜索章节、大纲、人物、世界观、资料、伏笔、年表、物品..'
                  value={kw}
                  onChange={(e) => setKw(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') run()
                  }}
                />
                <button className='primary' onClick={run}>
                  搜索
                </button>
              </div>

              {results && <div className='hint'>结{total} 条结果</div>}

              {results &&
                Object.entries(results)
                  .filter(([, arr]) => Array.isArray(arr) && arr.length > 0)
                  .map(([kind, arr]) => (
                    <div key={kind}>
                      <div className='row' style={{ margin: '6px 0' }}>
                        <b style={{ fontSize: 13 }}>{KIND_LABELS[kind] || kind}</b>
                        <span className='badge'>{arr.length}</span>
                      </div>
                      <div
                        style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflow: 'auto' }}
                      >
                        {arr.map((it) => (
                          <div
                            key={kind + it.id}
                            className='row panel'
                            style={{ padding: '6px 10px', background: 'var(--bg-3)', cursor: 'pointer' }}
                            onClick={() => {
                              if (kind === 'chapter') onJump(it.id)
                              onClose()
                            }}
                          >
                            <span className='badge accent'>{KIND_LABELS[kind]}</span>
                            <span
                              className='grow'
                              style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                              {it.title}
                            </span>
                            {kind === 'chapter' && it.order_index != null && (
                              <span className='muted'>{it.order_index}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

              {searched && total === 0 && (
                <div className='empty-state'>
                  <div className='hint'>没有找到与「{kw}」相关的内容。</div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className='form-field'>
                <label>查找内容</label>
                <input autoFocus value={find} onChange={(e) => setFind(e.target.value)} placeholder='要查找的文本' />
              </div>
              <div className='form-field'>
                <label>替换为</label>
                <input
                  value={replace}
                  onChange={(e) => setReplace(e.target.value)}
                  placeholder='替换后的文本（留空表示删除）'
                />
              </div>
              <div className='hint'>
                将替换当前项目全部章节正文中的匹配文本，并自动更新字数统计。建议先通过「数据 备份」留底。
              </div>
              <div className='row right'>
                <button className='primary' onClick={doReplace} disabled={replacing}>
                  {replacing ? '替换为..' : '全部替换'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
