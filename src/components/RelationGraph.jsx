import { useEffect, useMemo, useState } from 'react'

const ROLE_COLOR = {
  主角: '#7c7cf0',
  女主: '#5ba3ff',
  重要配角: '#5ba3ff',
  反派: '#e06c75',
  配角: '#8b8ba8',
  龙套: '#5b5b76',
  未定: '#5b5b76',
}

function hashColor(s) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360
  return `hsl(${h}, 55%, 62%)`
}

// 力导向布局：斥t+ 沿边弹簧 + 中心引力
function computeLayout(chars, rels) {
  const W = 1000,
    H = 620
  const nodes = chars.map((c) => ({ id: c.id, name: c.name, role: c.role, x: 0, y: 0, deg: 0 }))
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

export default function RelationGraph({ novel, onOpenCharacter }) {
  const [data, setData] = useState(null)
  const [hover, setHover] = useState(null)

  useEffect(() => {
    Promise.all([window.api.listCharacters(novel.id), window.api.listRelations(novel.id)]).then(([chars, rels]) =>
      setData({ chars, rels })
    )
  }, [novel.id])

  const layout = useMemo(() => {
    if (!data || data.chars.length === 0) return null
    return computeLayout(data.chars, data.rels)
  }, [data])

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

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: 8 }}>
      <div className='hint' style={{ padding: '4px 8px' }}>
        共 {data.chars.length} 个角色· {data.rels.length} 条关系·
        悬停节点高亮关系，点击节点编辑人物；连线上为关系类型。{' '}
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio='xMidYMid meet' style={{ width: '100%', height: '100%' }}>
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
            const r = 12 + Math.min(10, (layout.degree[nd.id] || 0) * 3)
            const dim = linked && !linked.has(nd.id)
            const color = ROLE_COLOR[nd.role] || '#8b8ba8'
            return (
              <g
                key={nd.id}
                opacity={dim ? 0.15 : 1}
                style={{ cursor: 'pointer' }}
                onClick={() => onOpenCharacter && onOpenCharacter(nd.id)}
                onMouseEnter={() => setHover(nd.id)}
                onMouseLeave={() => setHover(null)}
              >
                <circle
                  cx={nd.x}
                  cy={nd.y}
                  r={r}
                  fill={color}
                  stroke={hover === nd.id ? '#fff' : '#1e1e2e'}
                  strokeWidth={2}
                />
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
