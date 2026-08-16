import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Search, Edit3, Trash2, Globe, Map, Book } from 'lucide-react'
import { useDialog } from '../Dialog.jsx'

export default function MobileWorldsView({ novel, toast }) {
  const [worlds, setWorlds] = useState(null)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', category: '其他', content: '', world_name: '主世界' })
  const [searchQuery, setSearchQuery] = useState('')
  const { confirm } = useDialog()

  const load = async () => setWorlds(await window.api.listWorlds(novel.id))
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!form.name.trim()) { toast('请输入名称', 'error'); return }
    await window.api.createWorld(novel.id, form)
    setCreating(false)
    setForm({ name: '', category: '其他', content: '', world_name: '主世界' })
    toast('创建成功', 'success')
    load()
  }

  const update = async (id, data) => {
    await window.api.updateWorld(id, data)
    setEditing(null)
    toast('更新成功', 'success')
    load()
  }

  const del = async (id) => {
    if (!(await confirm({ title: '删除', message: '确定删除？', danger: true }))) return
    await window.api.deleteWorld(id)
    toast('已删除', 'success')
    load()
  }

  const filtered = worlds?.filter(w =>
    w.name.includes(searchQuery) || w.category?.includes(searchQuery)
  )

  if (worlds === null) {
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
          <h2>{isEditing ? '编辑世界观' : '新建世界观'}</h2>
          <button className="mobile-btn primary small" onClick={() => isEditing ? update(editing.id, formData) : create()}>
            保存
          </button>
        </div>
        <div className="mobile-detail-body">
          <div className="mobile-form-group">
            <label className="mobile-form-label">名称 *</label>
            <input className="mobile-input" value={formData.name} onChange={e => setFormData({ name: e.target.value })} placeholder="名称" />
          </div>
          <div className="mobile-form-group">
            <label className="mobile-form-label">分类</label>
            <select className="mobile-select" value={formData.category} onChange={e => setFormData({ category: e.target.value })}>
              <option value="地理">地理</option>
              <option value="历史">历史</option>
              <option value="种族">种族</option>
              <option value="势力">势力</option>
              <option value="魔法">魔法</option>
              <option value="科技">科技</option>
              <option value="文化">文化</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div className="mobile-form-group">
            <label className="mobile-form-label">所属世界</label>
            <input className="mobile-input" value={formData.world_name || '主世界'} onChange={e => setFormData({ world_name: e.target.value })} placeholder="主世界" />
          </div>
          <div className="mobile-form-group">
            <label className="mobile-form-label">内容</label>
            <textarea className="mobile-textarea" value={formData.content || ''} onChange={e => setFormData({ content: e.target.value })} placeholder="详细描述..." rows={6} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mobile-view-header">
        <h2>世界观设定</h2>
        <button className="mobile-btn primary small" onClick={() => setCreating(true)}>
          <Plus size={16} /> 新建
        </button>
      </div>

      <div className="mobile-search">
        <Search size={20} className="mobile-search-icon" />
        <input className="mobile-search-input" placeholder="搜索世界观..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="mobile-empty">
          <div className="mobile-empty-icon"><Globe size={40} /></div>
          <div className="mobile-empty-title">还没有世界观设定</div>
          <div className="mobile-empty-desc">点击上方按钮创建世界观</div>
        </div>
      ) : (
        <div className="mobile-list">
          {filtered.map(world => (
            <div key={world.id} className="mobile-list-item" onClick={() => setEditing(world)}>
              <div className="mobile-list-item-icon" style={{ background: 'var(--cyan)', color: 'white' }}>
                <Globe size={20} />
              </div>
              <div className="mobile-list-item-content">
                <div className="mobile-list-item-title">{world.name}</div>
                <div className="mobile-list-item-desc">
                  <span className="mobile-tag">{world.category}</span>
                  <span>{world.world_name || '主世界'}</span>
                </div>
              </div>
              <button className="mobile-list-item-action" onClick={e => { e.stopPropagation(); del(world.id) }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}