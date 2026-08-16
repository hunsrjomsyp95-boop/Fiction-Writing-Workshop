import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Search, Edit3, Trash2, FileText, Tag, Filter } from 'lucide-react'
import { useDialog } from '../Dialog.jsx'

export default function MobileMaterialsView({ novel, toast }) {
  const [materials, setMaterials] = useState(null)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', type: '未分类', content: '', tags: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('')
  const [types, setTypes] = useState([])
  const { confirm } = useDialog()

  const load = async () => {
    setMaterials(await window.api.listMaterials(novel.id, filterType || null))
    setTypes(await window.api.getMaterialTypes(novel.id))
  }
  useEffect(() => { load() }, [filterType])

  const create = async () => {
    if (!form.title.trim()) { toast('请输入标题', 'error'); return }
    await window.api.createMaterial(novel.id, form)
    setCreating(false)
    setForm({ title: '', type: '未分类', content: '', tags: '' })
    toast('创建成功', 'success')
    load()
  }

  const update = async (id, data) => {
    await window.api.updateMaterial(id, data)
    setEditing(null)
    toast('更新成功', 'success')
    load()
  }

  const del = async (id) => {
    if (!(await confirm({ title: '删除资料', message: '确定删除？', danger: true }))) return
    await window.api.deleteMaterial(id)
    toast('已删除', 'success')
    load()
  }

  const filtered = materials?.filter(m =>
    m.title.includes(searchQuery) || m.content?.includes(searchQuery) || m.tags?.includes(searchQuery)
  )

  if (materials === null) {
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
          <h2>{isEditing ? '编辑资料' : '新建资料'}</h2>
          <button className="mobile-btn primary small" onClick={() => isEditing ? update(editing.id, formData) : create()}>
            保存
          </button>
        </div>
        <div className="mobile-detail-body">
          <div className="mobile-form-group">
            <label className="mobile-form-label">标题 *</label>
            <input className="mobile-input" value={formData.title} onChange={e => setFormData({ title: e.target.value })} placeholder="资料标题" />
          </div>
          <div className="mobile-form-group">
            <label className="mobile-form-label">类型</label>
            <select className="mobile-select" value={formData.type} onChange={e => setFormData({ type: e.target.value })}>
              <option value="未分类">未分类</option>
              <option value="设定">设定</option>
              <option value="大纲">大纲</option>
              <option value="草稿">草稿</option>
              <option value="参考">参考</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <div className="mobile-form-group">
            <label className="mobile-form-label">标签</label>
            <input className="mobile-input" value={formData.tags || ''} onChange={e => setFormData({ tags: e.target.value })} placeholder="用逗号分隔多个标签" />
          </div>
          <div className="mobile-form-group">
            <label className="mobile-form-label">内容</label>
            <textarea className="mobile-textarea" value={formData.content || ''} onChange={e => setFormData({ content: e.target.value })} placeholder="资料内容..." rows={8} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mobile-view-header">
        <h2>资料库</h2>
        <button className="mobile-btn primary small" onClick={() => setCreating(true)}>
          <Plus size={16} /> 新建
        </button>
      </div>

      <div className="mobile-search">
        <Search size={20} className="mobile-search-icon" />
        <input className="mobile-search-input" placeholder="搜索资料..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      {types.length > 0 && (
        <div className="mobile-filter-tags">
          <button className={`mobile-tag ${!filterType ? 'active' : ''}`} onClick={() => setFilterType('')}>全部</button>
          {types.map(type => (
            <button key={type} className={`mobile-tag ${filterType === type ? 'active' : ''}`} onClick={() => setFilterType(type)}>
              {type}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="mobile-empty">
          <div className="mobile-empty-icon"><FileText size={40} /></div>
          <div className="mobile-empty-title">还没有资料</div>
          <div className="mobile-empty-desc">点击上方按钮添加参考资料</div>
        </div>
      ) : (
        <div className="mobile-list">
          {filtered.map(mat => (
            <div key={mat.id} className="mobile-list-item" onClick={() => setEditing(mat)}>
              <div className="mobile-list-item-icon" style={{ background: 'var(--orange)', color: 'white' }}>
                <FileText size={20} />
              </div>
              <div className="mobile-list-item-content">
                <div className="mobile-list-item-title">{mat.title}</div>
                <div className="mobile-list-item-desc">
                  <span className="mobile-tag">{mat.type}</span>
                  {mat.tags && <span className="mobile-tag">{mat.tags}</span>}
                </div>
              </div>
              <button className="mobile-list-item-action" onClick={e => { e.stopPropagation(); del(mat.id) }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}