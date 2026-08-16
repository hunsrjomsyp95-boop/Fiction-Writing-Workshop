import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Search, Edit3, Trash2, Users, User, Heart, Shield, Sword, BookOpen } from 'lucide-react'
import { useDialog } from '../Dialog.jsx'

export default function MobileCharactersView({ novel, toast }) {
  const [characters, setCharacters] = useState(null)
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', role: '主角', gender: '', age: '', personality: '', background: '' })
  const [searchQuery, setSearchQuery] = useState('')
  const { confirm } = useDialog()

  const load = async () => setCharacters(await window.api.listCharacters(novel.id))
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!form.name.trim()) { toast('请输入人物名称', 'error'); return }
    await window.api.createCharacter(novel.id, form)
    setCreating(false)
    setForm({ name: '', role: '主角', gender: '', age: '', personality: '', background: '' })
    toast('创建成功', 'success')
    load()
  }

  const update = async (id, data) => {
    await window.api.updateCharacter(id, data)
    setEditing(null)
    toast('更新成功', 'success')
    load()
  }

  const del = async (id) => {
    if (!(await confirm({ title: '删除人物', message: '确定删除？', danger: true }))) return
    await window.api.deleteCharacter(id)
    toast('已删除', 'success')
    load()
  }

  const filtered = characters?.filter(c =>
    c.name.includes(searchQuery) || c.alias?.includes(searchQuery)
  )

  if (characters === null) {
    return <div className="mobile-loading"><div className="mobile-spinner" /></div>
  }

  // 编辑/创建表单
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
          <h2>{isEditing ? '编辑人物' : '新建人物'}</h2>
          <button className="mobile-btn primary small" onClick={() => isEditing ? update(editing.id, formData) : create()}>
            保存
          </button>
        </div>
        <div className="mobile-detail-body">
          <div className="mobile-form-group">
            <label className="mobile-form-label">姓名 *</label>
            <input className="mobile-input" value={formData.name} onChange={e => setFormData({ name: e.target.value })} placeholder="人物姓名" />
          </div>
          <div className="mobile-form-group">
            <label className="mobile-form-label">别名</label>
            <input className="mobile-input" value={formData.alias || ''} onChange={e => setFormData({ alias: e.target.value })} placeholder="其他称呼" />
          </div>
          <div className="mobile-form-group">
            <label className="mobile-form-label">角色</label>
            <select className="mobile-select" value={formData.role} onChange={e => setFormData({ role: e.target.value })}>
              <option value="主角">主角</option>
              <option value="配角">配角</option>
              <option value="反派">反派</option>
              <option value="龙套">龙套</option>
            </select>
          </div>
          <div className="mobile-form-row">
            <div className="mobile-form-group">
              <label className="mobile-form-label">性别</label>
              <input className="mobile-input" value={formData.gender || ''} onChange={e => setFormData({ gender: e.target.value })} placeholder="性别" />
            </div>
            <div className="mobile-form-group">
              <label className="mobile-form-label">年龄</label>
              <input className="mobile-input" value={formData.age || ''} onChange={e => setFormData({ age: e.target.value })} placeholder="年龄" />
            </div>
          </div>
          <div className="mobile-form-group">
            <label className="mobile-form-label">性格</label>
            <textarea className="mobile-textarea" value={formData.personality || ''} onChange={e => setFormData({ personality: e.target.value })} placeholder="描述人物性格..." rows={3} />
          </div>
          <div className="mobile-form-group">
            <label className="mobile-form-label">背景</label>
            <textarea className="mobile-textarea" value={formData.background || ''} onChange={e => setFormData({ background: e.target.value })} placeholder="人物背景故事..." rows={4} />
          </div>
        </div>
      </div>
    )
  }

  // 列表视图
  return (
    <div>
      <div className="mobile-view-header">
        <h2>人物管理</h2>
        <button className="mobile-btn primary small" onClick={() => setCreating(true)}>
          <Plus size={16} /> 新建
        </button>
      </div>

      <div className="mobile-search">
        <Search size={20} className="mobile-search-icon" />
        <input className="mobile-search-input" placeholder="搜索人物..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="mobile-empty">
          <div className="mobile-empty-icon"><Users size={40} /></div>
          <div className="mobile-empty-title">还没有人物</div>
          <div className="mobile-empty-desc">点击上方按钮创建人物角色</div>
        </div>
      ) : (
        <div className="mobile-list">
          {filtered.map(char => (
            <div key={char.id} className="mobile-list-item" onClick={() => setEditing(char)}>
              <div className="mobile-list-item-avatar" style={{ background: char.role === '主角' ? 'var(--accent)' : char.role === '反派' ? 'var(--red)' : 'var(--green)' }}>
                {char.name[0]}
              </div>
              <div className="mobile-list-item-content">
                <div className="mobile-list-item-title">{char.name}</div>
                <div className="mobile-list-item-desc">
                  <span className="mobile-tag">{char.role}</span>
                  {char.gender && <span>{char.gender}</span>}
                  {char.age && <span>· {char.age}岁</span>}
                </div>
              </div>
              <button className="mobile-list-item-action" onClick={e => { e.stopPropagation(); del(char.id) }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}