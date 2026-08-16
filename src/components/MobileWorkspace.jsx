import { useState, useEffect } from 'react'
import { BookOpen, Users, Globe, Database, BarChart3, Plus, Search, ChevronRight, Edit3, Trash2, Calendar, FileText, ArrowLeft, List, Zap, Clock, Sparkles, Settings } from 'lucide-react'
import MobileLayout from './MobileLayout.jsx'
import MobileChapterEditor from './MobileChapterEditor.jsx'
import MobileCharactersView from './MobileCharactersView.jsx'
import MobileWorldsView from './MobileWorldsView.jsx'
import MobileMaterialsView from './MobileMaterialsView.jsx'
import MobileOutlineView from './MobileOutlineView.jsx'
import MobileForeshadowView from './MobileForeshadowView.jsx'
import MobileTimelineView from './MobileTimelineView.jsx'
import MobileAIPanel from './MobileAIPanel.jsx'
import MobileSettingsView from './MobileSettingsView.jsx'
import MobileDataView from './MobileDataView.jsx'
import { useDialog } from '../Dialog.jsx'

// 移动端章节列表
function MobileChaptersView({ novel, toast, onEdit }) {
  const [chapters, setChapters] = useState(null)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const { confirm } = useDialog()

  const load = async () => setChapters(await window.api.listChapters(novel.id))

  useEffect(() => { load() }, [])

  const create = async () => {
    if (!newTitle.trim()) return
    const chapter = await window.api.createChapter(novel.id, { title: newTitle })
    setNewTitle('')
    setCreating(false)
    toast('章节创建成功', 'success')
    load()
    // 自动进入编辑
    if (onEdit) onEdit(chapter)
  }

  const rename = async (id) => {
    if (!editTitle.trim()) return
    await window.api.updateChapter(id, { title: editTitle })
    setEditingId(null)
    toast('已重命名', 'success')
    load()
  }

  const del = async (id) => {
    if (!(await confirm({ title: '删除章节', message: '确定删除？', danger: true }))) return
    await window.api.deleteChapter(id)
    toast('已删除', 'success')
    load()
  }

  if (chapters === null) {
    return <div className="mobile-loading"><div className="mobile-spinner" /></div>
  }

  return (
    <div>
      <div className="mobile-view-header">
        <h2>章节列表</h2>
        <button className="mobile-btn primary small" onClick={() => setCreating(true)}>
          <Plus size={16} /> 新章节
        </button>
      </div>

      {creating && (
        <div className="mobile-card" style={{ marginBottom: 16 }}>
          <input
            className="mobile-input"
            placeholder="章节标题"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && create()}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="mobile-btn mobile-btn-secondary mobile-btn-small" onClick={() => setCreating(false)}>取消</button>
            <button className="mobile-btn mobile-btn-small" onClick={create}>创建</button>
          </div>
        </div>
      )}

      {chapters.length === 0 ? (
        <div className="mobile-empty">
          <div className="mobile-empty-icon"><FileText size={40} /></div>
          <div className="mobile-empty-title">还没有章节</div>
          <div className="mobile-empty-desc">点击上方按钮创建第一个章节</div>
        </div>
      ) : (
        <div className="mobile-list">
          {chapters.map((ch, idx) => (
            <div key={ch.id} className="mobile-list-item" onClick={() => onEdit && onEdit(ch)}>
              <div className="mobile-list-item-icon" style={{ background: 'var(--accent)', color: 'white', fontSize: 14, fontWeight: 600 }}>
                {idx + 1}
              </div>
              <div className="mobile-list-item-content">
                {editingId === ch.id ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="mobile-input"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && rename(ch.id)}
                      onClick={e => e.stopPropagation()}
                      autoFocus
                      style={{ height: 36, fontSize: 14 }}
                    />
                    <button className="mobile-btn mobile-btn-small" onClick={e => { e.stopPropagation(); rename(ch.id) }} style={{ width: 60 }}>保存</button>
                  </div>
                ) : (
                  <>
                    <div className="mobile-list-item-title">{ch.title}</div>
                    <div className="mobile-list-item-desc">
                      {ch.word_count || 0} 字 · {ch.status || '草稿'}
                    </div>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="mobile-list-item-action"
                  onClick={e => { e.stopPropagation(); setEditingId(ch.id); setEditTitle(ch.title) }}
                >
                  <Edit3 size={16} />
                </button>
                <button
                  className="mobile-list-item-action danger"
                  onClick={e => { e.stopPropagation(); del(ch.id) }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// 移动端统计视图
function MobileStatsView({ novel, toast }) {
  const [stats, setStats] = useState(null)

  const load = async () => setStats(await window.api.getStats(novel.id))
  useEffect(() => { load() }, [])

  if (stats === null) {
    return <div className="mobile-loading"><div className="mobile-spinner" /></div>
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>创作统计</h2>
      <div className="mobile-grid">
        <div className="mobile-stat-card">
          <div className="mobile-stat-value">{stats.totalWords?.toLocaleString() || 0}</div>
          <div className="mobile-stat-label">总字数</div>
        </div>
        <div className="mobile-stat-card">
          <div className="mobile-stat-value">{stats.chapterCount || 0}</div>
          <div className="mobile-stat-label">章节数</div>
        </div>
        <div className="mobile-stat-card">
          <div className="mobile-stat-value">{stats.characterCount || 0}</div>
          <div className="mobile-stat-label">人物数</div>
        </div>
        <div className="mobile-stat-card">
          <div className="mobile-stat-value">{stats.worldCount || 0}</div>
          <div className="mobile-stat-label">世界观</div>
        </div>
      </div>
    </div>
  )
}

// 主工作区组件
export default function MobileWorkspace({ novel, user, onExit, onLock, toast }) {
  const [currentView, setCurrentView] = useState('chapters')
  const [editingChapter, setEditingChapter] = useState(null)

  const handleEditChapter = (chapter) => {
    setEditingChapter(chapter)
  }

  const handleBackFromEditor = () => {
    setEditingChapter(null)
  }

  // 如果正在编辑章节，显示编辑器
  if (editingChapter) {
    return (
      <MobileLayout
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view)
          setEditingChapter(null)
        }}
        novel={novel}
        onExit={() => {
          setEditingChapter(null)
          onExit()
        }}
      >
        <MobileChapterEditor
          chapter={editingChapter}
          onBack={handleBackFromEditor}
          toast={toast}
        />
      </MobileLayout>
    )
  }

  const renderView = () => {
    switch (currentView) {
      case 'chapters':
        return <MobileChaptersView novel={novel} toast={toast} onEdit={handleEditChapter} />
      case 'characters':
        return <MobileCharactersView novel={novel} toast={toast} />
      case 'worlds':
        return <MobileWorldsView novel={novel} toast={toast} />
      case 'materials':
        return <MobileMaterialsView novel={novel} toast={toast} />
      case 'outline':
        return <MobileOutlineView novel={novel} toast={toast} />
      case 'foreshadow':
        return <MobileForeshadowView novel={novel} toast={toast} />
      case 'timeline':
        return <MobileTimelineView novel={novel} toast={toast} />
      case 'stats':
        return <MobileStatsView novel={novel} toast={toast} />
      case 'ai':
        return <MobileAIPanel novel={novel} toast={toast} />
      case 'data':
        return <MobileDataView novel={novel} toast={toast} />
      case 'settings':
        return <MobileSettingsView novel={novel} toast={toast} />
      default:
        return <MobileChaptersView novel={novel} toast={toast} onEdit={handleEditChapter} />
    }
  }

  return (
    <MobileLayout
      currentView={currentView}
      onViewChange={setCurrentView}
      novel={novel}
      onExit={onExit}
    >
      {renderView()}
    </MobileLayout>
  )
}