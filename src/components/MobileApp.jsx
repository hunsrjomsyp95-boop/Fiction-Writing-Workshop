import { useState, useEffect, useCallback } from 'react'
import { 
  BookOpen, Users, Globe, Database, BarChart3, Settings, 
  Plus, Search, Edit3, Trash2, ChevronRight, FileText,
  ArrowLeft, Save, Type, Clock, Eye, List, Zap, Calendar,
  Sparkles, Download, MoreVertical, RefreshCw, Home,
  Wand2, FileSearch, Layers, PieChart
} from 'lucide-react'
import { useDialog } from '../Dialog.jsx'

// 主应用组件
export default function MobileApp({ novel, user, onExit, toast }) {
  const [currentPage, setCurrentPage] = useState('chapters') // chapters | editor | ai | extract | settings | view
  const [currentChapter, setCurrentChapter] = useState(null)
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const { confirm } = useDialog()

  // 加载章节
  const loadChapters = useCallback(async () => {
    const list = await window.api.listChapters(novel.id)
    setChapters(list)
    setLoading(false)
  }, [novel.id])

  useEffect(() => {
    loadChapters()
  }, [loadChapters])

  // 进入编辑页面
  const openEditor = (chapter) => {
    setCurrentChapter(chapter)
    setCurrentPage('editor')
  }

  // 返回章节列表
  const goBack = () => {
    setCurrentChapter(null)
    setCurrentPage('chapters')
    loadChapters()
  }

  // 新建章节
  const createChapter = async () => {
    const title = prompt('请输入章节标题：')
    if (!title?.trim()) return
    
    try {
      const chapter = await window.api.createChapter(novel.id, { title: title.trim() })
      await loadChapters()
      openEditor(chapter)
      toast('章节已创建', 'success')
    } catch (err) {
      toast('创建失败: ' + err.message, 'error')
    }
  }

  // 删除章节
  const deleteChapter = async (id, e) => {
    e?.stopPropagation()
    if (!(await confirm({ title: '删除章节', message: '确定删除此章节？', danger: true }))) return
    try {
      await window.api.deleteChapter(id)
      await loadChapters()
      toast('已删除', 'success')
    } catch (err) {
      toast('删除失败: ' + err.message, 'error')
    }
  }

  // 渲染当前页面
  const renderPage = () => {
    switch (currentPage) {
      case 'chapters':
        return (
          <ChaptersPage
            novel={novel}
            chapters={chapters}
            loading={loading}
            onOpen={openEditor}
            onCreate={createChapter}
            onDelete={deleteChapter}
            toast={toast}
          />
        )
      case 'editor':
        return (
          <EditorPage
            novel={novel}
            chapter={currentChapter}
            onBack={goBack}
            toast={toast}
          />
        )
      case 'ai':
        return <AIPage novel={novel} toast={toast} />
      case 'extract':
        return <ExtractPage novel={novel} toast={toast} />
      case 'settings':
        return <SettingsPage novel={novel} toast={toast} />
      case 'view':
        return <ViewPage novel={novel} toast={toast} />
      default:
        return null
    }
  }

  return (
    <div className="mobile-app">
      {/* 顶部导航栏 */}
      <header className="mobile-app-header">
        {currentPage === 'editor' ? (
          <>
            <button className="mobile-header-btn" onClick={goBack}>
              <ArrowLeft size={20} />
            </button>
            <h1 className="mobile-header-title">{currentChapter?.title || '编辑'}</h1>
            <div className="mobile-header-right" />
          </>
        ) : currentPage === 'chapters' ? (
          <>
            <button className="mobile-header-btn" onClick={onExit}>
              <ArrowLeft size={20} />
            </button>
            <h1 className="mobile-header-title">{novel.name}</h1>
            <div className="mobile-header-right" />
          </>
        ) : (
          <>
            <div className="mobile-header-btn" />
            <h1 className="mobile-header-title">{novel.name}</h1>
            <div className="mobile-header-right" />
          </>
        )}
      </header>

      {/* 主内容区 */}
      <main className="mobile-app-content">
        {renderPage()}
      </main>

      {/* 底部导航栏 - 编辑页面隐藏 */}
      {currentPage !== 'editor' && (
        <nav className="mobile-app-tabbar">
          {[
            { id: 'chapters', icon: BookOpen, label: '写作' },
            { id: 'ai', icon: Sparkles, label: 'AI' },
            { id: 'extract', icon: Wand2, label: '提取' },
            { id: 'settings', icon: Layers, label: '设定' },
            { id: 'view', icon: PieChart, label: '视图' },
          ].map(tab => (
            <button
              key={tab.id}
              className={`mobile-tab-item ${currentPage === tab.id ? 'active' : ''}`}
              onClick={() => setCurrentPage(tab.id)}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}

// ========== 写作页：章节列表 ==========
function ChaptersPage({ novel, chapters, loading, onOpen, onCreate, onDelete, toast }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredChapters = chapters.filter(ch => 
    ch.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalWords = chapters.reduce((sum, ch) => sum + (ch.word_count || 0), 0)

  return (
    <div className="mobile-page">
      {/* 统计卡片 */}
      <div className="mobile-stats-card">
        <div className="mobile-stats-item">
          <div className="mobile-stats-value">{chapters.length}</div>
          <div className="mobile-stats-label">章节</div>
        </div>
        <div className="mobile-stats-item">
          <div className="mobile-stats-value">{totalWords.toLocaleString()}</div>
          <div className="mobile-stats-label">总字数</div>
        </div>
        <div className="mobile-stats-item">
          <div className="mobile-stats-value">{chapters.filter(ch => ch.status === '已完成').length}</div>
          <div className="mobile-stats-label">已完成</div>
        </div>
      </div>

      {/* 搜索和新建 */}
      <div className="mobile-actions">
        <div className="mobile-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="搜索章节..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="mobile-add-btn" onClick={onCreate}>
          <Plus size={18} />
        </button>
      </div>

      {/* 章节列表 */}
      {loading ? (
        <div className="mobile-loading">加载中...</div>
      ) : filteredChapters.length === 0 ? (
        <div className="mobile-empty">
          <FileText size={48} />
          <p>还没有章节</p>
          <button onClick={onCreate}>创建第一章</button>
        </div>
      ) : (
        <div className="mobile-chapter-list">
          {filteredChapters.map((ch, i) => (
            <div 
              key={ch.id} 
              className="mobile-chapter-item"
              onClick={() => onOpen(ch)}
            >
              <div className="mobile-chapter-num">{i + 1}</div>
              <div className="mobile-chapter-info">
                <div className="mobile-chapter-title">{ch.title}</div>
                <div className="mobile-chapter-meta">
                  <span>{ch.word_count || 0} 字</span>
                  <span className={`mobile-status ${ch.status === '已完成' ? 'done' : ''}`}>
                    {ch.status || '草稿'}
                  </span>
                </div>
              </div>
              <button 
                className="mobile-chapter-delete"
                onClick={(e) => onDelete(ch.id, e)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ========== 编辑页面 ==========
function EditorPage({ novel, chapter, onBack, toast }) {
  const [content, setContent] = useState(chapter?.content || '')
  const [title, setTitle] = useState(chapter?.title || '')
  const [saving, setSaving] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [showToolbar, setShowToolbar] = useState(false)

  useEffect(() => {
    setWordCount(content.length)
  }, [content])

  // 保存
  const save = async () => {
    if (!chapter) return
    setSaving(true)
    try {
      await window.api.updateChapter(chapter.id, { title, content })
      toast('已保存', 'success')
    } catch (err) {
      toast('保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  // 自动保存
  useEffect(() => {
    if (!chapter) return
    const timer = setTimeout(() => {
      if (content !== chapter.content) {
        window.api.updateChapter(chapter.id, { content })
      }
    }, 30000)
    return () => clearTimeout(timer)
  }, [content, chapter])

  return (
    <div className="mobile-editor-page">
      {/* 编辑器工具栏 */}
      <div className="mobile-editor-toolbar">
        <div className="mobile-editor-stats">
          <span><Type size={14} /> {wordCount} 字</span>
          <span><Clock size={14} /> 约 {Math.ceil(wordCount / 300)} 分钟</span>
        </div>
        <button className="mobile-save-btn" onClick={save} disabled={saving}>
          <Save size={16} />
          {saving ? '...' : '保存'}
        </button>
      </div>

      {/* 标题输入 */}
      <input
        className="mobile-title-input"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="章节标题"
      />

      {/* 编辑区 */}
      <textarea
        className="mobile-editor-textarea"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="开始写作..."
        autoFocus
      />
    </div>
  )
}

// ========== AI页面 ==========
function AIPage({ novel, toast }) {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const sendPrompt = async () => {
    if (!prompt.trim() || loading) return
    
    const userMessage = prompt.trim()
    setPrompt('')
    setLoading(true)

    const newMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)

    try {
      const chapters = await window.api.listChapters(novel.id)
      const characters = await window.api.listCharacters(novel.id)
      const context = `小说：${novel.name}，${chapters.length}章，${characters.length}人物`
      
      const result = await window.api.aiAssistant(userMessage, context)
      setMessages([...newMessages, { role: 'assistant', content: result.response || '无法生成回复' }])
    } catch (e) {
      toast('AI请求失败: ' + e.message, 'error')
      setMessages(newMessages)
    } finally {
      setLoading(false)
    }
  }

  const quickPrompts = [
    { label: '续写', prompt: '请帮我续写这个故事' },
    { label: '润色', prompt: '请帮我润色文字' },
    { label: '总结', prompt: '请总结当前大纲' },
    { label: '人物建议', prompt: '给人物发展建议' },
  ]

  return (
    <div className="mobile-page mobile-ai-page">
      <div className="mobile-page-header">
        <h2>AI 助手</h2>
      </div>

      <div className="mobile-ai-messages">
        {messages.length === 0 && (
          <div className="mobile-ai-welcome">
            <Sparkles size={48} />
            <p>AI写作助手</p>
            <div className="mobile-quick-prompts">
              {quickPrompts.map((qp, i) => (
                <button key={i} onClick={() => setPrompt(qp.prompt)}>
                  {qp.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`mobile-ai-message ${msg.role}`}>
            <div className="mobile-ai-bubble">{msg.content}</div>
          </div>
        ))}
        
        {loading && (
          <div className="mobile-ai-message assistant">
            <div className="mobile-ai-bubble loading">思考中...</div>
          </div>
        )}
      </div>

      <div className="mobile-ai-input">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendPrompt()
            }
          }}
          placeholder="输入问题..."
          rows={1}
        />
        <button onClick={sendPrompt} disabled={loading || !prompt.trim()}>
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}

// ========== 提取页面 ==========
function ExtractPage({ novel, toast }) {
  const [extracting, setExtracting] = useState(false)

  const extractFeatures = [
    { icon: Users, label: '提取人物', desc: '从章节中提取人物信息' },
    { icon: Globe, label: '提取设定', desc: '从章节中提取世界观设定' },
    { icon: Zap, label: '提取伏笔', desc: '从章节中提取伏笔线索' },
    { icon: Calendar, label: '提取事件', desc: '从章节中提取时间线事件' },
    { icon: FileSearch, label: '错字检查', desc: '检查章节中的错别字' },
    { icon: Wand2, label: 'AI润色', desc: '使用AI润色选中文字' },
  ]

  return (
    <div className="mobile-page">
      <div className="mobile-page-header">
        <h2>智能提取</h2>
      </div>

      <div className="mobile-extract-grid">
        {extractFeatures.map((feat, i) => (
          <button key={i} className="mobile-extract-item" onClick={() => toast('请在PC端使用此功能', 'info')}>
            <feat.icon size={24} />
            <span className="mobile-extract-label">{feat.label}</span>
            <span className="mobile-extract-desc">{feat.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ========== 设定页面 ==========
function SettingsPage({ novel, toast }) {
  const [activeTab, setActiveTab] = useState('characters')

  const tabs = [
    { id: 'characters', label: '人物' },
    { id: 'worlds', label: '世界观' },
    { id: 'outline', label: '大纲' },
    { id: 'foreshadow', label: '伏笔' },
  ]

  return (
    <div className="mobile-page">
      <div className="mobile-page-header">
        <h2>设定管理</h2>
      </div>

      <div className="mobile-settings-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`mobile-settings-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mobile-settings-content">
        {activeTab === 'characters' && <CharactersList novel={novel} toast={toast} />}
        {activeTab === 'worlds' && <WorldsList novel={novel} toast={toast} />}
        {activeTab === 'outline' && <OutlineList novel={novel} toast={toast} />}
        {activeTab === 'foreshadow' && <ForeshadowList novel={novel} toast={toast} />}
      </div>
    </div>
  )
}

// 人物列表组件
function CharactersList({ novel, toast }) {
  const [characters, setCharacters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCharacters()
  }, [novel.id])

  const loadCharacters = async () => {
    const list = await window.api.listCharacters(novel.id)
    setCharacters(list)
    setLoading(false)
  }

  if (loading) return <div className="mobile-loading">加载中...</div>

  return (
    <div className="mobile-list">
      {characters.length === 0 ? (
        <div className="mobile-empty">暂无人物</div>
      ) : (
        characters.map(char => (
          <div key={char.id} className="mobile-list-item">
            <div className="mobile-list-avatar" style={{ background: 'var(--accent)' }}>
              {char.name[0]}
            </div>
            <div className="mobile-list-info">
              <div className="mobile-list-name">{char.name}</div>
              <div className="mobile-list-meta">{char.role}</div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// 世界观列表组件
function WorldsList({ novel, toast }) {
  const [worlds, setWorlds] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorlds()
  }, [novel.id])

  const loadWorlds = async () => {
    const list = await window.api.listWorlds(novel.id)
    setWorlds(list)
    setLoading(false)
  }

  if (loading) return <div className="mobile-loading">加载中...</div>

  return (
    <div className="mobile-list">
      {worlds.length === 0 ? (
        <div className="mobile-empty">暂无世界观</div>
      ) : (
        worlds.map(world => (
          <div key={world.id} className="mobile-list-item">
            <div className="mobile-list-icon">🌍</div>
            <div className="mobile-list-info">
              <div className="mobile-list-name">{world.name}</div>
              <div className="mobile-list-meta">{world.category}</div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// 大纲列表组件
function OutlineList({ novel, toast }) {
  const [outlines, setOutlines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOutlines()
  }, [novel.id])

  const loadOutlines = async () => {
    const list = await window.api.listOutlines(novel.id)
    setOutlines(list)
    setLoading(false)
  }

  if (loading) return <div className="mobile-loading">加载中...</div>

  return (
    <div className="mobile-list">
      {outlines.length === 0 ? (
        <div className="mobile-empty">暂无大纲</div>
      ) : (
        outlines.map(node => (
          <div key={node.id} className="mobile-list-item">
            <div className="mobile-list-info">
              <div className="mobile-list-name">{node.title}</div>
              <div className="mobile-list-meta">{node.type}</div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// 伏笔列表组件
function ForeshadowList({ novel, toast }) {
  const [foreshadows, setForeshadows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadForeshadows()
  }, [novel.id])

  const loadForeshadows = async () => {
    const list = await window.api.listForeshadowings(novel.id)
    setForeshadows(list)
    setLoading(false)
  }

  if (loading) return <div className="mobile-loading">加载中...</div>

  return (
    <div className="mobile-list">
      {foreshadows.length === 0 ? (
        <div className="mobile-empty">暂无伏笔</div>
      ) : (
        foreshadows.map(f => (
          <div key={f.id} className="mobile-list-item">
            <div className="mobile-list-info">
              <div className="mobile-list-name">{f.title}</div>
              <div className="mobile-list-meta">{f.status} · {f.type}</div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ========== 视图页面 ==========
function ViewPage({ novel, toast }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [novel.id])

  const loadStats = async () => {
    const s = await window.api.getStats(novel.id)
    setStats(s)
    setLoading(false)
  }

  const exportNovel = async (format) => {
    try {
      await window.api.exportNovel(novel.id, format)
      toast('导出成功', 'success')
    } catch (e) {
      toast('导出失败', 'error')
    }
  }

  if (loading) return <div className="mobile-loading">加载中...</div>

  return (
    <div className="mobile-page">
      <div className="mobile-page-header">
        <h2>数据视图</h2>
      </div>

      {/* 统计卡片 */}
      <div className="mobile-stats-grid">
        <div className="mobile-stat-item">
          <div className="mobile-stat-value">{stats?.totalWords?.toLocaleString() || 0}</div>
          <div className="mobile-stat-label">总字数</div>
        </div>
        <div className="mobile-stat-item">
          <div className="mobile-stat-value">{stats?.totalChapters || 0}</div>
          <div className="mobile-stat-label">章节数</div>
        </div>
        <div className="mobile-stat-item">
          <div className="mobile-stat-value">{stats?.characters || 0}</div>
          <div className="mobile-stat-label">人物</div>
        </div>
        <div className="mobile-stat-item">
          <div className="mobile-stat-value">{stats?.worldCount || 0}</div>
          <div className="mobile-stat-label">世界观</div>
        </div>
        <div className="mobile-stat-item">
          <div className="mobile-stat-value">{stats?.foreshadowings || 0}</div>
          <div className="mobile-stat-label">伏笔</div>
        </div>
        <div className="mobile-stat-item">
          <div className="mobile-stat-value">{stats?.todayWords || 0}</div>
          <div className="mobile-stat-label">今日</div>
        </div>
      </div>

      {/* 功能按钮 */}
      <div className="mobile-actions-grid">
        <button onClick={() => exportNovel('md')}>
          <Download size={20} />
          <span>导出MD</span>
        </button>
        <button onClick={() => exportNovel('txt')}>
          <Download size={20} />
          <span>导出TXT</span>
        </button>
        <button onClick={() => window.api.backupExportDb()}>
          <RefreshCw size={20} />
          <span>备份</span>
        </button>
        <button onClick={() => window.api.backupImportDb()}>
          <Upload size={20} />
          <span>恢复</span>
        </button>
      </div>

      {/* AI配置 */}
      <div className="mobile-card">
        <h3>AI 配置</h3>
        <button className="mobile-btn" onClick={() => toast('请在PC端配置AI', 'info')}>
          配置 AI 服务
        </button>
      </div>
    </div>
  )
}

// 导入图标
function Send(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="22" y1="2" x2="11" y2="13"></line>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  )
}

function Upload(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  )
}