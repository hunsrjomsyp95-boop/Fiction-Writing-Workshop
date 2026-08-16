import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Search, Edit3, Trash2, Zap, Check, Clock, AlertCircle } from 'lucide-react'
import { useDialog } from '../Dialog.jsx'

export default function MobileForeshadowView({ novel, toast }) {
  const [items, setItems] = useState(null)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', type: '普通', status: '计划', setup_desc: '', call_desc: '', resolve_desc: '' })
  const [filterStatus, setFilterStatus] = useState('')
  const { confirm } = useDialog()

  const load = async () => setItems(await window.api.listForeshadowings(novel.id, filterStatus || null))
  useEffect(() => { load() }, [filterStatus])

  const create = async () => {
    if (!form.title.trim()) { toast('请输入标题', 'error'); return }
    await window.api.createForeshadowing(novel.id, form)
    setCreating(false)
    setForm({ title: '', type: '普通', status: '计划', setup_desc: '', call_desc: '', resolve_desc: '' })
    toast('创建成功', 'success')
    load()
  }

  const update = async (id, data) => {
    await window.api.updateForeshadowing(id, data)
    setEditing(null)
    toast('更新成功', 'success')
    load()
  }

  const del = async (id) => {
    if (!(await confirm({ title: '删除伏笔', message: '确定删除？', danger: true }))) return
    await window.api.deleteForeshadowing(id)
    toast('已删除', 'success')
    load()
  }

  const statusColors = {
    '计划': 'var(--yellow)',
    '埋设': 'var(--accent)',
    '呼应': 'var(--cyan)',
    '回收': 'var(--green)',
    '废弃': 'var(--text-faint)'
  }

  const statusIcons = {
    '计划': <Clock size={14} />,
    '埋设': <Zap size={14} />,
    '呼应': <AlertCircle size={14} />,
    '回收': <Check size={14} />,
    '废弃': <Trash2 size={14} />
  }

  if (items === null) {
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
          <h2>{isEditing ? '编辑伏笔' : '新建伏笔'}</h2>
          <button className="mobile-btn primary small" onClick={() => isEditing ? update(editing.id, formData) : create()}>
            保存
          </button>
        </div>
        <div className="mobile-detail-body">
          <div className="mobile-form-group">
            <label className="mobile-form-label">标题 *</label>
            <input className="mobile-input" value={formData.title} onChange={e => setFormData({ title: e.target.value })} placeholder="伏笔标题" />
          </div>
          <div className="mobile-form-row">
            <div className="mobile-form-group">
              <label className="mobile-form-label">类型</label>
              <select className="mobile-select" value={formData.type} onChange={e => setFormData({ type: e.target.value })}>
                <option value="普通">普通</option>
                <option value="重要">重要</option>
                <option value="关键">关键</option>
              </select>
            </div>
            <div className="mobile-form-group">
              <label className="mobile-form-label">状态</label>
              <select className="mobile-select" value={formData.status} onChange={e => setFormData({ status: e.target.value })}>
                <option value="计划">计划</option>
                <option value="埋设">埋设</option>
                <option value="呼应">呼应</option>
                <option value="回收">回收</option>
                <option value="废弃">废弃</option>
              </select>
            </div>
          </div>
          <div className="mobile-form-group">
            <label className="mobile-form-label">埋设描述</label>
            <textarea className="mobile-textarea" value={formData.setup_desc || ''} onChange={e => setFormData({ setup_desc: e.target.value })} placeholder="在哪个章节埋设..." rows={3} />
          </div>
          <div className="mobile-form-group">
            <label className="mobile-form-label">呼应描述</label>
            <textarea className="mobile-textarea" value={formData.call_desc || ''} onChange={e => setFormData({ call_desc: e.target.value })} placeholder="如何呼应..." rows={3} />
          </div>
          <div className="mobile-form-group">
            <label className="mobile-form-label">回收描述</label>
            <textarea className="mobile-textarea" value={formData.resolve_desc || ''} onChange={e => setFormData({ resolve_desc: e.target.value })} placeholder="如何回收..." rows={3} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mobile-view-header">
        <h2>伏笔管理</h2>
        <button className="mobile-btn primary small" onClick={() => setCreating(true)}>
          <Plus size={16} /> 新建
        </button>
      </div>

      <div className="mobile-filter-tags">
        <button className={`mobile-tag ${!filterStatus ? 'active' : ''}`} onClick={() => setFilterStatus('')}>全部</button>
        {Object.keys(statusColors).map(status => (
          <button
            key={status}
            className={`mobile-tag ${filterStatus === status ? 'active' : ''}`}
            onClick={() => setFilterStatus(status)}
            style={filterStatus === status ? { background: statusColors[status], color: 'white' } : {}}
          >
            {statusIcons[status]} {status}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="mobile-empty">
          <div className="mobile-empty-icon"><Zap size={40} /></div>
          <div className="mobile-empty-title">还没有伏笔</div>
          <div className="mobile-empty-desc">点击上方按钮创建伏笔</div>
        </div>
      ) : (
        <div className="mobile-list">
          {items.map(item => (
            <div key={item.id} className="mobile-list-item" onClick={() => setEditing(item)}>
              <div className="mobile-list-item-icon" style={{ background: statusColors[item.status], color: 'white' }}>
                {statusIcons[item.status]}
              </div>
              <div className="mobile-list-item-content">
                <div className="mobile-list-item-title">{item.title}</div>
                <div className="mobile-list-item-desc">
                  <span className="mobile-tag">{item.type}</span>
                  <span style={{ color: statusColors[item.status] }}>{item.status}</span>
                </div>
              </div>
              <button className="mobile-list-item-action" onClick={e => { e.stopPropagation(); del(item.id) }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}