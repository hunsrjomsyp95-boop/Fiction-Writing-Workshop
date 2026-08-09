import { useState, useRef } from 'react'
import { Users, Globe, Package, Clock, Link, Search } from 'lucide-react'
import { useToast } from '../ToastContext.jsx'

const CATEGORY_LABELS = {
  characters: { label: '人物', icon: Users, color: '#6366f1' },
  worlds: { label: '世界观', icon: Globe, color: '#22c55e' },
  items: { label: '物品/地点', icon: Package, color: '#f59e0b' },
  events: { label: '年表事件', icon: Clock, color: '#ec4899' },
  foreshadowings: { label: '伏笔', icon: Link, color: '#a78bfa' },
}

const WORLDS_CATEGORIES = [
  '地理',
  '历史',
  '势力组织',
  '魔法修炼体系',
  '政治制度',
  '文化习俗',
  '科技物品',
  '神祇信仰',
  '种族',
  '事件',
  '其他',
]
const ITEMS_CATEGORIES = ['物品', '道具', '关键地点', '武器', '防具', '丹药', '功法秘籍', '状态', '其他']
const ITEMS_IMPORTANCE = ['普通', '重要', '稀有', '绝世']
const FORESHADOW_TYPES = ['普通', '重要', '核心']

export default function ExtractAgentView({ novel }) {
  const toast = useToast()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('characters')
  const [selected, setSelected] = useState({})
  const [editableResult, setEditableResult] = useState(null)
  const bottomRef = useRef(null)

  const analyze = async () => {
    const input = text.trim()
    if (!input) {
      toast('请先粘贴要分析的内容', 'error')
      return
    }
    setBusy(true)
    setResult(null)
    setEditableResult(null)
    setSelected({})
    try {
      const data = await window.api.aiExtractEntities(input)
      const counts = ['characters', 'worlds', 'items', 'events', 'foreshadowings'].map((k) => data[k]?.length || 0)
      const total = counts.reduce((a, b) => a + b, 0)
      if (total === 0) {
        toast('AI 未能提取出实体，请尝试提供更详细的文本', 'error')
        return
      }
      setResult(data)
      setEditableResult(JSON.parse(JSON.stringify(data)))
      const allKeys = {}
      for (const cat of Object.keys(CATEGORY_LABELS)) {
        const items = data[cat] || []
        items.forEach((_, i) => {
          allKeys[`${cat}:${i}`] = true
        })
      }
      setSelected(allKeys)
      setActiveTab(
        counts[0] > 0
          ? 'characters'
          : counts[1] > 0
            ? 'worlds'
            : counts[2] > 0
              ? 'items'
              : counts[3] > 0
                ? 'events'
                : 'foreshadowings'
      )
      toast(
        `提取完成：人物${data.characters?.length || 0} · 世界观${data.worlds?.length || 0} · 物品 ${data.items?.length || 0} · 事件 ${data.events?.length || 0} · 伏笔 ${data.foreshadowings?.length || 0}`,
        'success'
      )
    } catch (e) {
      toast('提取失败：' + e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const updateItem = (cat, index, field, value) => {
    const next = JSON.parse(JSON.stringify(editableResult))
    next[cat][index] = { ...next[cat][index], [field]: value }
    setEditableResult(next)
  }

  const createSelected = async () => {
    if (!editableResult) return
    const allItems = []
    for (const cat of Object.keys(CATEGORY_LABELS)) {
      const items = editableResult[cat] || []
      items.forEach((item, i) => {
        if (selected[`${cat}:${i}`]) allItems.push({ cat, item })
      })
    }
    if (allItems.length === 0) {
      toast('请至少勾选一项', 'error')
      return
    }
    let count = 0
    const errors = []
    for (const { cat, item } of allItems) {
      try {
        switch (cat) {
          case 'characters':
            await window.api.createCharacter(novel.id, {
              name: item.name || item.title || '未命名',
              role: item.role || '配角',
              gender: item.gender || '',
              age: item.age || '',
              appearance: item.appearance || '',
              personality: item.personality || '',
              background: item.background || '',
            })
            break
          case 'worlds':
            await window.api.createWorld(novel.id, {
              name: item.name || item.title || '未命名世界观',
              category: item.category || '其他',
              content: item.content || '',
            })
            break
          case 'items':
            await window.api.createItem(novel.id, {
              name: item.name || item.title || '未命名物品',
              category: item.category || '物品',
              description: item.description || '',
              importance: item.importance || '普通',
            })
            break
          case 'events':
            await window.api.createTimelineEvent(novel.id, {
              title: item.title || item.name || '未命名事件',
              story_time: item.story_time || '',
              description: item.description || '',
              location: item.location || '',
            })
            break
          case 'foreshadowings':
            await window.api.createForeshadowing(novel.id, {
              title: item.title || item.name || '未命名伏笔',
              type: item.type || '普通',
              setup_desc: item.setup_desc || '',
            })
            break
        }
        count++
      } catch (e) {
        errors.push(`${item.name || item.title || '?'}: ${e.message}`)
      }
    }
    if (errors.length > 0) {
      toast(`创建完成 ${count} 项，${errors.length} 项失败：${errors[0]}`, 'error')
    } else {
      toast(`批量创建完成，共 ${count} 项`, 'success')
    }
  }

  const totalCounts = {}
  let grandTotal = 0
  if (result) {
    for (const cat of Object.keys(CATEGORY_LABELS)) {
      const n = (result[cat] || []).length
      totalCounts[cat] = n
      grandTotal += n
    }
  }

  const catsWithData = Object.keys(CATEGORY_LABELS).filter((k) => (result?.[k] || []).length > 0)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* 头部输入搜*/}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div className='row' style={{ marginBottom: 8, gap: 8 }}>
          <h3 style={{ margin: 0 }}>AI 提取代理</h3>
          <span className='muted' style={{ fontSize: 12 }}>
            粘贴任意文本，AI 自动提取人物/世界观物品/事件/伏笔
          </span>
        </div>
        <textarea
          rows={6}
          style={{ width: '100%', resize: 'vertical' }}
          placeholder={
            '粘贴小说正文、世界设定、角色描述、剧情片段等任意文本...\n\nAI 会自动分析并提取其中的设定元素，你可以逐条确认后批量创建到对应的模块中。'
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className='row right' style={{ marginTop: 8, gap: 6 }}>
          <button className='primary' onClick={analyze} disabled={busy || !text.trim()}>
            {busy ? (
              'AI 分析的..'
            ) : (
              <>
                <Search size={14} /> AI 提取
              </>
            )}
          </button>
        </div>
      </div>

      {/* 结果可*/}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {busy && (
          <div className='row center' style={{ gap: 10, padding: 40 }}>
            <div className='spinner' />
            <span className='dim'>AI 正在分析文本并提取元素..</span>
          </div>
        )}

        {!busy && !result && (
          <div className='empty-state'>
            <div className='hint' style={{ maxWidth: 500 }}>
              在上方粘贴文本后点击「AI 提取」，AI 将自动识别并提取：{' '}
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <div key={k} className='row' style={{ gap: 8 }}>
                    <span style={{ fontSize: 18 }}>
                      <v.icon size={18} />
                    </span>
                    <span>
                      <b>{v.label}</b> 并提取角色名、外貌、性格、背景等
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, color: 'var(--muted)' }}>
                提取结果可逐条确认、编辑、筛选，然后一键批量创建到对应的模块中。{' '}
              </div>
            </div>
          </div>
        )}

        {result && editableResult && (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
            {/* 分类标签页*/}
            <div
              className='row'
              style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', gap: 4, flexShrink: 0 }}
            >
              {catsWithData.map((k) => {
                const info = CATEGORY_LABELS[k]
                // const selectedCount = catsWithData.reduce((s, cat) => {
                //   return s + (editableResult[cat] || []).filter((_, i) => selected[`${cat}:${i}`]).length
                // }, 0)
                return (
                  <button
                    key={k}
                    className={`small ${activeTab === k ? 'primary' : ''}`}
                    style={activeTab !== k ? { background: 'var(--bg-3)' } : {}}
                    onClick={() => setActiveTab(k)}
                  >
                    <info.icon size={14} /> {info.label} ({totalCounts[k]})
                  </button>
                )
              })}
              <div className='grow' />
              <span className='hint'>
                已保
                {catsWithData.reduce(
                  (s, cat) => s + (editableResult[cat] || []).filter((_, i) => selected[`${cat}:${i}`]).length,
                  0
                )}
                /{grandTotal}
              </span>
              <button
                className='small'
                onClick={() => {
                  const all = {}
                  for (const cat of Object.keys(CATEGORY_LABELS)) {
                    ;(editableResult[cat] || []).forEach((_, i) => {
                      all[`${cat}:${i}`] = true
                    })
                  }
                  setSelected(all)
                }}
              >
                全部
              </button>
              <button className='small' onClick={() => setSelected({})}>
                全不选
              </button>
              <button className='small primary' onClick={createSelected}>
                批量创建
              </button>
            </div>

            {/* 当前分类的内容*/}
            <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
              {(editableResult[activeTab] || []).length === 0 && (
                <div className='hint' style={{ textAlign: 'center', padding: 20 }}>
                  该分类没有提取到内容
                </div>
              )}
              {(editableResult[activeTab] || []).map((item, i) => {
                const key = `${activeTab}:${i}`
                return (
                  <div
                    key={key}
                    className='row panel'
                    style={{
                      padding: '10px 12px',
                      background: 'var(--bg-3)',
                      alignItems: 'flex-start',
                      gap: 10,
                      marginBottom: 6,
                      borderLeft: `3px solid ${selected[key] ? CATEGORY_LABELS[activeTab]?.color : 'transparent'}`,
                    }}
                  >
                    <input
                      type='checkbox'
                      checked={!!selected[key]}
                      onChange={() => setSelected({ ...selected, [key]: !selected[key] })}
                      style={{ marginTop: 6 }}
                    />
                    <div className='grow' style={{ minWidth: 0 }}>
                      {renderItemFields(activeTab, item, i, (field, value) => updateItem(activeTab, i, field, value))}
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function renderItemFields(cat, item, index, onChange) {
  switch (cat) {
    case 'characters':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className='row wrap' style={{ gap: 6, alignItems: 'center' }}>
            <input
              style={{ width: 140, fontWeight: 'bold' }}
              value={item.name || ''}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder='角色名'
            />
            <select
              value={item.role || '配角'}
              onChange={(e) => onChange('role', e.target.value)}
              style={{ width: 110 }}
            >
              {['主角', '重要配角', '配角', '反派', '龙套'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <select
              value={item.gender || '未知'}
              onChange={(e) => onChange('gender', e.target.value)}
              style={{ width: 70 }}
            >
              {['男', '女', '未知'].map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <input
              style={{ width: 80 }}
              value={item.age || ''}
              onChange={(e) => onChange('age', e.target.value)}
              placeholder='年龄'
            />
          </div>
          <div className='row wrap' style={{ gap: 6 }}>
            <input
              style={{ flex: 1 }}
              value={item.appearance || ''}
              onChange={(e) => onChange('appearance', e.target.value)}
              placeholder='外貌'
            />
          </div>
          <div className='row wrap' style={{ gap: 6 }}>
            <input
              style={{ flex: 1 }}
              value={item.personality || ''}
              onChange={(e) => onChange('personality', e.target.value)}
              placeholder='性格'
            />
          </div>
          <div className='row wrap' style={{ gap: 6 }}>
            <input
              style={{ flex: 1 }}
              value={item.background || ''}
              onChange={(e) => onChange('background', e.target.value)}
              placeholder='背景'
            />
          </div>
        </div>
      )
    case 'worlds':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className='row wrap' style={{ gap: 6, alignItems: 'center' }}>
            <input
              style={{ width: 200, fontWeight: 'bold' }}
              value={item.name || ''}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder='设定名称'
            />
            <select
              value={item.category || '其他'}
              onChange={(e) => onChange('category', e.target.value)}
              style={{ width: 150 }}
            >
              {WORLDS_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className='row wrap' style={{ gap: 6 }}>
            <textarea
              rows={2}
              style={{ flex: 1, resize: 'vertical' }}
              value={item.content || ''}
              onChange={(e) => onChange('content', e.target.value)}
              placeholder='设定内容'
            />
          </div>
        </div>
      )
    case 'items':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className='row wrap' style={{ gap: 6, alignItems: 'center' }}>
            <input
              style={{ width: 180, fontWeight: 'bold' }}
              value={item.name || ''}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder='名称'
            />
            <select
              value={item.category || '物品'}
              onChange={(e) => onChange('category', e.target.value)}
              style={{ width: 120 }}
            >
              {ITEMS_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select
              value={item.importance || '普通'}
              onChange={(e) => onChange('importance', e.target.value)}
              style={{ width: 80 }}
            >
              {ITEMS_IMPORTANCE.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className='row wrap' style={{ gap: 6 }}>
            <input
              style={{ flex: 1 }}
              value={item.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder='描述'
            />
          </div>
        </div>
      )
    case 'events':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className='row wrap' style={{ gap: 6, alignItems: 'center' }}>
            <input
              style={{ width: 200, fontWeight: 'bold' }}
              value={item.title || ''}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder='事件名称'
            />
            <input
              style={{ width: 120 }}
              value={item.story_time || ''}
              onChange={(e) => onChange('story_time', e.target.value)}
              placeholder='故事内时间'
            />
          </div>
          <div className='row wrap' style={{ gap: 6 }}>
            <input
              style={{ flex: 1 }}
              value={item.description || ''}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder='描述'
            />
            <input
              style={{ width: 140 }}
              value={item.location || ''}
              onChange={(e) => onChange('location', e.target.value)}
              placeholder='发生地点'
            />
          </div>
        </div>
      )
    case 'foreshadowings':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className='row wrap' style={{ gap: 6, alignItems: 'center' }}>
            <input
              style={{ width: 200, fontWeight: 'bold' }}
              value={item.title || ''}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder='伏笔名称'
            />
            <select
              value={item.type || '普通'}
              onChange={(e) => onChange('type', e.target.value)}
              style={{ width: 100 }}
            >
              {FORESHADOW_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className='row wrap' style={{ gap: 6 }}>
            <input
              style={{ flex: 1 }}
              value={item.setup_desc || ''}
              onChange={(e) => onChange('setup_desc', e.target.value)}
              placeholder='伏笔描述'
            />
          </div>
        </div>
      )
    default:
      return null
  }
}
