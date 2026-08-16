import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  ArrowLeft, Save, Menu, BookOpen, Users, Globe, Database, 
  BarChart3, Settings, List, Zap, Calendar, Sparkles, Download,
  ChevronDown, ChevronUp, Type, Clock, FileText, Eye, Edit3,
  MoreVertical, Search, Plus, Trash2, RefreshCw
} from 'lucide-react'
import { useDialog } from '../Dialog.jsx'

// 移动端主布局
export default function MobileEditorLayout({ novel, user, onExit, toast }) {
  const [currentChapter, setCurrentChapter] = useState(null)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [showTopPanel, setShowTopPanel] = useState(true)
  const [showBottomPanel, setShowBottomPanel] = useState(true)
  const [activeBottomTab, setActiveBottomTab] = useState('chapters')
  const [chapters, setChapters] = useState([])
  const [editingTitle, setEditingTitle] = useState(false)
  const textareaRef = useRef(null)
  const { confirm } = useDialog()

  // 加载章节列表
  const loadChapters = useCallback(async () => {
    const list = await window.api.listChapters(novel.id)
    setChapters(list)
    // 如果没有选中章节，默认选第一个
    if (!currentChapter && list.length > 0) {
      selectChapter(list[0])
    }
  }, [novel.id, currentChapter])

  useEffect(() => {
    loadChapters()
  }, [loadChapters])

  // 选择章节
  const selectChapter = async (chapter) => {
    setCurrentChapter(chapter)
    setContent(chapter.content || '')
    setTitle(chapter.title || '')
    setWordCount((chapter.content || '').length)
    setShowBottomPanel(false) // 选中后收起底部面板
  }

  // 保存章节
  const save = async () => {
    if (!currentChapter) return
    setSaving(true)
    try {
      await window.api.updateChapter(currentChapter.id, { title, content })
      await window.api.saveVersion(currentChapter.id, content, `手动保存`)
      toast('已保存', 'success')
      // 更新本地数据
      setChapters(prev => prev.map(ch => 
        ch.id === currentChapter.id ? { ...ch, title, content, word_count: content.length } : ch
      ))
    } catch (err) {
      toast('保存失败: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  // 新建章节
  const createChapter = async () => {
    const { confirm: confirmDialog } = await import('../Dialog.jsx')
    const title = prompt('请输入章节标题：')
    if (!title?.trim()) return
    
    try {
      const chapter = await window.api.createChapter(novel.id, { title: title.trim() })
      await loadChapters()
      selectChapter(chapter)
      toast('章节已创建', 'success')
    } catch (err) {
      toast('创建失败: ' + err.message, 'error')
    }
  }

  // 删除章节
  const deleteChapter = async (id) => {
    if (!(await confirm({ title: '删除章节', message: '确定删除此章节？', danger: true }))) return
    try {
      await window.api.deleteChapter(id)
      if (currentChapter?.id === id) {
        setCurrentChapter(null)
        setContent('')
        setTitle('')
      }
      await loadChapters()
      toast('已删除', 'success')
    } catch (err) {
      toast('删除失败: ' + err.message, 'error')
    }
  }

  // 自动保存
  useEffect(() => {
    if (!currentChapter) return
    const timer = setTimeout(() => {
      if (content !== currentChapter.content) {
        window.api.updateChapter(currentChapter.id, { content })
      }
    }, 30000) // 30秒自动保存
    return () => clearTimeout(timer)
  }, [content, currentChapter])

  // 更新字数
  useEffect(() => {
    setWordCount(content.length)
  }, [content])

  // 底部功能面板
  const renderBottomPanel = () => {
    if (!showBottomPanel) return null

    return (
      <div className="mobile-bottom-panel">
        <div className="mobile-bottom-tabs">
          {[
            { id: 'chapters', icon: BookOpen, label: '章节' },
            { id: 'characters', icon: Users, label: '人物' },
            { id: 'outline', icon: List, label: '大纲' },
            { id: 'tools', icon: MoreVertical, label: '更多' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`mobile-bottom-tab ${activeBottomTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveBottomTab(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="mobile-bottom-content">
          {activeBottomTab === 'chapters' && (
            <div className="mobile-chapters-list">
              <div className="mobile-list-header">
                <span>{chapters.length} 个章节</span>
                <button onClick={createChapter}>
                  <Plus size={16} /> 新建
                </button>
              </div>
              {chapters.map((ch, i) => (
                <div 
                  key={ch.id} 
                  className={`mobile-list-item ${currentChapter?.id === ch.id ? 'active' : ''}`}
                  onClick={() => selectChapter(ch)}
                >
                  <span className="mobile-list-num">{i + 1}</span>
                  <div className="mobile-list-info">
                    <div className="mobile-list-title">{ch.title}</div>
                    <div className="mobile-list-meta">{ch.word_count || 0} 字</div>
                  </div>
                  <button 
                    className="mobile-list-delete"
                    onClick={(e) => { e.stopPropagation(); deleteChapter(ch.id) }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeBottomTab === 'characters' && (
            <MobileCharactersPanel novel={novel} toast={toast} />
          )}

          {activeBottomTab === 'outline' && (
            <MobileOutlinePanel novel={novel} toast={toast} />
          )}

          {activeBottomTab === 'tools' && (
            <MobileToolsPanel 
              novel={novel} 
              toast={toast}
              onRefresh={loadChapters}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-editor-layout">
      {/* 顶部导航栏 */}
      <div className="mobile-editor-topbar">
        <button className="mobile-topbar-btn" onClick={onExit}>
          <ArrowLeft size={20} />
        </button>
        
        <div className="mobile-topbar-title" onClick={() => setEditingTitle(true)}>
          {editingTitle ? (
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingTitle(false)}
              autoFocus
              className="mobile-title-input"
            />
          ) : (
            <>
              <span>{title || '未命名章节'}</span>
              <Edit3 size={14} />
            </>
          )}
        </div>

        <div className="mobile-topbar-actions">
          <button className="mobile-topbar-btn" onClick={save} disabled={saving}>
            <Save size={18} />
            <span>{saving ? '...' : '保存'}</span>
          </button>
          <button 
            className="mobile-topbar-btn"
            onClick={() => setShowBottomPanel(!showBottomPanel)}
          >
            {showBottomPanel ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {/* 中部信息栏 */}
      <div className="mobile-editor-info">
        <span className="mobile-info-item">
          <Type size={14} />
          {wordCount} 字
        </span>
        <span className="mobile-info-item">
          <Clock size={14} />
          约 {Math.ceil(wordCount / 300)} 分钟
        </span>
        <span className="mobile-info-item">
          <FileText size={14} />
          {currentChapter?.status || '草稿'}
        </span>
      </div>

      {/* 主编辑区 */}
      <div className="mobile-editor-main">
        <textarea
          ref={textareaRef}
          className="mobile-editor-textarea"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="开始写作..."
          autoFocus
        />
      </div>

      {/* 底部功能区 */}
      {renderBottomPanel()}
    </div>
  )
}

// 人物面板组件
function MobileCharactersPanel({ novel, toast }) {
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCharacters()
  }, [novel.id])

  const loadCharacters = async () => {
    setLoading(true)
    const list = await window.api.listCharacters(novel.id)
    setCharacters(list)
    setLoading(false)
  }

  return (
    <div className="mobile-panel-content">
      <div className="mobile-list-header">
        <span>{characters.length} 个人物</span>
      </div>
      {loading ? (
        <div className="mobile-loading">加载中...</div>
      ) : characters.length === 0 ? (
        <div className="mobile-empty">暂无人物</div>
      ) : (
        characters.map(char => (
          <div key={char.id} className="mobile-list-item">
            <div className="mobile-list-icon" style={{ background: 'var(--accent)' }}>
              {char.name[0]}
            </div>
            <div className="mobile-list-info">
              <div className="mobile-list-title">{char.name}</div>
              <div className="mobile-list-meta">{char.role} · {char.alias || '无别名'}</div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// 大纲面板组件
function MobileOutlinePanel({ novel, toast }) {
  const [outlines, setOutlines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOutlines()
  }, [novel.id])

  const loadOutlines = async () => {
    setLoading(true)
    const list = await window.api.listOutlines(novel.id)
    setOutlines(list)
    setLoading(false)
  }

  return (
    <div className="mobile-panel-content">
      <div className="mobile-list-header">
        <span>{outlines.length} 个大纲节点</span>
      </div>
      {loading ? (
        <div className="mobile-loading">加载中...</div>
      ) : outlines.length === 0 ? (
        <div className="mobile-empty">暂无大纲</div>
      ) : (
        outlines.map(node => (
          <div key={node.id} className="mobile-list-item">
            <div className="mobile-list-info">
              <div className="mobile-list-title">{node.title}</div>
              <div className="mobile-list-meta">{node.type}</div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// 更多工具面板
function MobileToolsPanel({ novel, toast, onRefresh }) {
  const navigate = useNavigate?.() || (() => {})

  const tools = [
    { icon: Sparkles, label: 'AI 助手', action: () => toast('请在PC端使用AI功能', 'info') },
    { icon: Eye, label: '预览', action: () => {} },
    { icon: Search, label: '搜索替换', action: () => {} },
    { icon: RefreshCw, label: '刷新数据', action: onRefresh },
    { icon: Download, label: '导出', action: () => toast('请在PC端导出', 'info') },
  ]

  return (
    <div className="mobile-panel-content">
      <div className="mobile-tools-grid">
        {tools.map((tool, i) => (
          <button key={i} className="mobile-tool-btn" onClick={tool.action}>
            <tool.icon size={20} />
            <span>{tool.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}