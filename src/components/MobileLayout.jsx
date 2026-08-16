import { useState, useEffect } from 'react'
import { Home, BookOpen, Users, Globe, Database, BarChart3, Settings, ChevronLeft, Menu, X, List, Zap, Calendar, Sparkles, Download } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'home', label: '首页', icon: Home },
  { id: 'chapters', label: '章节', icon: BookOpen },
  { id: 'characters', label: '人物', icon: Users },
  { id: 'worlds', label: '世界观', icon: Globe },
  { id: 'materials', label: '资料', icon: Database },
  { id: 'outline', label: '大纲', icon: List },
  { id: 'foreshadow', label: '伏笔', icon: Zap },
  { id: 'timeline', label: '时间线', icon: Calendar },
  { id: 'stats', label: '统计', icon: BarChart3 },
  { id: 'ai', label: 'AI助手', icon: Sparkles },
  { id: 'data', label: '数据', icon: Download },
  { id: 'settings', label: '设置', icon: Settings },
]

export default function MobileLayout({ children, currentView, onViewChange, novel, onExit }) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="mobile-layout">
      {/* 顶部导航栏 */}
      <header className="mobile-header">
        {novel ? (
          <>
            <button className="mobile-back-btn" onClick={onExit}>
              <ChevronLeft size={24} />
            </button>
            <h1 className="mobile-title">{novel.name}</h1>
          </>
        ) : (
          <h1 className="mobile-title">小说创作工坊</h1>
        )}
        <button className="mobile-menu-btn" onClick={() => setShowMenu(!showMenu)}>
          {showMenu ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* 侧边菜单 */}
      {showMenu && (
        <div className="mobile-menu-overlay" onClick={() => setShowMenu(false)}>
          <nav className="mobile-menu" onClick={e => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <h2>导航</h2>
            </div>
            <div className="mobile-menu-items">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    className={`mobile-menu-item ${currentView === item.id ? 'active' : ''}`}
                    onClick={() => {
                      onViewChange(item.id)
                      setShowMenu(false)
                    }}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>
        </div>
      )}

      {/* 主内容区域 */}
      <main className="mobile-content">
        {children}
      </main>

      {/* 底部导航栏 */}
      {novel && (
        <footer className="mobile-tabbar">
          {NAV_ITEMS.slice(1, 6).map(item => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`mobile-tab ${currentView === item.id ? 'active' : ''}`}
                onClick={() => onViewChange(item.id)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}
          <button
            className="mobile-tab"
            onClick={() => setShowMenu(true)}
          >
            <Menu size={20} />
            <span>更多</span>
          </button>
        </footer>
      )}
    </div>
  )
}