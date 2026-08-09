import { useState, useEffect } from 'react'
import { useToast } from '../../ToastContext.jsx'

const CATEGORIES = [
  '世界核心',
  '世界结构',
  '地理地貌',
  '气候环境',
  '自然资源',
  '历史纪年',
  '重大事件',
  '势力组织',
  '种族民族',
  '力量体系',
  '神明信仰',
  '政治制度',
  '经济体系',
  '社会文化',
  '科技器物',
  '人物角色',
  '剧情主线',
  '地点场景',
  '物品道具',
  '规则禁忌',
  '其他',
]

const SCOPE_LABELS = {
  worlds: '全部世界观设定',
  characters: '全部人物设定',
  outlines: '全部大纲',
  items: '物品/地点',
  all: '全部（世界观+人物+大纲+物品）',
}

export default function SettingsAnalyzer({ novel }) {
  const toast = useToast()
  const [scope, setScope] = useState('all')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [selected, setSelected] = useState({})
  const [sourceCount, setSourceCount] = useState({})

  useEffect(() => {
    const loadSources = async () => {
      const [w, c, o, it] = await Promise.all([
        window.api.listWorlds(novel.id),
        window.api.listCharacters(novel.id),
        window.api.listOutlines(novel.id),
        window.api.listItems(novel.id),
      ])
      setSourceCount({ worlds: w.length, characters: c.length, outlines: o.length, items: it.length })
    }
    loadSources()
  }, [novel.id])

  useEffect(() => {
    window.api.listWorldNames(novel.id).then((names) => {
      const ws = names.length ? names : ['主世界']
      setWorldNames(ws)
      if (!ws.includes(worldName)) setWorldName(ws[0])
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novel.id])

  const analyze = async () => {
    setBusy(true)
    setResult(null)
    try {
      const [worlds, characters, outlines, items] = await Promise.all([
        window.api.listWorlds(novel.id),
        window.api.listCharacters(novel.id),
        window.api.listOutlines(novel.id),
        window.api.listItems(novel.id),
      ])
      const parts = []
      const pick = (v) => v === 'all' || v === scope
      if (pick('worlds')) for (const w of worlds) parts.push(`【世界观】${w.name}\n${w.content || ''}`)
      if (pick('characters'))
        for (const c of characters)
          parts.push(
            `【人物】${c.name}\n${[c.alias && `别名：${c.alias}`, `定位：${c.role}`, c.appearance && `外貌：${c.appearance}`, c.personality && `性格：${c.personality}`, c.background && `背景：${c.background}`, c.notes && `备注：${c.notes}`].filter(Boolean).join('\n')}`
          )
      if (pick('outlines')) for (const o of outlines) parts.push(`【大纲】${o.title}\n${o.content || ''}`)
      if (pick('items'))
        for (const it of items)
          parts.push(
            `【物品】${it.name}\n${[it.description && `描述：${it.description}`, it.location && `位置：${it.location}`, it.tags && `标签：${it.tags}`].filter(Boolean).join('\n')}`
          )

      if (parts.length === 0) {
        toast('所选范围内没有可分析的设定', 'error')
        return
      }

      const res = await window.api.aiAnalyzeSettings(parts.join('\n\n'))
      if (!res.items || res.items.length === 0) {
        toast('AI 未能返回分类结果，请重试', 'error')
        if (res.raw) setResult({ items: [], raw: res.raw })
        return
      }
      setResult(res)
      const sel = {}
      res.items.forEach((it, i) => {
        sel[i] = true
      })
      setSelected(sel)
      toast(`AI 分析完成，共 ${res.items.length} 条`, 'success')
    } catch (e) {
      toast('分析失败：' + e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const writeToMaterials = async () => {
    if (!result?.items) return
    const chosen = result.items.filter((_, i) => selected[i])
    if (chosen.length === 0) {
      toast('请至少勾选一项', 'error')
      return
    }
    let count = 0
    for (const it of chosen) {
      const content = [
        it.summary && `摘要：${it.summary}`,
        it.key_points?.length && `要点：\n${it.key_points.map((k) => `- ${k}`).join('\n')}`,
        it.source && `来源：${it.source}`,
      ]
        .filter(Boolean)
        .join('\n')
      await window.api.createMaterial(novel.id, {
        title: it.title,
        type: it.category,
        content,
        source: it.source || 'AI 设定分析',
        tags: 'AI分类',
      })
      count++
    }
    toast(`已写入资料库 ${count} 条`, 'success')
    setResult(null)
  }

  const total = result?.items?.length || 0
  const chosen = result ? result.items.filter((_, i) => selected[i]).length : 0

  const [terms, setTerms] = useState(null)
  const [termSel, setTermSel] = useState({})
  const [termBusy, setTermBusy] = useState(false)
  const [worldName, setWorldName] = useState('主世界')
  const [worldNames, setWorldNames] = useState(['主世界'])

  const collectText = async () => {
    const [worlds, characters, outlines, items] = await Promise.all([
      window.api.listWorlds(novel.id),
      window.api.listCharacters(novel.id),
      window.api.listOutlines(novel.id),
      window.api.listItems(novel.id),
    ])
    const parts = []
    const pick = (v) => v === 'all' || scope === v
    if (pick('worlds')) for (const w of worlds) parts.push(`【世界观】${w.name}\n${w.content || ''}`)
    if (pick('characters'))
      for (const c of characters)
        parts.push(
          `【人物】${c.name}\n${[c.appearance && `外貌：${c.appearance}`, c.personality && `性格：${c.personality}`, c.background && `背景：${c.background}`].filter(Boolean).join('\n')}`
        )
    if (pick('outlines')) for (const o of outlines) parts.push(`【大纲】${o.title}\n${o.content || ''}`)
    if (pick('items')) for (const it of items) parts.push(`【物品】${it.name}\n${it.description || ''}`)
    return parts.join('\n\n')
  }

  const extractTerms = async () => {
    setTermBusy(true)
    setTerms(null)
    try {
      const text = await collectText()
      if (!text.trim()) {
        toast('所选范围内没有设定内容', 'error')
        return
      }
      const items = await window.api.aiExtractTerms(text)
      if (!items.length) {
        toast('AI 未返回词条，请重试', 'error')
        return
      }
      setTerms(items)
      setTermSel(Object.fromEntries(items.map((_, i) => [i, true])))
      toast(`拆分完成，共 ${items.length} 个词条`, 'success')
    } catch (e) {
      toast('拆分失败：' + e.message, 'error')
    } finally {
      setTermBusy(false)
    }
  }

  const writeTerms = async () => {
    if (!terms) return
    const chosenTerms = terms.filter((_, i) => termSel[i])
    if (!chosenTerms.length) {
      toast('请至少勾选一个词条', 'error')
      return
    }
    let count = 0
    for (const t of chosenTerms) {
      await window.api.createWorld(novel.id, {
        name: t.title,
        category: t.category,
        content: t.content,
        world_name: worldName,
      })
      count++
    }
    toast(`已写入设定库 ${count} 条`, 'success')
    setTerms(null)
  }

  // const cats = ['', ...new Set(terms?.map((t) => t.category) || [])]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div className='row wrap' style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', gap: 8 }}>
        <span className='muted'>分析范围：</span>
        <select value={scope} onChange={(e) => setScope(e.target.value)} style={{ width: 240 }}>
          {Object.entries(SCOPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <span className='hint'>
          （世界观 {sourceCount.worlds} · 人物 {sourceCount.characters} · 大纲 {sourceCount.outlines} · 物品{' '}
          {sourceCount.items}{' '}
        </span>
        <div className='grow' />
        <button className='small' onClick={extractTerms} disabled={termBusy}>
          {termBusy ? '拆分中...' : '词条拆分→设定库'}
        </button>
        <button className='primary' onClick={analyze} disabled={busy}>
          {busy ? 'AI 分析中...' : 'AI 详细分类分析'}
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {busy && (
          <div className='row center' style={{ gap: 10, padding: 40 }}>
            <div className='spinner' />
            <span className='dim'>AI 正在分析并拆解你的设定..</span>
          </div>
        )}

        {!busy && !result && (
          <div className='empty-state'>
            <div className='hint'>
              把你在「世界观 / 人物 / 大纲 / 物品」里写下的设定内容交给AI 做详细分类分析。
              <br />
              AI 会按「世界结构/ 地理地貌 / 历史纪年 / 势力组织 / 种族民族 / 力量体系 / 神明信仰 / 政治制度 /
              社会文化」等
              <br />
              详细类别拆分并逐条标注，确认后可直接写入资料库。{' '}
            </div>
          </div>
        )}

        {result && result.raw && !result.items?.length && (
          <div className='hint'>
            AI 返回了无法解析的内容，原始结果如下：
            <pre
              style={{ whiteSpace: 'pre-wrap', background: 'var(--bg-3)', padding: 10, borderRadius: 6, marginTop: 8 }}
            >
              {result.raw}
            </pre>
          </div>
        )}

        {result && result.items?.length > 0 && (
          <>
            <div className='row' style={{ marginBottom: 10 }}>
              <b>
                分析结果：{total} 条，已勾选{chosen}
              </b>
              <div className='grow' />
              <button
                className='small'
                onClick={() => setSelected(Object.fromEntries(result.items.map((_, i) => [i, true])))}
              >
                全部
              </button>
              <button
                className='small'
                onClick={() => setSelected(Object.fromEntries(result.items.map((_, i) => [i, false])))}
              >
                全不选
              </button>
              <button className='small primary' onClick={writeToMaterials} disabled={chosen === 0}>
                写入资料库（{chosen})
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {result.items.map((it, i) => (
                <div
                  key={i}
                  className='row panel'
                  style={{ padding: '8px 12px', background: 'var(--bg-3)', alignItems: 'flex-start', gap: 10 }}
                >
                  <input
                    type='checkbox'
                    checked={!!selected[i]}
                    onChange={() => setSelected({ ...selected, [i]: !selected[i] })}
                    style={{ marginTop: 4 }}
                  />
                  <div className='grow' style={{ minWidth: 0 }}>
                    <div className='row wrap'>
                      <b>{it.title}</b>
                      {it.source && <span className='badge yellow'>{it.source}</span>}
                    </div>
                    {it.summary && (
                      <div className='meta' style={{ marginTop: 2, lineHeight: 1.6 }}>
                        {it.summary}
                      </div>
                    )}
                    {it.key_points?.length > 0 && (
                      <div className='meta' style={{ marginTop: 4, lineHeight: 1.6 }}>
                        {it.key_points.map((k, j) => (
                          <div key={j}>· {k}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <select
                    value={it.category}
                    onChange={(e) => {
                      const next = [...result.items]
                      next[i] = { ...it, category: e.target.value }
                      setResult({ ...result, items: next })
                    }}
                    style={{ width: 130, flexShrink: 0 }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 词条拆分结果 */}
        {termBusy && (
          <div className='row center' style={{ gap: 10, padding: 40 }}>
            <div className='spinner' />
            <span className='dim'>AI 正在拆分词条...</span>
          </div>
        )}

        {!termBusy && terms && (
          <>
            <div className='row' style={{ marginBottom: 10 }}>
              <b>词条拆分：{terms.length} 条</b>
              <div className='grow' />
              <span className='muted'>写入世界：</span>
              <select style={{ width: 120 }} value={worldName} onChange={(e) => setWorldName(e.target.value)}>
                {worldNames.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
              <button className='small primary' onClick={writeTerms}>
                写入设定库
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {terms.map((t, i) => (
                <div
                  key={i}
                  className='row panel'
                  style={{ padding: '8px 12px', background: 'var(--bg-3)', alignItems: 'flex-start', gap: 10 }}
                >
                  <input
                    type='checkbox'
                    checked={!!termSel[i]}
                    onChange={() => setTermSel({ ...termSel, [i]: !termSel[i] })}
                    style={{ marginTop: 4 }}
                  />
                  <div className='grow' style={{ minWidth: 0 }}>
                    <b>{t.title}</b>
                    <div className='meta' style={{ marginTop: 2, lineHeight: 1.6 }}>
                      {t.content}
                    </div>
                  </div>
                  <select
                    value={t.category}
                    onChange={(e) => {
                      const next = [...terms]
                      next[i] = { ...t, category: e.target.value }
                      setTerms(next)
                    }}
                    style={{ width: 130, flexShrink: 0 }}
                  >
                    {[
                      '地理',
                      '历史',
                      '势力组织',
                      '魔法/修炼体系',
                      '政治制度',
                      '文化习俗',
                      '科技/物品',
                      '神祇信仰',
                      '种族',
                      '人物',
                      '事件',
                      '其他',
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
