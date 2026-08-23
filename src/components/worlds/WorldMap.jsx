import { useState, useEffect, useRef, useCallback } from 'react'
import { Mountain, Building2, Home, Waves, TreePine, Plus, Link, Trash2 } from 'lucide-react'
import { useToast } from '../../ToastContext.jsx'
import { useDialog } from '../../Dialog.jsx'

const ICONS = [
  { id: 'mountain', label: '山', Icon: Mountain },
  { id: 'building', label: '城镇', Icon: Building2 },
  { id: 'home', label: '村庄', Icon: Home },
  { id: 'waves', label: '河流', Icon: Waves },
  { id: 'tree', label: '森林', Icon: TreePine },
]

const COLORS = [
  '#7c7cf0', '#5ba3ff', '#22c55e', '#f59e0b', '#e06c75', '#ec4899', '#94a3b8', '#e6e6ef',
]

const ICON_MAP = { mountain: Mountain, building: Building2, home: Home, waves: Waves, tree: TreePine }

function forceLayout(nodes, edges) {
  const W = 1000, H = 620
  const cx = W / 2, cy = H / 2
  const R = Math.min(W, H) / 2 - 70
  const n = nodes.length
  const pts = nodes.map((nd, i) => {
    // 如果节点有保存的位置（非默认值），直接使用
    if (nd.x !== 0 || nd.y !== 0) return { ...nd }
    const a = (i / n) * Math.PI * 2
    return { ...nd, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }
  })
  const repel = 2600, spring = 0.012, rest = 150, centerPull = 0.004, clamp = 2.5
  for (let it = 0; it < 200; it++) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = pts[i], b = pts[j]
        const dx = b.x - a.x, dy = b.y - a.y
        const d = Math.hypot(dx, dy) || 1
        const f = repel / (d * d + 40)
        const fx = (dx / d) * f, fy = (dy / d) * f
        a.x -= Math.max(-clamp, Math.min(clamp, fx))
        a.y -= Math.max(-clamp, Math.min(clamp, fy))
        b.x += Math.max(-clamp, Math.min(clamp, fx))
        b.y += Math.max(-clamp, Math.min(clamp, fy))
      }
    }
    for (const e of edges) {
      const a = pts.find(x => x.id === e.from_id), b = pts.find(x => x.id === e.to_id)
      if (!a || !b) continue
      const dx = b.x - a.x, dy = b.y - a.y
      const d = Math.hypot(dx, dy) || 1
      const f = spring * (d - rest)
      const fx = (dx / d) * f, fy = (dy / d) * f
      a.x += Math.max(-clamp, Math.min(clamp, fx))
      a.y += Math.max(-clamp, Math.min(clamp, fy))
      b.x -= Math.max(-clamp, Math.min(clamp, fx))
      b.y -= Math.max(-clamp, Math.min(clamp, fy))
    }
    for (const nd of pts) {
      nd.x += (cx - nd.x) * centerPull
      nd.y += (cy - nd.y) * centerPull
    }
  }
  return pts
}

export default function WorldMap({ novel }) {
  const toast = useToast()
  const { prompt, confirm } = useDialog()
  const [views, setViews] = useState([])
  const [currentViewId, setCurrentViewId] = useState(0)
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [hover, setHover] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedEdge, setSelectedEdge] = useState(null)
  const [linkMode, setLinkMode] = useState(false)
  const [linkFrom, setLinkFrom] = useState(null)
  const [dragging, setDragging] = useState(null)
  const svgRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [panning, setPanning] = useState(false)
  const panStartRef = useRef(null)
  const [layoutNodes, setLayoutNodes] = useState([])
  const dragRef = useRef(null) // 拖拽状态引用
  const rafRef = useRef(null) // requestAnimationFrame 引用

  const loadViews = useCallback(async () => {
    let v = await window.api.listMapViews(novel.id, 'worldmap')
    if (v.length === 0) {
      const defaultView = await window.api.createMapView(novel.id, 'worldmap', '默认地图')
      v = [defaultView]
    }
    setViews(v)
    if (!v.find(x => x.id === currentViewId)) {
      setCurrentViewId(v[0].id)
    }
  }, [novel.id, currentViewId])

  const load = useCallback(async () => {
    const [n, e] = await Promise.all([window.api.listMapNodes(novel.id, currentViewId), window.api.listMapEdges(novel.id, currentViewId)])
    setNodes(n)
    setEdges(e)
    // 计算布局
    if (n.length > 0) {
      const laid = forceLayout(n, e)
      setLayoutNodes(laid)
    } else {
      setLayoutNodes([])
    }
  }, [novel.id, currentViewId])

  useEffect(() => { loadViews() }, [loadViews])
  useEffect(() => { load() }, [load])

  const getSvgPoint = (e) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = e.clientX; pt.y = e.clientY
    return pt.matrixTransform(svg.getScreenCTM().inverse())
  }

  const dragMoved = useRef(false)

  const handleDragStart = (e, nd) => {
    e.stopPropagation()
    dragMoved.current = false
    const pt = getSvgPoint(e)
    dragRef.current = { id: nd.id, startX: pt.x, startY: pt.y, nodeStartX: nd.x, nodeStartY: nd.y }
    setDragging(dragRef.current)
  }

  const handleDragMove = useCallback((e) => {
    if (!dragRef.current) return
    e.preventDefault()
    
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    
    rafRef.current = requestAnimationFrame(() => {
      const drag = dragRef.current
      if (!drag) return
      
      const pt = getSvgPoint(e)
      const dx = pt.x - drag.startX, dy = pt.y - drag.startY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMoved.current = true
      
      if (dragMoved.current) {
        const newX = drag.nodeStartX + dx
        const newY = drag.nodeStartY + dy
        setLayoutNodes(prev => prev.map(nd => 
          nd.id === drag.id ? { ...nd, x: newX, y: newY } : nd
        ))
      }
    })
  }, [])

  const handleDragEnd = useCallback(() => {
    if (dragRef.current && dragMoved.current) {
      const drag = dragRef.current
      setLayoutNodes(prev => {
        const nd = prev.find(n => n.id === drag.id)
        if (nd) {
          // 保存位置到数据库
          window.api.updateMapNode(drag.id, { x: nd.x, y: nd.y })
        }
        return prev
      })
    }
    dragRef.current = null
    setDragging(null)
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(s => Math.max(0.3, Math.min(3, s * delta)))
  }, [])

  const handlePanStart = useCallback((e) => {
    if (e.button !== 1) return // 只响应中键
    e.preventDefault()
    setPanning(true)
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
  }, [pan])

  const handlePanMove = useCallback((e) => {
    if (!panning || !panStartRef.current) return
    setPan({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y })
  }, [panning])

  const handlePanEnd = useCallback(() => {
    setPanning(false)
    panStartRef.current = null
  }, [])

  const resetView = useCallback(() => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const handleNodeClick = (nd) => {
    if (dragMoved.current) return
    if (linkMode) {
      if (!linkFrom) { setLinkFrom(nd.id); return }
      if (linkFrom !== nd.id) {
        window.api.createMapEdge(novel.id, linkFrom, nd.id, '', currentViewId).then(() => { load(); toast('已连接', 'success') })
      }
      setLinkFrom(null); setLinkMode(false)
      return
    }
    setSelectedNode(selectedNode === nd.id ? null : nd.id)
    setSelectedEdge(null)
  }

  const addNode = async () => {
    const name = await prompt({ title: '地点名称', value: '新地点' })
    if (!name) return
    await window.api.createMapNode(novel.id, { name, x: 400 + Math.random() * 200, y: 200 + Math.random() * 200, view_id: currentViewId })
    load()
  }

  const [aiBusy, setAiBusy] = useState(false)
  const aiGenerate = async () => {
    setAiBusy(true)
    try {
      const [worlds, items] = await Promise.all([
        window.api.listWorlds(novel.id),
        window.api.listItems(novel.id),
      ])
      // 收集所有地理和地点相关设定，包含完整内容供AI分析
      const places = []
      for (const w of worlds) {
        if (w.category === '地理' || w.category === '势力组织') {
          places.push({ name: w.name, content: (w.content || '').slice(0, 500) })
        }
      }
      for (const it of items) {
        if (it.category === '关键地点') {
          places.push({ name: it.name, content: (it.description || '').slice(0, 500) })
        }
      }
      if (!places.length) {
        toast('没有地点数据，请先在「世界设定」添加地理条目，或在「物品」里添加关键地点', 'error')
        return
      }
      // 去重
      const unique = []
      const seen = new Set()
      for (const p of places) {
        if (!seen.has(p.name)) {
          seen.add(p.name)
          unique.push(p)
        }
      }
      // 调用 AI 为地点分配图标、颜色、描述和连线关系
      const text = unique.map((p, i) => `${i + 1}. ${p.name}：${p.content}`).join('\n\n')
      const result = await window.api.aiGenerateMapNodes(text)
      // 清除旧数据
      for (const e of edges) await window.api.deleteMapEdge(e.id)
      for (const n of nodes) await window.api.deleteMapNode(n.id)
      // 使用 AI 返回的属性创建节点，位置由布局算法自动计算
      const nodeList = result.nodes || unique.map(p => ({
        name: p.name,
        icon: 'building',
        color: '#22c55e',
        note: p.content.slice(0, 60),
      }))
      // 确保所有原始地点都被包含
      const aiNames = new Set(nodeList.map(n => n.name))
      for (const p of unique) {
        if (!aiNames.has(p.name)) {
          nodeList.push({
            name: p.name,
            icon: 'building',
            color: '#22c55e',
            note: p.content.slice(0, 60),
          })
        }
      }
      // 创建节点
      const nodeMap = {}
      for (const p of nodeList) {
        const created = await window.api.createMapNode(novel.id, {
          name: p.name,
          icon: p.icon || 'building',
          color: p.color || '#22c55e',
          note: p.note || '',
          view_id: currentViewId,
          x: 0,
          y: 0,
        })
        nodeMap[p.name] = created.id
      }
      // 创建连线（使用 AI 返回的连线或默认顺序连线）
      if (result.edges?.length) {
        for (const e of result.edges) {
          const fromId = nodeMap[e.from]
          const toId = nodeMap[e.to]
          if (fromId && toId) {
            await window.api.createMapEdge(novel.id, fromId, toId, e.label || '', currentViewId)
          }
        }
      } else {
        // 默认顺序连线
        for (let i = 0; i < nodeList.length - 1; i++) {
          const fromId = nodeMap[nodeList[i].name]
          const toId = nodeMap[nodeList[i + 1].name]
          if (fromId && toId) {
            await window.api.createMapEdge(novel.id, fromId, toId, '', currentViewId)
          }
        }
      }
      load()
      toast(`已生成 ${nodeList.length} 个地点`, 'success')
    } catch (e) {
      toast(`生成失败：${e.message}`, 'error', 5000)
    } finally {
      setAiBusy(false)
    }
  }

  const deleteSelected = async () => {
    if (selectedEdge) {
      if (!(await confirm({ title: '删除连线', message: '确定删除这条连线？', danger: true }))) return
      await window.api.deleteMapEdge(selectedEdge)
      setSelectedEdge(null)
      load()
      return
    }
    if (!selectedNode) return
    if (!(await confirm({ title: '删除地点', message: '确定删除该地点？连线也会一并删除。', danger: true }))) return
    await window.api.deleteMapNode(selectedNode)
    setSelectedNode(null)
    load()
  }

  const updateNodeField = async (id, patch) => {
    await window.api.updateMapNode(id, patch)
    load()
  }

  const selected = layoutNodes.find(n => n.id === selectedNode)

  // 计算动态 viewBox，适应所有节点位置
  const getViewBox = () => {
    if (layoutNodes.length === 0) return '0 0 1000 620'
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const nd of layoutNodes) {
      minX = Math.min(minX, nd.x)
      minY = Math.min(minY, nd.y)
      maxX = Math.max(maxX, nd.x)
      maxY = Math.max(maxY, nd.y)
    }
    const padding = 100
    const vbX = minX - padding
    const vbY = minY - padding
    const vbW = Math.max(1000, maxX - minX + padding * 2)
    const vbH = Math.max(620, maxY - minY + padding * 2)
    return `${vbX} ${vbY} ${vbW} ${vbH}`
  }

  const addView = async () => {
    const name = await prompt({ title: '视图名称', value: `地图 ${views.length + 1}` })
    if (!name) return
    const v = await window.api.createMapView(novel.id, 'worldmap', name)
    setViews(prev => [...prev, v])
    setCurrentViewId(v.id)
  }

  const renameView = async (id) => {
    const v = views.find(x => x.id === id)
    if (!v) return
    const name = await prompt({ title: '重命名视图', value: v.name })
    if (!name) return
    await window.api.updateMapView(id, { name })
    setViews(prev => prev.map(x => x.id === id ? { ...x, name } : x))
  }

  const deleteView = async (id) => {
    if (views.length <= 1) { toast('至少保留一个视图', 'error'); return }
    if (!(await confirm({ title: '删除视图', message: '确定删除该视图？视图中的所有地点和连线都会删除。', danger: true }))) return
    await window.api.deleteMapView(id)
    const newViews = views.filter(x => x.id !== id)
    setViews(newViews)
    if (currentViewId === id) {
      setCurrentViewId(newViews[0]?.id || 0)
    }
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: 12 }}>
      {/* 视图标签栏 */}
      <div className='row' style={{ marginBottom: 8, gap: 2, overflow: 'auto', flexWrap: 'nowrap' }}>
        {views.map(v => (
          <div key={v.id} className={`tab ${currentViewId === v.id ? 'active' : ''}`}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
            onClick={() => setCurrentViewId(v.id)}>
            <span onDoubleClick={() => renameView(v.id)}>{v.name}</span>
            {views.length > 1 && (
              <span className='ghost' style={{ fontSize: 14, lineHeight: 1, padding: '0 2px', cursor: 'pointer' }}
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); deleteView(v.id) }}>×</span>
            )}
          </div>
        ))}
        <button className='ghost small' onClick={addView} title='新建视图' style={{ flexShrink: 0 }}>+</button>
      </div>

      <div className='row' style={{ marginBottom: 10, gap: 6, flexWrap: 'wrap' }}>
        <button className='small primary' onClick={aiGenerate} disabled={aiBusy}>
          {aiBusy ? '生成中...' : 'AI 生成地图'}
        </button>
        <button className='small' onClick={addNode}><Plus size={14} /> 添加地点</button>
        <button className='small' onClick={() => { setLinkMode(!linkMode); setLinkFrom(null) }}
          style={{ background: linkMode ? 'var(--accent)' : undefined, color: linkMode ? '#fff' : undefined }}>
          <Link size={14} /> {linkMode ? '取消连线' : '连线'}
        </button>
        <button className='small' onClick={deleteSelected} disabled={!selectedNode && !selectedEdge}><Trash2 size={14} /> 删除</button>
        <div className='grow' />
        <button className='small' onClick={() => setScale(s => Math.min(3, s * 1.2))} title='放大'>+</button>
        <span className='hint' style={{ fontSize: 11, minWidth: 36, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
        <button className='small' onClick={() => setScale(s => Math.max(0.3, s * 0.8))} title='缩小'>-</button>
        <button className='small' onClick={resetView} title='重置视图'>重置</button>
        <span className='hint' style={{ fontSize: 11 }}>左键拖动节点，滚轮缩放</span>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 10 }}>
        {/* 画布 */}
        <div style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}
          onWheel={handleWheel} onMouseDown={handlePanStart} onMouseMove={handlePanMove} onMouseUp={handlePanEnd} onMouseLeave={handlePanEnd}>
          {layoutNodes.length === 0 ? (
            <div className='empty-state'><div className='hint'>点击「添加地点」开始构建世界地图</div></div>
          ) : (
            <svg ref={svgRef} viewBox={getViewBox()} width='100%' height='100%'
              style={{ cursor: linkMode ? 'crosshair' : panning ? 'grabbing' : 'default', transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: 'center center' }}
              onMouseMove={handleDragMove} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd}
              onClick={() => { setSelectedNode(null); setSelectedEdge(null) }}>
              {/* 连线 */}
              {edges.map(e => {
                const a = layoutNodes.find(n => n.id === e.from_id), b = layoutNodes.find(n => n.id === e.to_id)
                if (!a || !b) return null
                const isEdgeSelected = selectedEdge === e.id
                return (
                  <g key={e.id}>
                    <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={isEdgeSelected ? 'var(--accent)' : 'var(--border)'} strokeWidth={isEdgeSelected ? 4 : 2}
                      style={{ cursor: 'pointer' }}
                      onClick={(ev) => { ev.stopPropagation(); setSelectedEdge(isEdgeSelected ? null : e.id); setSelectedNode(null) }} />
                    {e.label && <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 8} textAnchor='middle' fontSize={11} fill='var(--text-2)'>{e.label}</text>}
                  </g>
                )
              })}
              {/* 节点 */}
              {layoutNodes.map(nd => {
                const IconComp = ICON_MAP[nd.icon] || Mountain
                const isSelected = selectedNode === nd.id
                const isHover = hover === nd.id
                const r = isSelected ? 28 : isHover ? 26 : 24
                return (
                  <g key={nd.id} transform={`translate(${nd.x},${nd.y})`}
                    onMouseEnter={() => setHover(nd.id)} onMouseLeave={() => setHover(null)}
                    onMouseDown={(e) => handleDragStart(e, nd)}
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); handleNodeClick(nd) }}
                    style={{ cursor: dragging?.id === nd.id ? 'grabbing' : 'grab' }}>
                    <circle r={r} fill={nd.color + '33'} stroke={isSelected ? 'var(--accent)' : nd.color} strokeWidth={isSelected ? 3 : 2} />
                    <foreignObject x={-12} y={-12} width={24} height={24} style={{ pointerEvents: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: nd.color }}>
                        <IconComp size={18} />
                      </div>
                    </foreignObject>
                    <text y={r + 14} textAnchor='middle' fontSize={12} fill='var(--text)' fontWeight={isSelected ? 600 : 400}>{nd.name}</text>
                  </g>
                )
              })}
            </svg>
          )}
        </div>

        {/* 属性面板 */}
        {selected && (
          <div style={{ width: 220, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <b>编辑地点</b>
            <div className='form-field'>
              <label>名称</label>
              <input value={selected.name} onChange={e => updateNodeField(selected.id, { name: e.target.value })} />
            </div>
            <div className='form-field'>
              <label>图标</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {ICONS.map(ic => (
                  <button key={ic.id} className='small' title={ic.label}
                    onClick={() => updateNodeField(selected.id, { icon: ic.id })}
                    style={{ background: selected.icon === ic.id ? 'var(--accent)' : undefined, color: selected.icon === ic.id ? '#fff' : undefined }}>
                    <ic.Icon size={16} />
                  </button>
                ))}
              </div>
            </div>
            <div className='form-field'>
              <label>颜色</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => updateNodeField(selected.id, { color: c })}
                    style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', border: selected.color === c ? '2px solid var(--text)' : '2px solid transparent' }} />
                ))}
              </div>
            </div>
            <div className='form-field'>
              <label>备注</label>
              <textarea rows={3} value={selected.note || ''} onChange={e => updateNodeField(selected.id, { note: e.target.value })} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
