import { useState, useEffect } from 'react'
import { BookOpen, Plus, Search, Trash2, Edit3, Calendar, FileText } from 'lucide-react'
import { useDialog } from '../Dialog.jsx'

export default function MobileHome({ onOpen, toast }) {
  const { confirm } = useDialog()
  const [novels, setNovels] = useState(null)
  const [creating, setCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState({ name: '', genre: '', description: '' })

  const load = async () => setNovels(await window.api.listNovels())

  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    if (!form.name.trim()) {
      toast('请填写小说名称', 'error')
      return
    }
    const novel = await window.api.createNovel(form)
    setCreating(false)
    setForm({ name: '', genre: '', description: '' })
    toast('项目创建成功', 'success')
    onOpen(novel)
  }

  const del = async (id) => {
    if (!(await confirm({ title: '删除项目', message: '确定删除该项目？', danger: true }))) return
    await window.api.deleteNovel(id)
    toast('已删除', 'success')
    load()
  }

  const filteredNovels = novels?.filter(n =>
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (novels === null) {
    return (
      <div className="mobile-loading">
        <div className="mobile-spinner" />
        <span className="mobile-loading-text">加载中...</span>
      </div>
    )
  }

  if (creating) {
    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, color: 'var(--text)' }}>
          新建小说
        </h2>
        <div className="mobile-form-group">
          <label className="mobile-form-label">小说名称 *</label>
          <input
            className="mobile-input"
            placeholder="输入小说名称"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            autoFocus
          />
        </div>
        <div className="mobile-form-group">
          <label className="mobile-form-label">类型</label>
          <input
            className="mobile-input"
            placeholder="如：玄幻、都市、科幻"
            value={form.genre}
            onChange={e => setForm({ ...form, genre: e.target.value })}
          />
        </div>
        <div className="mobile-form-group">
          <label className="mobile-form-label">简介</label>
          <textarea
            className="mobile-textarea"
            placeholder="简单描述你的故事..."
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={4}
          />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button className="mobile-btn mobile-btn-secondary" onClick={() => setCreating(false)}>
            取消
          </button>
          <button className="mobile-btn" onClick={create}>
            创建
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* 搜索栏 */}
      <div className="mobile-search">
        <Search size={20} className="mobile-search-icon" />
        <input
          className="mobile-search-input"
          placeholder="搜索小说..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 统计信息 */}
      <div className="mobile-grid" style={{ marginBottom: 20 }}>
        <div className="mobile-stat-card">
          <div className="mobile-stat-value">{novels.length}</div>
          <div className="mobile-stat-label">创作项目</div>
        </div>
        <div className="mobile-stat-card">
          <div className="mobile-stat-value">
            {novels.reduce((sum, n) => sum + (n.target_words || 0), 0).toLocaleString()}
          </div>
          <div className="mobile-stat-label">目标字数</div>
        </div>
      </div>

      {/* 小说列表 */}
      {filteredNovels.length === 0 ? (
        <div className="mobile-empty">
          <div className="mobile-empty-icon">
            <BookOpen size={40} />
          </div>
          <div className="mobile-empty-title">还没有创作项目</div>
          <div className="mobile-empty-desc">点击下方按钮开始你的第一个故事</div>
        </div>
      ) : (
        <div className="mobile-list">
          {filteredNovels.map(novel => (
            <div
              key={novel.id}
              className="mobile-list-item"
              onClick={() => onOpen(novel)}
            >
              <div className="mobile-list-item-icon">
                <BookOpen size={20} />
              </div>
              <div className="mobile-list-item-content">
                <div className="mobile-list-item-title">{novel.name}</div>
                <div className="mobile-list-item-desc">
                  {novel.genre || '未分类'} · {novel.description?.slice(0, 30) || '暂无简介'}
                </div>
              </div>
              <button
                className="mobile-list-item-arrow"
                onClick={e => {
                  e.stopPropagation()
                  del(novel.id)
                }}
                style={{ background: 'none', border: 'none', padding: 8 }}
              >
                <Trash2 size={18} color="var(--text-faint)" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 浮动新建按钮 */}
      <button className="mobile-fab" onClick={() => setCreating(true)}>
        <Plus size={28} />
      </button>
    </div>
  )
}