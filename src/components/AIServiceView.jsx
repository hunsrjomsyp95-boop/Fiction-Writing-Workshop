import { useState, useEffect, useRef, useCallback } from 'react'
import { Globe, PanelLeftOpen, PanelLeftClose } from 'lucide-react'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'
import { THINK_ACTIONS, useThinkRun } from '../aiThink.jsx'

export default function AIServiceView({ novel }) {
  const toast = useToast()
  const { prompt, confirm } = useDialog()
  const [chapters, setChapters] = useState([])
  const [selId, setSelId] = useState(null)
  const [attachSettings, setAttachSettings] = useState(true)
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [leftWidth, setLeftWidth] = useState(250)
  const leftRef = useRef(null)
  const leftStartResize = useCallback(
    (e) => {
      e.preventDefault()
      const startX = e.clientX
      const startW = leftWidth
      const onMove = (ev) => {
        setLeftWidth(Math.max(48, Math.min(400, startW + ev.clientX - startX)))
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [leftWidth]
  )
  const bottomRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      const list = await window.api.listChapters(novel.id)
      setChapters(list)
      setSelId((s) => (s && list.find((c) => c.id === s) ? s : list[0]?.id || null))
    }
    load()
  }, [novel.id])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])


  const current = chapters.find((c) => c.id === selId)

  const buildContext = useCallback(async () => {
    const parts = []
    if (current) parts.push(`【当前章节】${current.title}\n${current.content || ''}`)
    if (attachSettings) {
      try {
        const [worlds, chars, outlines] = await Promise.all([
          window.api.listWorlds(novel.id),
          window.api.listCharacters(novel.id),
          window.api.listOutlines(novel.id),
        ])
        if (worlds.length)
          parts.push(
            `【世界观】\n${worlds
              .map((w) => `${w.name}\n${w.content || ''}`)
              .join('\n')
              .slice(0, 15000)}`
          )
        if (chars.length)
          parts.push(
            `【人物】\n${chars
              .map((c) => `${c.name}\n${c.role}：${(c.personality || c.background || '').slice(0, 150)}`)
              .join('\n')
              .slice(0, 9000)}`
          )
        if (outlines.length)
          parts.push(
            `【大纲】\n${outlines
              .map((o) => `${o.title}\n${(o.content || '').slice(0, 150)}`)
              .join('\n')
              .slice(0, 9000)}`
          )
        const rules = await window.api.listWorldRules(novel.id)
        if (rules.length)
          parts.push(
            `【真实与幻想规则】\n${rules
              .map((r) => `${r.era}/${r.type === '史实' ? '◈ 史实' : '◇ 架空'}\n${r.item}`)
              .join('\n')
              .slice(0, 4000)}`
          )
      } catch (e) {
        /* ignore */
      }
    }
    return parts.join('\n\n')
  }, [current, attachSettings, novel.id])

  const requestIdRef = useRef(0)

  useEffect(() => {
    const removeChunk = window.aiStream.onChunk((requestId, chunk) => {
      setMsgs((m) => {
        const last = m[m.length - 1]
        if (last && last.role === 'assistant' && last.requestId === requestId) {
          return [...m.slice(0, -1), { ...last, content: last.content + chunk }]
        }
        return m
      })
    })

    const removeDone = window.aiStream.onDone(async (_requestId, _content) => {
      setBusy(false)
    })

    const removeError = window.aiStream.onError((_requestId, error) => {
      setBusy(false)
      toast('AI 请求失败：' + error, 'error')
      setMsgs((m) => {
        const last = m[m.length - 1]
        if (last && last.role === 'assistant' && last.requestId === _requestId) {
          return [...m.slice(0, -1), { ...last, content: last.content + '\n\n[请求失败：' + error + ']' }]
        }
        return [...m, { role: 'system', content: '请求失败：' + error }]
      })
    })

    return () => { removeChunk(); removeDone(); removeError() }
  }, [toast])

  const ask = useCallback(
    async (promptText, system = null, opts = {}) => {
      if (busy) return
      setBusy(true)
      setInput('')

      let ctx = opts.withCtx !== false ? await buildContext() : ''
      if (opts.extraCtx) ctx = ctx ? ctx + '\n\n' + opts.extraCtx : opts.extraCtx

      const requestId = ++requestIdRef.current
      setMsgs((m) => [...m, { role: 'user', content: promptText }, { role: 'assistant', content: '', requestId }])

      if (system) {
        window.aiStream.assistantWithSystem(requestId, system, promptText, ctx)
      } else {
        window.aiStream.assistant(requestId, promptText, ctx)
      }
    },
    [busy, buildContext]
  )

  const webSearchAsk = useCallback(async () => {
    if (busy) return
    const cfg = await window.api.searchConfigGet()
    if (!cfg?.apiKey) {
      toast('请先在「设置」AI 设置 」联网搜索」中配置 API Key 和搜索引擎ID', 'error')
      return
    }
    const query =
      input.trim() || (await prompt({ title: '联网搜索', label: '搜索内容', placeholder: '输入要搜索的问题...' }))
    if (!query) return
    try {
      const results = await window.api.searchWeb(query, 5)
      const searchText = results.length
        ? '【联网搜索结果】\n' +
          results.map((r, i) => `${i + 1}. ${r.title}\n   链接：${r.link}\n   摘要：${r.snippet}`).join('\n\n')
        : '【联网搜索】未找到相关结果。'
      const system =
        '你是有联网搜索能力的创作助手。用户发起了联网搜索，请基于搜索结果回答用户的问题。如果搜索结果为空，请如实告知。回答要简练、准确、有条理。'
      await ask(query, system, { extraCtx: searchText })
    } catch (e) {
      toast('联网搜索失败：' + e.message, 'error')
    }
  }, [busy, input, prompt, ask, toast])

  const runThink = useThinkRun({ ask, askPrompt: prompt })

  const applyLast = async () => {
    const last = [...msgs].reverse().find((m) => m.role === 'assistant')
    if (!last) {
      toast('没有可应用的内容', 'error')
      return
    }
    if (!current) {
      toast('请先选择一个目标章节', 'error')
      return
    }
    if (
      !(await confirm({
        title: '应用到正文',
        message: `AI 回复覆盖章节「${current.title}」的正文？建议先保存版本快照以便回退。`,
        danger: true,
      }))
    )
      return
    await window.api.updateChapter(current.id, { content: last.content })
    const list = await window.api.listChapters(novel.id)
    setChapters(list)
    toast('已应用到章节正文', 'success')
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
      {leftPanelOpen ? (
        <>
          <div
            className='sidebar'
            ref={leftRef}
            style={{ width: leftWidth, flexShrink: 0, display: 'flex', flexDirection: 'column' }}
          >
            <div className='list-header'>
              <button className='ghost' onClick={() => setLeftPanelOpen(false)}>
                <PanelLeftClose size={18} />
              </button>
              <h3>分析对象</h3>
              <span className='muted'>章节</span>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {chapters.length === 0 ? (
                <div className='empty-state'>
                  <div className='hint'>暂无章节，先在「章节」页创建内容。</div>
                </div>
              ) : (
                chapters.map((ch) => (
                  <div
                    key={ch.id}
                    className={`tree-item ${selId === ch.id ? 'active' : ''}`}
                    onClick={() => setSelId(ch.id)}
                  >
                    <span
                      className='grow'
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {ch.title}
                    </span>
                    <span className='muted' style={{ fontSize: 11 }}>
                      {ch.word_count}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div style={{ padding: 10, borderTop: '1px solid var(--border)' }}>
              <label className='row hint' style={{ gap: 6 }}>
                <input type='checkbox' checked={attachSettings} onChange={(e) => setAttachSettings(e.target.checked)} />
                附加项目设定（世界观/人物/大纲）作为背景{' '}
              </label>
            </div>
          </div>
          {/* 拖拽手柄 */}
          <div
            style={{ width: 4, flexShrink: 0, cursor: 'col-resize', background: 'transparent', position: 'relative' }}
            onMouseDown={leftStartResize}
          />
        </>
      ) : (
        <div
          style={{
            width: 30,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 8,
            borderRight: '1px solid var(--border)',
            background: 'var(--bg-2)',
          }}
        >
          <button className='ghost' title='展开章节列表' onClick={() => setLeftPanelOpen(true)}>
            <PanelLeftOpen size={18} />
          </button>
        </div>
      )}

      {/* 思考区 */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div className='row wrap' style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', gap: 6 }}>
          <span className='dim' style={{ fontSize: 12 }}>
            AI 思考
          </span>
          {THINK_ACTIONS.map((a) => (
            <button
              key={a.key}
              className='small'
              style={{ background: 'rgba(124,124,240,0.15)' }}
              disabled={busy}
              onClick={() => runThink(a.key)}
            >
              <a.icon size={14} /> {a.label}
            </button>
          ))}
          <div className='grow' />
          {current && <span className='badge'>分析《{current.title}》</span>}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column' }}>
          {msgs.length === 0 && (
            <div className='hint' style={{ textAlign: 'center', padding: 40 }}>
              选择左侧要分析的章节，再点上方功能按钮：AI 会结合所选章节和项目设定给出思考结果。
              <br />
              「起名」「文笔仿写」会先弹窗收集你的要求。结果可一键应用到章节正文。{' '}
            </div>
          )}
          {msgs.map((m, i) => (
            m.role === 'assistant' && !m.content && busy ? (
              <div key={i} className='ai-msg assistant'>
                <span className='typing-cursor'>|</span>
              </div>
            ) : (
              <div key={i} className={`ai-msg ${m.role}`}>
                {m.content}
              </div>
            )
          ))}
          <div ref={bottomRef} />
        </div>

        <div
          style={{
            padding: 10,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <textarea
            rows={3}
            style={{ flex: 1 }}
            placeholder=' AI 自由提问（Ctrl+Enter 发送）...'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) ask(input)
            }}
          />
          <div className='row right'>
            <span className='hint'>Ctrl+Enter 发送</span>
            <button className='small' disabled={busy || !input.trim()} onClick={() => ask(input)}>
              发送
            </button>
            <button
              className='small'
              style={{ background: 'rgba(56,189,248,0.2)' }}
              disabled={busy}
              onClick={webSearchAsk}
            >
              <Globe size={14} /> 联网搜索
            </button>
            <button className='small primary' onClick={applyLast} disabled={!msgs.length}>
              应用到章节正文
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
