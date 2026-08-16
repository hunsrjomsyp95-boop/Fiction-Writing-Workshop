import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Search, Edit3, Trash2, List, ChevronRight, ChevronDown } from 'lucide-react'
import { useDialog } from '../Dialog.jsx'

export default function MobileOutlineView({ novel, toast }) {
  const [outlines, setOutlines] = useState(null)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', type: '节点', parent_id: null })
  const [expandedIds, setExpandedIds] = useState(new Set())
  const { confirm } = useDialog()

  const load = async () => setOutlines(await window.api.listOutlines(novel.id))
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!form.title.trim()) { toast('请输入标题', 'error'); return }
    await window.api.createOutline(novel.id, form)
    setCreating(false)
    setForm({ title: '', content: '', type: '节点', parent_id: null })
    toast('创建成功', 'success')
    load()
  }

  const update = async (id, data) => {
    await window.api.updateOutline(id, data)
    setEditing(null)
    toast('更新成功', 'success')
    load()
  }

  const del = async (id) => {
    if (!(await confirm({ title: '删除大纲节点', message: '确定删除？子节点也会被删除。', danger: true }))) return
    await window.api.deleteOutline(id)
    toast('已删除', 'success')
    load()
  }

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const buildTree = (items, parentId = null) => {
    return items.filter(item => item.parent_id === parentId).map(item => ({
      ...item,
      children: buildTree(items, item.id)
    }))
  }

  const renderTree = (nodes, level = 0) => {
    return nodes.map(node => (
      <div key={node.id} style={{ paddingLeft: level * 20 }}>
        <div className="mobile-list-item" onClick={() => setEditing(node)}>
          {node.children.length > 0 ? (
            <button className="mobile-expand-btn" onClick={e => { e.stopPropagation(); toggleExpand(node.id) }}>
              {expandedIds.has(node.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <div style={{ width: 24 }} />
          )}
          <div className="mobile-list-item-content">
            <div className="mobile-list-item-title">{node.title}</div>
            <div className="mobile-list-item-desc">
              <span className="mobile-tag">{node.type}</span>
              {node.content && <span>{node.content.slice(0, 30)}...</span>}
            </div>
          </div>
          <button className="mobile-list-item-action" onClick={e => { e.stopPropagation(); del(node.id) }}>
            <Trash2 size={16} />
          </button>
        </div>
        {expandedIds.has(node.id) && node.children.length > 0 && renderTree(node.children, level + 1)}
      </div>
    ))
  }

  if (outlines === null) {
    return <div className="mobile-loading"><div className="mobile-spinner" /></div>
  }

  if (creating || editing) {
    const isEditing = !!editing
    const formData = isEditing ? editing : form
    const setFormData = isEditing ? (data) => setEditing({ ...editing, ...data }) : setForm

    return (
      <div className="mobile-detail-view">
        <div className="mobile-detail-header">
          <button className="mobile-back-btn" onClick={() => { setCreating(false); setEditing(null) }}>
            <ArrowLeft size={24} />
          </button>
          <h2>{isEditing ? '编辑大纲节点' : '新建大纲节点'}</h2>
          <button className="mobile-btn primary small" onClick={() => isEditing ? update(editing.id, formData) : create()}>
            保存
          </button>
        </div>
        <div className="mobile-detail-body">
          <div className="mobile-form-group">
            <label className="mobile-form-label">标题 *</label>
            <input className="mobile-input" value={formData.title} onChange={e => setFormData({ title: e.target.value })} placeholder="节点标题" />
          </div>
          <div className="mobile-form-group">
            <label className="mobile-form-label">类型</label>
            <select className="mobile-select" value={formData.type} onChange={e => setFormData({ type: e.target.value })}>
              <option value="节点">节点</option>
              <option value="卷">卷</option>
              <option value="章">章</option>
              <option value="节">节</option>
              <option value="幕">幕</option>
            </select>
          </div>
          <div className="mobile-form-group">
            <label className="mobile-form-label">父节点</label>
            <select className="mobile-select" value={formData.parent_id || ''} onChange={e => setFormData({ parent_id: e.target.value || null })}>
              <option value="">无（顶级节点）</option>
              {outlines.map(o => (
                <option key={o.id} value={o.id}>{o.title}</option>
              ))}
            </select>
          </div>
          <div className="mobile-form-group">
            <label className="mobile-form-label">内容</label>
            <textarea className="mobile-textarea" value={formData.content || ''} onChange={e => setFormData({ content: e.target.value })} placeholder="节点内容..." rows={6} />
          </div>
        </div>
      </div>
    )
  }

  const tree = buildTree(outlines)

  return (
    <div>
      <div className="mobile-view-header">
        <h2>大纲管理</h2>
        <button className="mobile-btn primary small" onClick={() => setCreating(true)}>
          <Plus size={16} /> 新建
        </button>
      </div>

      {outlines.length === 0 ? (
        <div className="mobile-empty">
          <div className="mobile-empty-icon"><List size={40} /></div>
          <div className="mobile-empty-title">还没有大纲</div>
          <div className="mobile-empty-desc">点击上方按钮创建大纲节点</div>
        </div>
      ) : (
        <div className="mobile-list">
          {renderTree(tree)}
        </div>
      )}
    </div>
  )
}