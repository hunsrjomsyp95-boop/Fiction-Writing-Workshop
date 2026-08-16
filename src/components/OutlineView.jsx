import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronRight, ChevronDown, PanelLeftOpen, PanelLeftClose } from 'lucide-react'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'

const TYPES = ['大纲', '剧情线', '节点', '伏笔', '其他']
const TYPE_COLORS = {
  大纲: '#e06c75',
  剧情线: '#61afef',
  节点: '#98c379',
  伏笔: '#c678dd',
  其他: '#abb2bf',
}

export default function OutlineView({ novel }) {
  const toast = useToast()
  const { prompt, confirm } = useDialog()
  const [items, setItems] = useState([])
  const [current, setCurrent] = useState(null)
  const [form, setForm] = useState(null)
  const [collapsed, setCollapsed] = useState({})
  const [dragId, setDragId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [leftWidth, setLeftWidth] = useState(320)
  const leftRef = useRef(null)

  const leftStartResize = useCallback(
    (e) => {
      e.preventDefault()
      const startX = e.clientX
      const startW = leftWidth
      const onMove = (ev) => {
        setLeftWidth(Math.max(48, Math.min(500, startW + ev.clientX - startX)))
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

  const load = async () => setItems(await window.api.listOutlines(novel.id))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novel.id])

  const create = async (parentId = null) => {
    const title = await prompt({ title: '标题', value: parentId ? '子节点' : '新大纲节点' })
    if (!title) return
    const type = (await prompt({ title: '类型', value: '节点', placeholder: '建议、剧情线节点/伏笔' })) || '节点'
    const it = await window.api.createOutline(novel.id, { title, parentId, type })
    setItems(await window.api.listOutlines(novel.id))
    setCurrent(it)
    setForm(it)
    toast('已创建', 'success')
  }

  const openEdit = (it) => {
    setCurrent(it)
    setForm({ ...it })
  }

  const save = async () => {
    if (!form) return
    const updated = await window.api.updateOutline(form.id, form)
    setItems(await window.api.listOutlines(novel.id))
    setCurrent(updated)
    setForm(null)
    toast('已保存', 'success')
  }

  const del = async (id) => {
    if (!(await confirm({ title: '删除大纲节点', message: '确定删除该大纲节点及其所有子节点？', danger: true }))) return
    await window.api.deleteOutline(id)
    if (current?.id === id) {
      setCurrent(null)
      setForm(null)
    }
    load()
    toast('已删除', 'success')
  }

  const children = (pid) => items.filter((i) => (i.parent_id || null) === (pid || null))

  const toggleCollapse = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }))

  const handleDragStart = (e, id) => {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, id) => {
    e.preventDefault()
    if (id !== dragId) setDragOverId(id)
  }

  const handleDrop = async (e, targetId) => {
    e.preventDefault()
    setDragId(null)
    setDragOverId(null)
    if (!dragId || dragId === targetId) return
    const dragged = items.find((i) => i.id === dragId)
    const target = items.find((i) => i.id === targetId)
    if (!dragged || !target) return
    // Same parent: swap order_index
    if ((dragged.parent_id || null) === (target.parent_id || null)) {
      const tmpIdx = dragged.order_index
      await window.api.updateOutline(dragged.id, { order_index: target.order_index })
      await window.api.updateOutline(target.id, { order_index: tmpIdx })
    } else {
      // Different parent: move dragged to target's parent, insert after target
      await window.api.updateOutline(dragged.id, { parent_id: target.parent_id, order_index: target.order_index + 0.5 })
    }
    setItems(await window.api.listOutlines(novel.id))
    toast('已调整顺序', 'success')
  }

  const handleDragEnd = () => {
    setDragId(null)
    setDragOverId(null)
  }

  const renderTree = (pid, depth) => {
    const kids = children(pid)
    if (kids.length === 0) return null
    return (
      <div style={{ paddingLeft: depth > 0 ? 18 : 0 }}>
        {kids.map((it) => {
          const hasKids = children(it.id).length > 0
          const isCollapsed = !!collapsed[it.id]
          return (
            <div key={it.id}>
              <div
                className={`tree-item ${current?.id === it.id ? 'active' : ''}`}
                onClick={() => openEdit(it)}
                draggable
                onDragStart={(e) => handleDragStart(e, it.id)}
                onDragOver={(e) => handleDragOver(e, it.id)}
                onDrop={(e) => handleDrop(e, it.id)}
                onDragEnd={handleDragEnd}
                style={{
                  opacity: isCollapsed ? 0.5 : 1,
                  borderTop: dragOverId === it.id ? '2px solid var(--accent)' : undefined,
                  transition: 'border-color 0.15s',
                }}
              >
                {hasKids && (
                  <button
                    className='ghost'
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleCollapse(it.id)
                    }}
                    style={{ flexShrink: 0 }}
                  >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}
                <span
                  className='badge'
                  style={{ flexShrink: 0, background: TYPE_COLORS[it.type] || 'var(--accent)', color: '#fff' }}
                >
                  {it.type}
                </span>
                <span className='grow' title={it.title}>
                  {it.title}
                </span>
                <button
                  className='ghost small'
                  onClick={(e) => {
                    e.stopPropagation()
                    create(it.id)
                  }}
                >
                  ＋子
                </button>
                <button
                  className='ghost small danger'
                  onClick={(e) => {
                    e.stopPropagation()
                    del(it.id)
                  }}
                >
                  ×
                </button>
              </div>
              {!isCollapsed && renderTree(it.id, depth + 1)}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className='main' style={{ flex: 1 }}>
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
              <h3>大纲</h3>
              <button className='small primary' onClick={() => create()}>
                +新节点
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {items.length === 0 ? (
                <div className='empty-state'>
                  <div className='hint'>创建大纲节点，可多层嵌套（卷、章、建议、剧情线..）。</div>
                </div>
              ) : (
                renderTree(null, 0)
              )}
            </div>
          </div>
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
          <button className='ghost' title='展开大纲' onClick={() => setLeftPanelOpen(true)}>
            <PanelLeftOpen size={18} />
          </button>
        </div>
      )}

      <div style={{ flex: 1, padding: 16, overflow: 'auto', minWidth: 0 }}>
        {form ? (
          <div className='card' style={{ maxWidth: 760 }}>
            <div className='row' style={{ marginBottom: 12 }}>
              <b>编辑大纲节点</b>
              <div className='grow' />
              <button className='ghost small' onClick={() => setForm(null)}>
                关闭
              </button>
            </div>
            <div className='form-grid'>
              <div className='form-field'>
                <label>标题</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className='form-field'>
                <label>类型</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className='form-field full'>
                <label>内容</label>
                <textarea
                  rows={16}
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder='剧情梗概、冲突、伏笔说明、发展脉络..'
                />
              </div>
            </div>
            <div className='row right mt8'>
              <button className='danger' onClick={() => del(form.id)}>
                删除
              </button>
              <div className='grow' />
              <button onClick={() => setForm(null)}>取消</button>
              <button className='primary' onClick={save}>
                保存
              </button>
            </div>
          </div>
        ) : (
          <div className='empty-state'>
            <div className='hint'>
              点击左侧节点进行编辑。
              <br />
              建议：先写「卷/幕」级主干，在「章」级推进 、关键节点与伏笔。
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
