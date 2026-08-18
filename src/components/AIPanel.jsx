import { useState, useRef, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'
import { THINK_ACTIONS, useThinkRun, buildProjectContext } from '../aiThink.jsx'
import { QUICK_ACTIONS, STRICT_EDITOR_SYSTEM, FAN_SYSTEM, initParamValues } from './aiConstants.js'
import PromptLibraryModal, { PromptEditModal, PromptParamsModal } from './PromptModals.jsx'

export default function AIPanel({ novel, chapter, contentRef, cursorRef, onApply }) {
  const toast = useToast()
  const { prompt } = useDialog()
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [useContext, setUseContext] = useState(true)
  const [prompts, setPrompts] = useState([])
  const [promptOpen, setPromptOpen] = useState(false)
  const [editPrompt, setEditPrompt] = useState(null)
  const [paramsOpen, setParamsOpen] = useState(false)
  const [runningPrompt, setRunningPrompt] = useState(null)
  const [paramValues, setParamValues] = useState({})
  const [attachSettings, setAttachSettings] = useState(false)
  const [candidates, setCandidates] = useState([])
  const bottomRef = useRef(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  useEffect(() => {
    window.api.listPrompts(novel.id).then(setPrompts)
  }, [novel.id])

  useEffect(() => {
    if (novel?.id) {
      window.api.aiGetHistory(novel.id).then((history) => {
        if (history && history.length > 0) {
          setMsgs(history.map((h) => ({ role: h.role, content: h.content })))
        }
      }).catch(() => {})
    }
  }, [novel?.id])

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

    const removeDone = window.aiStream.onDone(async (requestId, content) => {
      setBusy(false)
      try { await window.api.aiAddHistory(novel.id, 'assistant', content) } catch (e) { /* ignore */ }
    })

    const removeError = window.aiStream.onError((requestId, error) => {
      setBusy(false)
      toast('AI 请求失败：' + error, 'error')
      setMsgs((m) => {
        const last = m[m.length - 1]
        if (last && last.role === 'assistant' && last.requestId === requestId) {
          return [...m.slice(0, -1), { ...last, content: last.content + '\n\n[请求失败：' + error + ']' }]
        }
        return [...m, { role: 'system', content: '请求失败：' + error }]
      })
    })

    return () => { removeChunk(); removeDone(); removeError() }
  }, [novel.id, toast])

  const ask = async (promptText, systemPrompt = null, opts = {}) => {
    if (busy) return
    setBusy(true)
    setInput('')
    try { await window.api.aiAddHistory(novel.id, 'user', promptText) } catch (e) { /* ignore */ }

    let ctx = opts.withCtx !== false && useContext && chapter ? contentRef.current : ''
    if (opts.withCtx !== false && attachSettings) {
      const extra = await buildProjectContext(novel.id)
      if (extra) ctx = ctx ? ctx + '\n\n' + extra : extra
      if (chapter?.id) {
        try {
          const chaps = await window.api.listChapters(novel.id)
          const idx = chaps.findIndex((c) => c.id === chapter.id)
          if (idx > 0) {
            const prev = chaps[idx - 1]
            if (prev?.summary) ctx += `\n\n【上一章摘要：${prev.title}】${prev.summary}`
          }
        } catch { /* ignore */ }
      }
    }
    if (opts.extraCtx) ctx = ctx ? ctx + '\n\n' + opts.extraCtx : opts.extraCtx

    const requestId = ++requestIdRef.current
    setMsgs((m) => [...m, { role: 'user', content: promptText }, { role: 'assistant', content: '', requestId }])

    if (systemPrompt) {
      window.aiStream.assistantWithSystem(requestId, systemPrompt, promptText, ctx)
    } else {
      window.aiStream.assistant(requestId, promptText, ctx)
    }
  }

  const webSearchAsk = async () => {
    if (busy) return
    const cfg = await window.api.searchConfigGet()
    if (!cfg?.apiKey) {
      toast('请先在「设置 → AI 设置 → 联网搜索」中配置 API Key 和搜索引擎ID', 'error')
      return
    }
    const query = input.trim() || (await prompt({ title: '联网搜索', label: '搜索内容', placeholder: '输入要搜索的问题...' }))
    if (!query) return
    try {
      const results = await window.api.searchWeb(query, 5)
      const searchText = results.length
        ? '【联网搜索结果】\n' + results.map((r, i) => `${i + 1}. ${r.title}\n   链接：${r.link}\n   摘要：${r.snippet}`).join('\n\n')
        : '【联网搜索】未找到相关结果。'
      const system = '你是有联网搜索能力的创作助手。用户发起了联网搜索，请基于搜索结果回答用户的问题。如果搜索结果为空，请如实告知。回答要简练、准确、有条理。'
      await ask(query, system, { extraCtx: searchText })
    } catch (e) {
      toast('联网搜索失败：' + e.message, 'error')
    }
  }

  const runThink = useThinkRun({ ask, askPrompt: prompt })

  const applyLast = () => {
    const last = [...msgs].reverse().find((m) => m.role === 'assistant')
    if (!last) { toast('没有可应用的内容', 'error'); return }
    const pos = cursorRef?.current?.pos
    if (pos && pos > 0 && pos <= (contentRef.current || '').length) {
      const before = (contentRef.current || '').slice(0, pos)
      const after = (contentRef.current || '').slice(pos)
      onApply(before + '\n\n' + last.content + '\n\n' + after)
    } else {
      onApply(last.content)
    }
    toast('已应用到正文', 'success')
  }

  const getContinueCtx = async () => {
    const text = contentRef.current || ''
    const pos = cursorRef?.current?.pos
    let ctx = text
    if (pos != null && pos > 0 && pos <= text.length) ctx = text.slice(0, pos)
    let prevSummary = ''
    if (chapter?.id) {
      try {
        const chaps = await window.api.listChapters(novel.id)
        const idx = chaps.findIndex((c) => c.id === chapter.id)
        if (idx > 0) {
          const prev = chaps.slice(Math.max(0, idx - 3), idx).filter((c) => c.summary || c.content)
          if (prev.length) prevSummary = prev.map((c) => `【${c.title}】${c.summary || c.content.slice(0, 200)}`).join('\n')
        }
      } catch { /* ignore */ }
    }
    return prevSummary ? `【前文摘要】\n${prevSummary}\n\n【当前正文】\n${ctx}` : ctx
  }

  const continueWrite = async () => {
    if (busy) return
    const fullCtx = await getContinueCtx()
    setMsgs((m) => [...m, { role: 'user', content: '续写下文' }])
    setBusy(true)
    try {
      const p = `请基于我的行文风格续写下一段，保持叙事连贯。

【续写要求】
1. 直接输出内容，不要加任何前缀或解释
2. 用身体动作呈现情绪，不要说"他感到..."
3. 对话要口语化，可以吞字、改口
4. 一句不超过两个逗号
5. 不要用"不是...而是..."等解释句式
6. 不要在段落结尾用环境描写收束情绪
7. 信任读者，不要解释两次
8. 每段至少一个具体的物理动作或感官输入`
      const res = await window.api.aiAssistant(p, fullCtx)
      setMsgs((m) => [...m, { role: 'assistant', content: res.content }])
    } catch (e) {
      toast('AI 请求失败：' + e.message, 'error')
      setMsgs((m) => [...m, { role: 'system', content: '请求失败：' + e.message }])
    } finally {
      setBusy(false)
    }
  }

  const continueWriteMulti = async () => {
    if (busy) return
    const fullCtx = await getContinueCtx()
    setMsgs((m) => [...m, { role: 'user', content: '续写下文（3 候选模式）' }])
    setBusy(true)
    setCandidates([])
    try {
      const p = `请基于我的行文风格续写下一段，保持叙事连贯。

【续写要求】
1. 直接输出内容，不要加任何前缀或解释
2. 用身体动作呈现情绪，不要说"他感到..."
3. 对话要口语化，可以吞字、改口
4. 一句不超过两个逗号
5. 不要用"不是...而是..."等解释句式
6. 不要在段落结尾用环境描写收束情绪
7. 信任读者，不要解释两次`
      const results = await Promise.all([
        window.api.aiAssistant(p, fullCtx),
        window.api.aiAssistant(p, fullCtx),
        window.api.aiAssistant(p, fullCtx),
      ])
      const cands = results.map((r, i) => ({ id: i + 1, text: r.content.trim() }))
      setCandidates(cands)
      setMsgs((m) => [...m, { role: 'assistant', content: `已生成 ${cands.length} 个续写候选，请选择一个插入正文。` }])
    } catch (e) {
      toast('AI 请求失败：' + e.message, 'error')
      setMsgs((m) => [...m, { role: 'system', content: '请求失败：' + e.message }])
    } finally {
      setBusy(false)
    }
  }

  const runPrompt = async (p) => {
    if (Array.isArray(p.params) && p.params.length) {
      setRunningPrompt(p)
      setParamValues(initParamValues(p.params))
      setParamsOpen(true)
      return
    }
    await runPromptWithVars(p, {})
  }

  const runPromptWithVars = async (p, vars) => {
    let user = p.user_prompt || ''
    for (const [k, v] of Object.entries(vars)) user = user.replaceAll(`{${k}}`, v)
    const remaining = user.match(/\{([^{}]+)\}/g) || []
    for (const v of remaining) {
      const name = v.slice(1, -1)
      const val = await prompt({ title: `请输入${name}`, label: name })
      if (val === null) return
      user = user.replaceAll(v, val || '')
    }
    if (user.includes('{正文}')) user = user.replaceAll('{正文}', (useContext && chapter ? contentRef.current : '').slice(0, 20000))
    await ask(user, p.system_prompt || null)
  }

  return (
    <div className='ai-panel' style={{ flex: 1, minHeight: 0 }}>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid var(--border)' }}>
        <div className='row wrap' style={{ gap: 4 }}>
          <span className='dim' style={{ fontSize: 12 }}>思考</span>
          {THINK_ACTIONS.map((a) => (
            <button key={a.key} className='small' style={{ background: 'rgba(124,124,240,0.15)' }} disabled={busy} onClick={() => runThink(a.key)}>
              <a.icon size={14} /> {a.label}
            </button>
          ))}
        </div>
        <div className='row wrap' style={{ gap: 4 }}>
          {QUICK_ACTIONS.map((a) => (
            <button key={a.label} className='small' disabled={busy} onClick={a.label === '续写' ? continueWrite : () => ask(a.prompt)} onContextMenu={a.label === '续写' ? (e) => { e.preventDefault(); continueWriteMulti() } : undefined} title={a.label === '续写' ? '点击单候选，右键3候选' : undefined}>
              {a.label}
            </button>
          ))}
          <button className='small primary' onClick={() => setPromptOpen(true)}>提示词库</button>
        </div>
        <div className='row wrap' style={{ gap: 4 }}>
          <button className='small' disabled={busy} style={{ background: 'rgba(220,50,50,0.15)', border: '1px solid rgba(220,50,50,0.3)' }} onClick={() => { const text = contentRef.current || ''; if (!text.trim()) { toast('请先写点内容再让编辑审阅', 'info'); return } ask('请以严格编辑的身份审阅以下文字，逐条列出问题并评分。', STRICT_EDITOR_SYSTEM) }}>
            🔍 严格编辑
          </button>
          <button className='small' disabled={busy} style={{ background: 'rgba(255,180,0,0.15)', border: '1px solid rgba(255,180,0,0.3)' }} onClick={() => { const text = contentRef.current || ''; if (!text.trim()) { toast('请先写点内容再来听夸夸', 'info'); return } ask('请以骨灰粉的身份狂夸这段文字，找出所有闪光点！', FAN_SYSTEM) }}>
            🌟 夸夸骨灰粉
          </button>
        </div>
        <label className='row hint' style={{ gap: 6 }}>
          <input type='checkbox' checked={useContext} onChange={(e) => setUseContext(e.target.checked)} />
          附带当前章节内容作为上下文（{chapter ? chapter.title : '未选章节'}）
        </label>
        <label className='row hint' style={{ gap: 6 }}>
          <input type='checkbox' checked={attachSettings} onChange={(e) => setAttachSettings(e.target.checked)} />
          附加项目设定（世界观/人物/大纲/年表/伏笔状态）作为 AI 引用上下文
        </label>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 10, display: 'flex', flexDirection: 'column' }}>
        {msgs.length === 0 && (
          <div className='hint' style={{ textAlign: 'center', padding: 30 }}>
            使用左侧快捷动作快速生成，或从「提示词库」选择专业模板，也可自由提问。<br />可让 AI 生成的内容「应用到正文」。
          </div>
        )}
        {msgs.map((m, i) =>
          m.role === 'assistant' && !m.content && busy ? (
            <div key={i} className='ai-msg assistant'><span className='typing-cursor'>|</span></div>
          ) : (
            <div key={i} className={`ai-msg ${m.role}`}>{m.content}</div>
          )
        )}
        {candidates.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
            <div className='hint' style={{ fontSize: 12 }}>选择一个候选插入正文：</div>
            {candidates.map((c) => (
              <div key={c.id} className='panel' style={{ padding: 10, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 6 }}>
                <div className='row' style={{ marginBottom: 6 }}>
                  <span className='badge accent'>候选 {c.id}</span>
                  <div className='grow' />
                  <button className='small primary' onClick={() => {
                    const pos = cursorRef?.current?.pos
                    if (pos && pos > 0 && pos <= (contentRef.current || '').length) {
                      const before = (contentRef.current || '').slice(0, pos)
                      const after = (contentRef.current || '').slice(pos)
                      onApply(before + '\n\n' + c.text + '\n\n' + after)
                    } else { onApply(c.text) }
                    setCandidates([])
                    toast(`已插入候选 ${c.id}`, 'success')
                  }}>选用</button>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{c.text}</div>
              </div>
            ))}
            <button className='small' onClick={() => setCandidates([])}>关闭候选</button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: 10, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className='row' style={{ gap: 8 }}>
          <textarea rows={3} style={{ flex: 1 }} placeholder='AI 提问，例如：帮我想一个矛盾冲突..' value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) ask(input) }} />
        </div>
        <div className='row right'>
          <span className='hint'>Ctrl+Enter 发送</span>
          <button className='small' disabled={busy || !input.trim()} onClick={() => ask(input)}>发送</button>
          <button className='small' style={{ background: 'rgba(56,189,248,0.2)' }} disabled={busy} onClick={webSearchAsk}><Globe size={14} /> 联网搜索</button>
          <button className='small primary' onClick={applyLast} disabled={!msgs.length}>应用到正文</button>
        </div>
      </div>

      {promptOpen && <PromptLibraryModal novel={novel} prompts={prompts} setPrompts={setPrompts} busy={busy} runPrompt={runPrompt} onClose={() => setPromptOpen(false)} />}
      {editPrompt && <PromptEditModal novel={novel} prompt={editPrompt} setPrompt={setEditPrompt} prompts={prompts} setPrompts={setPrompts} onClose={() => setEditPrompt(null)} />}
      {paramsOpen && runningPrompt && <PromptParamsModal runningPrompt={runningPrompt} paramValues={paramValues} setParamValues={setParamValues} onClose={() => setParamsOpen(false)} onRun={() => { setParamsOpen(false); runPromptWithVars(runningPrompt, { ...paramValues }) }} />}
    </div>
  )
}
