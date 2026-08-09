import { useState, useEffect, useMemo } from 'react'
import { ListTree, Users, Globe, ChevronRight, ChevronDown } from 'lucide-react'
import RelationGraph from './RelationGraph.jsx'

const TABS = [
  { key: 'outline', label: '大纲图谱', icon: ListTree },
  { key: 'relation', label: '人物关系网', icon: Users },
  { key: 'world', label: '世界观层级', icon: Globe },
]

function buildOutlineTree(items) {
  const map = {}
  const roots = []
  for (const item of items) {
    map[item.id] = { ...item, children: [] }
  }
  for (const item of items) {
    if (item.parent_id && map[item.parent_id]) {
      map[item.parent_id].children.push(map[item.id])
    } else {
      roots.push(map[item.id])
    }
  }
  const sortChildren = (nodes) => {
    nodes.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    nodes.forEach((n) => sortChildren(n.children))
  }
  sortChildren(roots)
  return roots
}

function buildWorldItems(worldGroups) {
  const items = []
  for (const [worldName, categories] of Object.entries(worldGroups)) {
    const subItems = []
    for (const [cat, entries] of Object.entries(categories)) {
      subItems.push(
        <div key={cat} style={{ marginLeft: 16, marginBottom: 8 }}>
          <div className='badge accent' style={{ marginBottom: 4 }}>
            {cat}
          </div>
          {entries.map(function (entry) {
            return (
              <div
                key={entry.id}
                className='row'
                style={{ padding: '4px 8px', marginLeft: 16, borderLeft: '2px solid var(--border)', marginBottom: 2 }}
              >
                <span>{entry.name}</span>
                {entry.content && (
                  <span
                    className='hint'
                    style={{
                      marginLeft: 8,
                      fontSize: 11,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entry.content.slice(0, 60)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )
    }
    items.push(
      <div key={worldName} style={{ marginBottom: 16 }}>
        <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: 4, marginBottom: 8 }}>{worldName}</h3>
        {subItems}
      </div>
    )
  }
  return items
}

function TreeNode({ node }) {
  const [open, setOpen] = useState(true)
  const hasChildren = node.children && node.children.length > 0
  return (
    <div style={{ marginLeft: 20 }}>
      <div className='row' style={{ gap: 4, padding: '2px 0' }}>
        {hasChildren ? (
          <button className='ghost' onClick={() => setOpen(!open)}>
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span style={{ width: 20 }} />
        )}
        <span className={`badge ${node.type === 't' ? 'primary' : ''}`}>{node.type || '节点'}</span>
        <span>{node.title}</span>
      </div>
      {open && hasChildren && node.children.map((child) => <TreeNode key={child.id} node={child} />)}
    </div>
  )
}

export default function MindmapView({ novel }) {
  const [tab, setTab] = useState('outline')
  const [outlines, setOutlines] = useState([])
  const [worlds, setWorlds] = useState([])

  useEffect(() => {
    if (novel?.id) {
      window.api.listOutlines(novel.id).then(setOutlines)
      window.api.listWorlds(novel.id).then(setWorlds)
    }
  }, [novel?.id])

  const tree = useMemo(() => buildOutlineTree(outlines), [outlines])

  const worldGroups = useMemo(() => {
    const groups = {}
    for (const w of worlds) {
      const wn = w.world_name || '主世界'
      if (!groups[wn]) groups[wn] = {}
      const cat = w.category || '其他'
      if (!groups[wn][cat]) groups[wn][cat] = []
      groups[wn][cat].push(w)
    }
    return groups
  }, [worlds])

  const worldEmpty = (
    <div className='empty-state'>
      <div className='hint'>
        暂无世界观设定。在「世界观」标签页中创建世界后，这里将展示按世界名 &gt; 类别分组的层级视图。
      </div>
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div className='tabs' style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map((t) => (
          <div key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            <t.icon size={14} /> {t.label}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 12 }}>
        {tab === 'outline' &&
          (outlines.length === 0 ? (
            <div className='empty-state'>
              <div className='hint'>暂无大纲。在「大纲」标签页中创建大纲节点后，这里将展示结构化的树形图谱。</div>
            </div>
          ) : (
            <div style={{ fontSize: 13 }}>
              {tree.map((node) => (
                <TreeNode key={node.id} node={node} />
              ))}
            </div>
          ))}

        {tab === 'relation' && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
            <RelationGraph novel={novel} onOpenCharacter={() => {}} />
          </div>
        )}

        {tab === 'world' && (worlds.length === 0 ? worldEmpty : buildWorldItems(worldGroups))}
      </div>
    </div>
  )
}
