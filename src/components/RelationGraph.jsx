import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { Circle, Triangle, Square, User, UserRound, Baby, PersonStanding, Dog, Skull, Crown } from 'lucide-react'

const ROLE_COLOR = {
  主角: '#7c7cf0',
  女主: '#5ba3ff',
  重要配角: '#5ba3ff',
  反派: '#e06c75',
  配角: '#8b8ba8',
  龙套: '#5b5b76',
  未定: '#5b5b76',
}

const CUSTOM_COLORS = [
  { id: 'role', label: '按角色', color: null },
  { id: '#7c7cf0', label: '紫色', color: '#7c7cf0' },
  { id: '#5ba3ff', label: '蓝色', color: '#5ba3ff' },
  { id: '#22c55e', label: '绿色', color: '#22c55e' },
  { id: '#f59e0b', label: '橙色', color: '#f59e0b' },
  { id: '#e06c75', label: '红色', color: '#e06c75' },
  { id: '#ec4899', label: '粉色', color: '#ec4899' },
  { id: '#94a3b8', label: '灰色', color: '#94a3b8' },
  { id: '#e6e6ef', label: '白色', color: '#e6e6ef' },
]

const CHAR_ICON_MAP = { male: User, female: UserRound, child: Baby, elder: PersonStanding, beast: Dog, dead: Skull, royal: Crown }

const SHAPES = [
  { id: 'circle', label: '圆形', icon: Circle },
  { id: 'triangle', label: '三角', icon: Triangle },
  { id: 'square', label: '方形', icon: Square },
]

function hashColor(s) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360
  return `hsl(${h}, 55%, 62%)`
}

// 力导向布局：斥力 + 沿边弹簧 + 中心引力
function computeLayout(chars, rels) {
  const W = 1000,
    H = 620
  const nodes = chars.map((c) => ({ id: c.id, name: c.name, role: c.role, icon: c.icon, x: 0, y: 0, deg: 0 }))
  const n = nodes.length
  const cx = W / 2,
    cy = H / 2
  const R = Math.min(W, H) / 2 - 70
  nodes.forEach((nd, i) => {
    const a = (i / n) * Math.PI * 2
    nd.x = cx + R * Math.cos(a)
    nd.y = cy + R * Math.sin(a)
  })
  const edges = rels.map((r) => ({ a: r.char_a_id, b: r.char_b_id, type: r.type, dir: r.direction }))

  // 节点度（关系数）
  const degree = {}
  for (const e of edges) {
    degree[e.a] = (degree[e.a] || 0) + 1
    degree[e.b] = (degree[e.b] || 0) + 1
  }

  const repel = 2600
  const spring = 0.012
  const rest = 150
  const centerPull = 0.004
  const clamp = 2.5

  for (let it = 0; it < 260; it++) {
    // 斥力 O(n^2)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = nodes[i],
          b = nodes[j]
        const dx = b.x - a.x,
          dy = b.y - a.y
        const d = Math.hypot(dx, dy) || 1
        const f = repel / (d * d + 40)
        const fx = (dx / d) * f,
          fy = (dy / d) * f
        a.x -= Math.max(-clamp, Math.min(clamp, fx))
        a.y -= Math.max(-clamp, Math.min(clamp, fy))
        b.x += Math.max(-clamp, Math.min(clamp, fx))
        b.y += Math.max(-clamp, Math.min(clamp, fy))
      }
    }
    // 弹簧
    for (const e of edges) {
      const a = nodes.find((x) => x.id === e.a),
        b = nodes.find((x) => x.id === e.b)
      if (!a || !b) continue
      const dx = b.x - a.x,
        dy = b.y - a.y
      const d = Math.hypot(dx, dy) || 1
      const f = spring * (d - rest)
      const fx = (dx / d) * f,
        fy = (dy / d) * f
      a.x += Math.max(-clamp, Math.min(clamp, fx))
      a.y += Math.max(-clamp, Math.min(clamp, fy))
      b.x -= Math.max(-clamp, Math.min(clamp, fx))
      b.y -= Math.max(-clamp, Math.min(clamp, fy))
    }
    // 中心引力
    for (const nd of nodes) {
      nd.x += (cx - nd.x) * centerPull
      nd.y += (cy - nd.y) * centerPull
    }
  }
  return { nodes, edges, degree }
}

// 根据形状和大小生成节点 SVG 路径
function NodeShape({ shape, cx, cy, r, fill, stroke, strokeWidth }) {
  if (shape === 'triangle') {
    const h = r * 1.8
    const points = `${cx},${cy - h * 0.6} ${cx - r},${cy + h * 0.4} ${cx + r},${cy + h * 0.4}`
    return <polygon points={points} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
  }
  if (shape === 'square') {
    const s = r * 1.5
    return <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s} rx={3} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
  }
  // 默认圆形
  return <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
}

export default function RelationGraph({ novel, onOpenCharacter: _onOpenCharacter }) {
  const [data, setData] = useState(null)
  const [hover, setHover] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [nodeStyles, setNodeStyles] = useState({})
  const [dragging, setDragging] = useState(null)
  const [sizeOffsets, setSizeOffsets] = useState({})
  const [posOverrides, setPosOverrides] = useState({})
  const svgRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [panning, setPanning] = useState(false)
  const panStartRef = useRef(null)

  useEffect(() => {
    Promise.all([window.api.listCharacters(novel.id), window.api.listRelations(novel.id)]).then(([chars, rels]) =>
      setData({ chars, rels })
    )
  }, [novel.id])

  const layout = useMemo(() => {
    if (!data || data.chars.length === 0) return null
    const l = computeLayout(data.chars, data.rels)
    l.nodes.forEach((nd) => {
      if (posOverrides[nd.id]) {
        nd.x = posOverrides[nd.id].x
        nd.y = posOverrides[nd.id].y
      }
    })
    return l
  }, [data, posOverrides])

  // 获取 SVG 坐标
  const getSvgPoint = (e) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const ctm = svg.getScreenCTM().inverse()
    return pt.matrixTransform(ctm)
  }

  // 拖拽开始
  const handleDragStart = (e, nd) => {
    e.stopPropagation()
    e.preventDefault()
    const pt = getSvgPoint(e)
    setDragging({
      id: nd.id,
      startX: pt.x,
      startY: pt.y,
      nodeStartX: nd.x,
      nodeStartY: nd.y,
    })
  }

  // 拖拽中
  const handleMouseMove = (e) => {
    if (!dragging) return
    const pt = getSvgPoint(e)
    const dx = pt.x - dragging.startX
    const dy = pt.y - dragging.startY
    setPosOverrides((prev) => ({
      ...prev,
      [dragging.id]: {
        x: Math.max(30, Math.min(W - 30, dragging.nodeStartX + dx)),
        y: Math.max(30, Math.min(H - 30, dragging.nodeStartY + dy)),
      },
    }))
  }

  // 拖拽结束
  const handleMouseUp = () => {
    setDragging(null)
  }

  // 滚轮调整节点大小
  const handleWheel = (e, nd) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -1 : 1
    setSizeOffsets((prev) => ({
      ...prev,
      [nd.id]: Math.max(-8, Math.min(15, (prev[nd.id] || 0) + delta)),
    }))
  }

  // 缩放和平移
  const handleCanvasWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(s => Math.max(0.3, Math.min(3, s * delta)))
  }, [])

  const handlePanStart = useCallback((e) => {
    if (e.button !== 1) return
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

  if (!data) return <div className='loading'>关系网加载中...</div>
  if (data.chars.length === 0) {
    return (
      <div className='empty-state'>
        <div className='hint'>
          还没有人物。先在「人物列表」建立角色，再在这里查看人物关系网。
          <br />
          在人物编辑面板中可为角色建立关系。
        </div>
      </div>
    )
  }
  if (data.rels.length === 0) {
    return (
      <div className='empty-state'>
        <div className='hint'>已有人物但还没有关系。在人物编辑面板中点击「+ 关系」建立人物之间的连线。</div>
      </div>
    )
  }

  const W = 1000,
    H = 620
  const linked = hover
    ? new Set([hover, ...layout.edges.filter((e) => e.a === hover || e.b === hover).flatMap((e) => [e.a, e.b])])
    : null

  const getNodeColor = (nd) => {
    const style = nodeStyles[nd.id]
    if (style?.color) return style.color
    return ROLE_COLOR[nd.role] || '#8b8ba8'
  }

  const getNodeShape = (nd) => {
    const style = nodeStyles[nd.id]
    return style?.shape || 'circle'
  }

  const updateSelectedStyle = (key, value) => {
    if (!selectedNode) return
    setNodeStyles((prev) => ({
      ...prev,
      [selectedNode]: { ...prev[selectedNode], [key]: value },
    }))
  }

  const selectedStyle = selectedNode ? (nodeStyles[selectedNode] || {}) : {}
  const currentShape = selectedStyle.shape || 'circle'
  const currentColor = selectedStyle.color || ''

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: 8 }}>
      {/* 工具栏 */}
      <div className='row' style={{ padding: '4px 8px', gap: 12, flexWrap: 'wrap' }}>
        <span className='hint'>共 {data.chars.length} 个角色 · {data.rels.length} 条关系 · 拖拽移动节点，滚轮调整大小</span>
        <div className='grow' />
        <button className='small' onClick={() => setScale(s => Math.min(3, s * 1.2))} title='放大'>+</button>
        <span className='hint' style={{ fontSize: 11, minWidth: 36, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
        <button className='small' onClick={() => setScale(s => Math.max(0.3, s * 0.8))} title='缩小'>-</button>
        <button className='small' onClick={resetView} title='重置视图'>重置</button>
        {selectedNode ? (
          <>
            <span className='badge accent'>{data.chars.find((c) => c.id === selectedNode)?.name || '节点'}</span>
            {/* 形状选择 */}
            <div className='row' style={{ gap: 4 }}>
              <span className='hint' style={{ fontSize: 11 }}>形状：</span>
              {SHAPES.map((s) => (
                <button
                  key={s.id}
                  className={`small ${currentShape === s.id ? 'primary' : ''}`}
                  onClick={() => updateSelectedStyle('shape', s.id)}
                  title={s.label}
                  style={{ padding: '2px 6px' }}
                >
                  <s.icon size={14} />
                </button>
              ))}
            </div>
            {/* 颜色选择 */}
            <div className='row' style={{ gap: 4 }}>
              <span className='hint' style={{ fontSize: 11 }}>颜色：</span>
              {CUSTOM_COLORS.map((c) => (
                <button
                  key={c.id}
                  className={`small ${currentColor === (c.color || '') ? 'primary' : ''}`}
                  onClick={() => updateSelectedStyle('color', c.color || '')}
                  title={c.label}
                  style={{
                    padding: '2px 6px',
                    minWidth: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {c.color ? (
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: c.color,
                        border: '1px solid var(--border)',
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: 10 }}>R</span>
                  )}
                </button>
              ))}
            </div>
          </>
        ) : (
          <span className='hint' style={{ fontSize: 11 }}>点击节点选中后可修改形状和颜色</span>
        )}
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
        }}
        onWheel={handleCanvasWheel}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio='xMidYMid meet'
          style={{ width: '100%', height: '100%', cursor: dragging ? 'grabbing' : panning ? 'grabbing' : 'default', transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: 'center center' }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <marker
              id='arrow'
              viewBox='0 0 10 10'
              refX='11'
              refY='5'
              markerWidth='7'
              markerHeight='7'
              orient='auto-start-reverse'
            >
              <path d='M0,0 L10,5 L0,10 z' fill='#8b8ba8' />
            </marker>
          </defs>

          {/* 连线 */}
          {layout.edges.map((e, i) => {
            const a = layout.nodes.find((x) => x.id === e.a)
            const b = layout.nodes.find((x) => x.id === e.b)
            if (!a || !b) return null
            const dim = linked && (!linked.has(e.a) || !linked.has(e.b))
            const active = hover && !dim
            const mx = (a.x + b.x) / 2
            const my = (a.y + b.y) / 2
            return (
              <g key={i} opacity={dim ? 0.08 : active ? 1 : 0.5}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={hashColor(e.type)}
                  strokeWidth={active ? 3 : 1.6}
                  markerEnd={e.dir === '单向' ? 'url(#arrow)' : undefined}
                />
                {active && (
                  <text
                    x={mx}
                    y={my - 4}
                    textAnchor='middle'
                    fontSize={12}
                    fill='#e6e6ef'
                    stroke='#1e1e2e'
                    strokeWidth={3}
                    paintOrder='stroke'
                  >
                    {e.type}
                  </text>
                )}
              </g>
            )
          })}

          {/* 节点 */}
          {layout.nodes.map((nd) => {
            const baseR = 12 + Math.min(10, (layout.degree[nd.id] || 0) * 3)
            const r = baseR + (sizeOffsets[nd.id] || 0)
            const dim = linked && !linked.has(nd.id)
            const color = getNodeColor(nd)
            const nodeShape = getNodeShape(nd)
            const isDragging = dragging?.id === nd.id
            const isSelected = selectedNode === nd.id
            return (
              <g
                key={nd.id}
                opacity={dim ? 0.15 : 1}
                style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
                onMouseDown={(e) => handleDragStart(e, nd)}
                onClick={() => setSelectedNode(isSelected ? null : nd.id)}
                onWheel={(e) => handleWheel(e, nd)}
                onMouseEnter={() => setHover(nd.id)}
                onMouseLeave={() => setHover(null)}
              >
                <NodeShape
                  shape={nodeShape}
                  cx={nd.x}
                  cy={nd.y}
                  r={r}
                  fill={color}
                  stroke={isSelected ? '#f59e0b' : hover === nd.id || isDragging ? '#fff' : '#1e1e2e'}
                  strokeWidth={isSelected ? 3 : isDragging ? 3 : 2}
                />
                {(() => { const Ic = CHAR_ICON_MAP[nd.icon]; return Ic ? (
                  <foreignObject x={nd.x - 10} y={nd.y - 10} width={20} height={20} style={{ pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#fff' }}>
                      <Ic size={14} />
                    </div>
                  </foreignObject>
                ) : null })()}
                <text
                  x={nd.x}
                  y={nd.y + r + 14}
                  textAnchor='middle'
                  fontSize={13}
                  fontWeight={hover === nd.id ? 700 : 500}
                  fill={hover === nd.id ? '#fff' : '#a0a0b8'}
                  stroke='#1e1e2e'
                  strokeWidth={3}
                  paintOrder='stroke'
                  style={{ pointerEvents: 'none' }}
                >
                  {nd.name}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
