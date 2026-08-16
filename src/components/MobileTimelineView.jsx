import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Edit3, Trash2, Calendar, Clock, MapPin } from 'lucide-react'
import { useDialog } from '../Dialog.jsx'

export default function MobileTimelineView({ novel, toast }) {
  const [events, setEvents] = useState(null)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', story_time: '', description: '', location: '', status: '进行中' })
  const { confirm } = useDialog()

  const load = async () => setEvents(await window.api.listTimeline(novel.id))
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!form.title.trim()) { toast('请输入标题', 'error'); return }
    await window.api.createTimelineEvent(novel.id, form)
    setCreating(false)
    setForm({ title: '', story_time: '', description: '', location: '', status: '进行中' })
    toast('创建成功', 'success')
    load()
  }

  const update = async (id, data) => {
    await window.api.updateTimelineEvent(id, data)
    setEditing(null)
    toast('更新成功', 'success')
    load()
  }

  const del = async (id) => {
    if (!(await confirm({ title: '删除事件', message: '确定删除？', danger: true }))) return
    await window.api.deleteTimelineEvent(id)
    toast('已删除', 'success')
    load()
  }

  if (events === null) {
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
          <h2>{isEditing ? '编辑事件' : '新建事件'}</h2>
          <button className="mobile-btn primary small" onClick={() => isEditing ? update(editing.id, formData) : create()}>
            保存
          </button>
        </div>
        <div className="mobile-detail-body">
          <div className="mobile-form-group">
            <label className="mobile-form-label">标题 *</label>
            <input className="mobile-input" value={formData.title} onChange={e => setFormData({ title: e.target.value })} placeholder="事件标题" />
          </div>
          <div className="mobile-form-row">
            <div className="mobile-form-group">
              <label className="mobile-form-label">故事时间</label>
              <input className="mobile-input" value={formData.story_time || ''} onChange={e => setFormData({ story_time: e.target.value })} placeholder="如：第一章、春天" />
            </div>
            <div className="mobile-form-group">
              <label className="mobile-form-label">状态</label>
              <select className="mobile-select" value={formData.status} onChange={e => setFormData({ status: e.target.value })}>
                <option value="进行中">进行中</option>
                <option value="已完成">已完成</option>
                <option value="已取消">已取消</option>
              </select>
            </div>
          </div>
          <div className="mobile-form-group">
            <label className="mobile-form-label">地点</label>
            <input className="mobile-input" value={formData.location || ''} onChange={e => setFormData({ location: e.target.value })} placeholder="事件发生地点" />
          </div>
          <div className="mobile-form-group">
            <label className="mobile-form-label">描述</label>
            <textarea className="mobile-textarea" value={formData.description || ''} onChange={e => setFormData({ description: e.target.value })} placeholder="事件描述..." rows={4} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mobile-view-header">
        <h2>时间线</h2>
        <button className="mobile-btn primary small" onClick={() => setCreating(true)}>
          <Plus size={16} /> 新建
        </button>
      </div>

      {events.length === 0 ? (
        <div className="mobile-empty">
          <div className="mobile-empty-icon"><Calendar size={40} /></div>
          <div className="mobile-empty-title">还没有事件</div>
          <div className="mobile-empty-desc">点击上方按钮创建时间线事件</div>
        </div>
      ) : (
        <div className="mobile-timeline">
          {events.map((event, idx) => (
            <div key={event.id} className="mobile-timeline-item" onClick={() => setEditing(event)}>
              <div className="mobile-timeline-dot" style={{ background: event.status === '已完成' ? 'var(--green)' : event.status === '已取消' ? 'var(--text-faint)' : 'var(--accent)' }} />
              <div className="mobile-timeline-content">
                <div className="mobile-timeline-header">
                  <div className="mobile-timeline-title">{event.title}</div>
                  <button className="mobile-list-item-action" onClick={e => { e.stopPropagation(); del(event.id) }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mobile-timeline-meta">
                  {event.story_time && (
                    <span className="mobile-timeline-time">
                      <Clock size={12} /> {event.story_time}
                    </span>
                  )}
                  {event.location && (
                    <span className="mobile-timeline-location">
                      <MapPin size={12} /> {event.location}
                    </span>
                  )}
                  <span className={`mobile-tag ${event.status === '已完成' ? 'success' : event.status === '已取消' ? 'default' : 'primary'}`}>
                    {event.status}
                  </span>
                </div>
                {event.description && (
                  <div className="mobile-timeline-desc">{event.description}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}