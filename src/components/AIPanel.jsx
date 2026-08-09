import { useState, useRef, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'
import { THINK_ACTIONS, useThinkRun, buildProjectContext } from '../aiThink.jsx'

const QUICK_ACTIONS = [
  { label: '续写', prompt: '请基于我的行文风格续写下一段，保持叙事连贯' },
  { label: '润色', prompt: '请润色这段文字，提升文笔和表现力，但不要改变剧情走向。' },
  { label: '改写', prompt: '请改写这段文字，换一种写法风格续' },
  { label: '扩写', prompt: '请扩写这段文字，补充细节、氛围和环境描写。' },
  { label: '概括', prompt: '请概括这段文字的情节要点。' },
  { label: '人物对话', prompt: '请为当前场景设计一段符合人物性格的对话。' },
  { label: '灵感建议', prompt: '请基于当前内容给出后续剧情的灵感建议（-5条）。' },
]

const STRICT_EDITOR_SYSTEM = `你是一位极其严格、经验丰富的文学编辑。你的任务是用挑剔的眼光审视这段文字，找出所有问题：
1. 逻辑漏洞、前后矛盾之处
2. 用词不当、语病、冗余表达
3. 节奏拖沓或过快的地方
4. 人物行为不合理、动机不充分
5. 场景描写不生动、缺乏画面感
6. 对话生硬、不符合人物性格
7. 情节俗套、缺乏新意的地方
请逐条列出问题（编号），每条指出具体位置和改进建议。不要客气，不要鼓励，只说问题。最后给出一个1-10分的评分。`

const FAN_SYSTEM = `你是一位超级狂热的骨灰粉读者，对这部作品爱到不行！你的任务是用极度热情和真诚的语气夸赞这段文字：
1. 找出所有写得好的地方，大声赞美
2. 分析作者的写作天赋和独特风格
3. 对精彩的情节设计表示惊叹
4. 对生动的人物描写表示感动
5. 预测这部作品一定会大火
6. 用夸张但真诚的语气表达你的喜爱
请至少找出5个闪光点详细夸赞，用emoji表达你的激动心情，最后给出一个"封神指数"评分（可超过10分）。`

/**
 * AI辅助创作面板
 * 
 * 提供AI驱动的写作辅助功能，包括：
 * - 快速操作：续写、润色、改写、扩写、概括、对话生成、灵感建议
 * - 深度思考：分析、建议、剧情、人物、起名、仿写、评论、伏笔、设定
 * - 自定义提示词：支持用户自定义AI提示
 * - 上下文感知：基于当前章节内容和光标位置提供相关建议
 * - 对话历史：保存对话记录，支持多轮对话
 * 
 * @param {Object} novel - 小说对象
 * @param {Object} chapter - 章节对象
 * @param {Object} contentRef - 内容引用，用于获取当前编辑器内容
 * @param {Object} cursorRef - 光标引用，用于获取光标位置
 * @param {Function} onApply - 应用AI生成内容的回调函数
 */
export default function AIPanel({ novel, chapter, contentRef, cursorRef, onApply }) {
  const toast = useToast()
  const { prompt, confirm } = useDialog()
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
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  useEffect(() => {
    window.api.listPrompts(novel.id).then(setPrompts)
  }, [novel.id])

  const ask = async (prompt, systemPrompt = null, opts = {}) => {
    if (busy) return
    setBusy(true)
    setMsgs((m) => [...m, { role: 'user', content: prompt }])
    setInput('')
    try {
      let ctx = opts.withCtx !== false && useContext && chapter ? contentRef.current : ''
      if (opts.withCtx !== false && attachSettings) {
        const extra = await buildProjectContext(novel.id)
        if (extra) ctx = ctx ? ctx + '\n\n' + extra : extra
        // 自动携带前一章摘要
        if (chapter?.id) {
          try {
            const chaps = await window.api.listChapters(novel.id)
            const idx = chaps.findIndex((c) => c.id === chapter.id)
            if (idx > 0) {
              const prev = chaps[idx - 1]
              if (prev?.summary) {
                ctx += `\n\n【上一章摘要：${prev.title}】${prev.summary}`
              }
            }
          } catch {
            // ignore
          }
        }
      }
      if (opts.extraCtx) ctx = ctx ? ctx + '\n\n' + opts.extraCtx : opts.extraCtx
      let text = ctx
      if (systemPrompt) {
        const res = await window.api.aiAssistantWithSystem(systemPrompt, prompt, text)
        setMsgs((m) => [...m, { role: 'assistant', content: res.content }])
      } else {
        const res = await window.api.aiAssistant(prompt, text)
        setMsgs((m) => [...m, { role: 'assistant', content: res.content }])
      }
    } catch (e) {
      toast('AI 请求失败：' + e.message, 'error')
      setMsgs((m) => [...m, { role: 'system', content: '请求失败：' + e.message }])
    } finally {
      setBusy(false)
    }
  }

  const webSearchAsk = async () => {
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
  }

  const runThink = useThinkRun({ ask, askPrompt: prompt })

  const applyLast = () => {
    const last = [...msgs].reverse().find((m) => m.role === 'assistant')
    if (!last) {
      toast('没有可应用的内容', 'error')
      return
    }
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

  const [candidates, setCandidates] = useState([])

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
          if (prev.length) {
            prevSummary = prev.map((c) => `【${c.title}】${c.summary || c.content.slice(0, 200)}`).join('\n')
          }
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
      const res = await window.api.aiAssistant('请基于我的行文风格续写下一段，保持叙事连贯，语言流畅自然。', fullCtx)
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
      const prompt = '请基于我的行文风格续写下一段，保持叙事连贯，语言流畅自然。请直接输出续写内容，不要加任何前缀。'
      const results = await Promise.all([
        window.api.aiAssistant(prompt, fullCtx),
        window.api.aiAssistant(prompt, fullCtx),
        window.api.aiAssistant(prompt, fullCtx),
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
    // 带参数定义的提示词库弹出参数表单
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
    // 用参数表单的值替换{key}
    for (const [k, v] of Object.entries(vars)) {
      user = user.replaceAll(`{${k}}`, v)
    }
    // 剩余未定义的 {变量} 逐个弹窗填写（兼容）
    const remaining = user.match(/\{([^{}]+)\}/g) || []
    for (const v of remaining) {
      const name = v.slice(1, -1)
      const val = await prompt({ title: `请输入主{name}」`, label: name })
      if (val === null) return
      user = user.replaceAll(v, val || '')
    }
    if (user.includes('{正文}'))
      user = user.replaceAll('{正文}', (useContext && chapter ? contentRef.current : '').slice(0, 20000))
    await ask(user, p.system_prompt || null)
  }

  const grouped = prompts.reduce((acc, p) => {
    ;(acc[p.category] = acc[p.category] || []).push(p)
    return acc
  }, {})

  return (
    <div className='ai-panel' style={{ flex: 1, minHeight: 0 }}>
      <div
        style={{
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className='row wrap' style={{ gap: 4 }}>
          <span className='dim' style={{ fontSize: 12 }}>
            思考
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
        </div>
        <div className='row wrap' style={{ gap: 4 }}>
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              className='small'
              disabled={busy}
              onClick={a.label === '续写' ? continueWrite : () => ask(a.prompt)}
              onContextMenu={a.label === '续写' ? (e) => { e.preventDefault(); continueWriteMulti() } : undefined}
              title={a.label === '续写' ? '点击单候选，右键3候选' : undefined}
            >
              {a.label}
            </button>
          ))}
          <button className='small primary' onClick={() => setPromptOpen(true)}>
            提示词库
          </button>
        </div>
        <div className='row wrap' style={{ gap: 4 }}>
          <button
            className='small'
            disabled={busy}
            style={{ background: 'rgba(220,50,50,0.15)', border: '1px solid rgba(220,50,50,0.3)' }}
            onClick={() => {
              const text = contentRef.current || ''
              if (!text.trim()) { toast('请先写点内容再让编辑审阅', 'info'); return }
              ask('请以严格编辑的身份审阅以下文字，逐条列出问题并评分。', STRICT_EDITOR_SYSTEM)
            }}
          >
            🔍 严格编辑
          </button>
          <button
            className='small'
            disabled={busy}
            style={{ background: 'rgba(255,180,0,0.15)', border: '1px solid rgba(255,180,0,0.3)' }}
            onClick={() => {
              const text = contentRef.current || ''
              if (!text.trim()) { toast('请先写点内容再来听夸夸', 'info'); return }
              ask('请以骨灰粉的身份狂夸这段文字，找出所有闪光点！', FAN_SYSTEM)
            }}
          >
            🌟 夸夸骨灰粉
          </button>
        </div>
        <label className='row hint' style={{ gap: 6 }}>
          <input type='checkbox' checked={useContext} onChange={(e) => setUseContext(e.target.checked)} />
          附带当前章节内容作为上下文（{chapter ? chapter.title : '未选章节'}）
        </label>
        <label className='row hint' style={{ gap: 6 }}>
          <input type='checkbox' checked={attachSettings} onChange={(e) => setAttachSettings(e.target.checked)} />
          附加项目设定（世界观/人物/大纲/年表/伏笔状态）作为 AI 引用上下文{' '}
        </label>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 10, display: 'flex', flexDirection: 'column' }}>
        {msgs.length === 0 && (
          <div className='hint' style={{ textAlign: 'center', padding: 30 }}>
            使用左侧快捷动作快速生成，或从「提示词库」选择专业模板，也可自由提问。
            <br />
            可让 AI 生成的内容「应用到正文」。{' '}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`ai-msg ${m.role}`}>
            {m.content}
          </div>
        ))}
        {busy && (
          <div className='row center'>
            <div className='spinner' />
          </div>
        )}
        {candidates.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
            <div className='hint' style={{ fontSize: 12 }}>选择一个候选插入正文：</div>
            {candidates.map((c) => (
              <div key={c.id} className='panel' style={{ padding: 10, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 6 }}>
                <div className='row' style={{ marginBottom: 6 }}>
                  <span className='badge accent'>候选 {c.id}</span>
                  <div className='grow' />
                  <button
                    className='small primary'
                    onClick={() => {
                      const pos = cursorRef?.current?.pos
                      if (pos && pos > 0 && pos <= (contentRef.current || '').length) {
                        const before = (contentRef.current || '').slice(0, pos)
                        const after = (contentRef.current || '').slice(pos)
                        onApply(before + '\n\n' + c.text + '\n\n' + after)
                      } else {
                        onApply(c.text)
                      }
                      setCandidates([])
                      toast(`已插入候选 ${c.id}`, 'success')
                    }}
                  >
                    选用
                  </button>
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{c.text}</div>
              </div>
            ))}
            <button className='small' onClick={() => setCandidates([])}>关闭候选</button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div
        style={{ padding: 10, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <div className='row' style={{ gap: 8 }}>
          <textarea
            rows={3}
            style={{ flex: 1 }}
            placeholder=' AI 提问，例如：帮我想一个矛盾冲突..'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) ask(input)
            }}
          />
        </div>
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
            应用到正文
          </button>
        </div>
      </div>

      {promptOpen && (
        <div className='modal-mask' onClick={() => setPromptOpen(false)}>
          <div className='modal' style={{ width: 680 }} onClick={(e) => e.stopPropagation()}>
            <div className='modal-head'>
              提示词库
              <div className='spacer' />
              <button
                className='small'
                onClick={() => setEditPrompt({ name: '', category: '通用', system_prompt: '', user_prompt: '' })}
              >
                除自定义
              </button>
              <button className='ghost small' onClick={() => setPromptOpen(false)}>
                关闭
              </button>
            </div>
            <div className='modal-body' style={{ maxHeight: '62vh' }}>
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <div className='row' style={{ margin: '4px 0' }}>
                    <b style={{ fontSize: 13 }}>{cat}</b>
                    <span className='badge'>{items.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {items.map((p) => (
                      <div key={p.id} className='row panel' style={{ padding: '8px 12px', background: 'var(--bg-3)' }}>
                        <div className='grow'>
                          <div className='row'>
                            <b>{p.name}</b>
                            {p.builtin ? (
                              <span className='badge accent'>内置</span>
                            ) : (
                              <span className='badge green'>自定义</span>
                            )}
                          </div>
                          <div
                            className='hint'
                            style={{ marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {p.user_prompt}
                          </div>
                        </div>
                        <button
                          className='small primary'
                          disabled={busy}
                          onClick={() => {
                            setPromptOpen(false)
                            runPrompt(p)
                          }}
                        >
                          运行
                        </button>
                        {!p.builtin && (
                          <button className='ghost small' onClick={() => setEditPrompt({ ...p })}>
                            编辑
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editPrompt && (
        <div className='modal-mask' onClick={() => setEditPrompt(null)}>
          <div className='modal' style={{ width: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className='modal-head'>{editPrompt.id ? '编辑提示词' : '新建提示词'}</div>
            <div className='modal-body'>
              <div className='form-grid'>
                <div className='form-field'>
                  <label>名称</label>
                  <input
                    value={editPrompt.name}
                    onChange={(e) => setEditPrompt({ ...editPrompt, name: e.target.value })}
                  />
                </div>
                <div className='form-field'>
                  <label>分类</label>
                  <input
                    list='prompt-cats'
                    value={editPrompt.category}
                    onChange={(e) => setEditPrompt({ ...editPrompt, category: e.target.value })}
                  />
                  <datalist id='prompt-cats'>
                    {['通用', '大纲', '正文', '人物', '世界观', '文笔', '构建', '结构'].map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className='form-field'>
                <label>系统提示词（角色设定）</label>
                <textarea
                  rows={3}
                  value={editPrompt.system_prompt}
                  onChange={(e) => setEditPrompt({ ...editPrompt, system_prompt: e.target.value })}
                />
              </div>
              <div className='form-field'>
                <label>{`用户提示词（支持变量：{正文} {题材} {字数} {灵感} {样本} {标题} 等）`}</label>
                <textarea
                  rows={5}
                  value={editPrompt.user_prompt}
                  onChange={(e) => setEditPrompt({ ...editPrompt, user_prompt: e.target.value })}
                />
              </div>
              <div className='form-field'>
                <label>{`参数定义（可选，每行一个：key|类型|标签|默认值|选项逗号分隔）`}</label>
                <textarea
                  rows={4}
                  value={paramsToText(editPrompt.params)}
                  onChange={(e) => setEditPrompt({ ...editPrompt, params: textToParams(e.target.value) })}
                  placeholder={
                    'style|select|风格倾向|保持原味|保持原味,华丽典雅,精炼简洁\ncount|number|数量|5|1-12\nsample|textarea|文风样本||'
                  }
                />
                <div className='hint'>
                  类型：text / textarea / number / select / multiSelect。模板中用{`{key}`} 引用；number 默认值写 3-8
                  表示 min-max。
                </div>
              </div>
              <div className='hint'>
                {'运行的`{参数key}` 会用表单填写；`{正文}` 自动填入当前章节内容；未定义的变量弹窗填写。'}
              </div>
            </div>
            <div className='modal-foot'>
              {editPrompt.id && (
                <button
                  className='danger'
                  onClick={async () => {
                    if (!(await confirm({ title: '删除提示词', message: '确定删除该提示词？', danger: true }))) return
                    await window.api.deletePrompt(editPrompt.id)
                    setEditPrompt(null)
                    setPrompts(await window.api.listPrompts(novel.id))
                    toast('已删除', 'success')
                  }}
                >
                  删除
                </button>
              )}
              <div className='grow' />
              <button onClick={() => setEditPrompt(null)}>取消</button>
              <button
                className='primary'
                onClick={async () => {
                  if (!editPrompt.name.trim()) {
                    toast('请输入名称', 'error')
                    return
                  }
                  if (editPrompt.id) await window.api.updatePrompt(editPrompt.id, editPrompt)
                  else await window.api.createPrompt(novel.id, editPrompt)
                  setEditPrompt(null)
                  setPrompts(await window.api.listPrompts(novel.id))
                  toast('已保存', 'success')
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 运行提示词：参数表单 */}
      {paramsOpen && runningPrompt && (
        <div className='modal-mask' onClick={() => setParamsOpen(false)}>
          <div className='modal' style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className='modal-head'>{runningPrompt.name} · 参数</div>
            <div className='modal-body'>
              {runningPrompt.params.map((p) => (
                <div className='form-field' key={p.key}>
                  <label>{p.label || p.key}</label>
                  {p.type === 'select' ? (
                    <select
                      value={paramValues[p.key] || ''}
                      onChange={(e) => setParamValues({ ...paramValues, [p.key]: e.target.value })}
                    >
                      {(p.options || []).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : p.type === 'multiSelect' ? (
                    <div className='row wrap' style={{ gap: 6 }}>
                      {(p.options || []).map((o) => {
                        const arr = paramValues[p.key] || []
                        const on = arr.includes(o)
                        return (
                          <button
                            key={o}
                            className={`small ${on ? 'primary' : ''}`}
                            onClick={() => {
                              const next = on ? arr.filter((x) => x !== o) : [...arr, o]
                              setParamValues({ ...paramValues, [p.key]: next })
                            }}
                          >
                            {o}
                          </button>
                        )
                      })}
                    </div>
                  ) : p.type === 'number' ? (
                    <div className='row'>
                      <input
                        type='number'
                        min={p.min}
                        max={p.max}
                        step={p.step}
                        value={paramValues[p.key] ?? ''}
                        onChange={(e) => setParamValues({ ...paramValues, [p.key]: e.target.value })}
                      />
                      {p.unit && <span className='muted'>{p.unit}</span>}
                    </div>
                  ) : p.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={paramValues[p.key] || ''}
                      placeholder={p.placeholder || ''}
                      onChange={(e) => setParamValues({ ...paramValues, [p.key]: e.target.value })}
                    />
                  ) : (
                    <input
                      value={paramValues[p.key] || ''}
                      placeholder={p.placeholder || ''}
                      onChange={(e) => setParamValues({ ...paramValues, [p.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className='modal-foot'>
              <button onClick={() => setParamsOpen(false)}>取消</button>
              <button
                className='primary'
                onClick={() => {
                  setParamsOpen(false)
                  runPromptWithVars(runningPrompt, { ...paramValues })
                }}
              >
                生成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 初始化参数表单的默认值
function initParamValues(params) {
  const v = {}
  for (const p of params) {
    if (p.type === 'multiSelect') v[p.key] = p.default ? p.default.split(',') : []
    else if (p.type === 'number') v[p.key] = p.default != null ? p.default : ''
    else v[p.key] = p.default || ''
  }
  return v
}

// 参数数组 的行文本（编辑用）
function paramsToText(params) {
  if (!Array.isArray(params) || !params.length) return ''
  return params
    .map((p) => {
      const opts = Array.isArray(p.options) ? p.options.join(',') : ''
      let def = p.default
      if (p.type === 'number' && p.min != null && p.max != null && def == null) def = `${p.min}-${p.max}`
      return [p.key, p.type, p.label, def, opts].join('|')
    })
    .join('\n')
}

// 行文风格参数数组（编辑用户
function textToParams(text) {
  if (!text || !text.trim()) return []
  return text
    .split('\n')
    .map((line) => {
      const [key, type = 'text', label = '', def = '', opts = ''] = line.split('|').map((s) => s.trim())
      if (!key) return null
      const p = { key, type, label: label || key }
      if (type === 'number') {
        if (/^\d+-\d+$/.test(def)) {
          const [mn, mx] = def.split('-').map(Number)
          p.min = mn
          p.max = mx
        } else if (def !== '') {
          p.default = Number(def) || 0
        }
      } else {
        if (def) p.default = def
      }
      if (opts) p.options = opts.split(',').map((s) => s.trim())
      return p
    })
    .filter(Boolean)
}
