import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import {
  FileText,
  Bot,
  Scan,
  ListTree,
  Users,
  Globe,
  Link,
  Clock,
  BookOpen,
  BarChart3,
  Brain,
  Search,
  FolderInput,
  Keyboard,
  Settings,
  HelpCircle,
  Home,
  Check,
  RotateCw,
  Edit3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import SearchModal from './SearchModal.jsx'
import DataMenu from './DataMenu.jsx'
import Onboarding from './Onboarding.jsx'
import AccountModal from './AccountModal.jsx'
import ShortcutModal from './ShortcutModal.jsx'
import SettingsModal from './SettingsModal.jsx'
import HelpModal from './HelpModal.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'
import { useShortcutRun } from '../shortcuts.jsx'

const ChaptersView = lazy(() => import('./ChaptersView.jsx'))
const OutlineView = lazy(() => import('./OutlineView.jsx'))
const CharactersView = lazy(() => import('./CharactersView.jsx'))
const WorldsView = lazy(() => import('./WorldsView.jsx'))
const MaterialsView = lazy(() => import('./MaterialsView.jsx'))
const ForeshadowView = lazy(() => import('./ForeshadowView.jsx'))
const TimelineView = lazy(() => import('./TimelineView.jsx'))
const StatsView = lazy(() => import('./StatsView.jsx'))
const AIServiceView = lazy(() => import('./AIServiceView.jsx'))
const ExtractAgentView = lazy(() => import('./ExtractAgentView.jsx'))
const MindmapView = lazy(() => import('./MindmapView.jsx'))

const TABS = [
  { key: 'chapters', label: '章节', icon: FileText },
  { key: 'think', label: 'AI', icon: Bot },
  { key: 'extract', label: '提取', icon: Scan },
  { key: 'outline', label: '大纲', icon: ListTree },
  { key: 'characters', label: '人物', icon: Users },
  { key: 'worlds', label: '世界观', icon: Globe },
  { key: 'foreshadow', label: '伏笔', icon: Link },
  { key: 'timeline', label: '年表', icon: Clock },
  { key: 'materials', label: '资料', icon: BookOpen },
  { key: 'stats', label: '统计', icon: BarChart3 },
  { key: 'mindmap', label: '思维图', icon: Brain },
]

/**
 * 工作区组件
 * 
 * 小说创作的主工作区，提供标签页式界面，包括：
 * - 章节管理：创建、编辑、排序章节
 * - 大纲管理：树状大纲结构，支持拖拽排序
 * - 人物管理：详细的人物档案和关系图
 * - 世界观设定：多世界支持，设定分类管理
 * - 资料库：参考资料管理
 * - 时间线：事件时间线管理
 * - 伏笔管理：伏笔追踪和状态管理
 * - 物品道具：物品管理
 * - 写作统计：字数、时间、效率分析
 * - 数据导入导出：支持多种格式
 * 
 * @param {Object} novel - 小说对象
 * @param {Object} user - 用户对象
 * @param {Function} onExit - 退出工作区的回调
 * @param {Function} onLock - 锁定应用的回调
 */
export default function Workspace({ novel, user, onExit, onLock }) {
  const toast = useToast()
  const { prompt } = useDialog()
  const [tab, setTab] = useState('chapters')
  const [novelMeta, setNovelMeta] = useState(novel)
  const [searchOpen, setSearchOpen] = useState(false)
  const [dataMenuOpen, setDataMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [showOnboard, setShowOnboard] = useState(false)
  const [shortcutOpen, setShortcutOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [saveState, setSaveState] = useState('saved')

  useShortcutRun('full_search', () => setSearchOpen(true))
  useShortcutRun('data_menu', () => setDataMenuOpen(true))
  useShortcutRun('ai_settings', () => setSettingsOpen(true))
  useShortcutRun('shortcut_settings', () => setShortcutOpen(true))
  useShortcutRun('account', () => setAccountOpen(true))
  useShortcutRun('lock', () => onLock?.())
  useShortcutRun('tab_chapters', () => setTab('chapters'))
  useShortcutRun('tab_think', () => setTab('think'))
  useShortcutRun('tab_outline', () => setTab('outline'))
  useShortcutRun('tab_characters', () => setTab('characters'))
  useShortcutRun('tab_worlds', () => setTab('worlds'))
  useShortcutRun('tab_foreshadow', () => setTab('foreshadow'))
  useShortcutRun('tab_timeline', () => setTab('timeline'))
  useShortcutRun('tab_materials', () => setTab('materials'))
  useShortcutRun('tab_stats', () => setTab('stats'))
  useShortcutRun('tab_extract', () => setTab('extract'))
  useShortcutRun('tab_mindmap', () => setTab('mindmap'))

  useEffect(() => {
    window.api.getSetting('onboarded', '0').then((v) => {
      if (v !== '1') setShowOnboard(true)
    })
    window.api.getSetting('sidebar_open', '0').then((v) => setSidebarOpen(v !== '0'))
  }, [])

  useEffect(() => {
    const handler = (e) => {
      const { tab: t } = e.detail || {}
      if (t) setTab(t)
    }
    window.addEventListener('jump-tab', handler)
    return () => window.removeEventListener('jump-tab', handler)
  }, [])

  const toggleSidebar = async () => {
    const next = !sidebarOpen
    setSidebarOpen(next)
    await window.api.setSetting('sidebar_open', next ? '1' : '0')
  }

  const closeOnboard = () => {
    setShowOnboard(false)
    window.api.setSetting('onboarded', '1')
  }

  const onDirty = useCallback(() => setSaveState('dirty'), [])
  const onSaved = useCallback(() => setSaveState('saved'), [])
  const onSaving = useCallback(() => setSaveState('saving'), [])

  const rename = async () => {
    const name = await prompt({ title: '修改小说名称', value: novelMeta.name })
    if (!name || name === novelMeta.name) return
    const updated = await window.api.updateNovel(novelMeta.id, { name })
    setNovelMeta(updated)
    toast('已修改成功', 'success')
  }

  const jumpToChapter = (chapterId) => {
    setTab('chapters')
    window.dispatchEvent(new CustomEvent('jump-chapter', { detail: { chapterId } }))
  }

  const reloadChapter = () => {
    window.dispatchEvent(new CustomEvent('reload-chapter'))
  }

  return (
    <div className='app' role='application' aria-label='小说创作工坊'>
      <header className='topbar' role='banner'>
        <div
          className='title'
          onClick={rename}
          title='点击可重命名'
          role='button'
          tabIndex={0}
          aria-label={`项目名称: ${novelMeta.name}`}
        >
          {novelMeta.name}
        </div>
        {novelMeta.genre && <span className='badge accent'>{novelMeta.genre}</span>}
        <div className='spacer' />
        <span
          className={`save-state ${saveState}`}
          aria-live='polite'
          aria-label={`保存状态: ${saveState === 'saved' ? '已保存' : saveState === 'saving' ? '保存中' : '未保存'}`}
        >
          {saveState === 'saved' ? (
            <>
              <Check size={14} /> 已保存
            </>
          ) : saveState === 'saving' ? (
            <>
              <RotateCw size={14} /> 保存中...
            </>
          ) : (
            <>
              <Edit3 size={14} /> 未保存
            </>
          )}
        </span>
        {user && (
          <span
            className='badge green clickable'
            title='账号管理'
            onClick={() => setAccountOpen(true)}
            role='button'
            tabIndex={0}
          >
            {user.username}
          </span>
        )}
        <nav aria-label='工具栏'>
          <button className='ghost' title='全局搜索 (Ctrl+F)' onClick={() => setSearchOpen(true)} aria-label='全局搜索'>
            <Search size={18} />
          </button>
          <button className='ghost' title='导入/导出/数据' onClick={() => setDataMenuOpen(true)} aria-label='导入导出'>
            <FolderInput size={18} />
          </button>
          <button className='ghost' title='快捷键' onClick={() => setShortcutOpen(true)} aria-label='快捷键设置'>
            <Keyboard size={18} />
          </button>
          <button className='ghost' title='设置' onClick={() => setSettingsOpen(true)} aria-label='设置'>
            <Settings size={18} />
          </button>
          <button className='ghost' title='帮助' onClick={() => setHelpOpen(true)} aria-label='帮助'>
            <HelpCircle size={18} />
          </button>
          <button className='ghost' onClick={onExit} title='返回首页' aria-label='返回首页'>
            <Home size={18} />
          </button>
        </nav>
      </header>

      <div className='content'>
        <nav className='nav-rail' role='navigation' aria-label='主导航'>
          {sidebarOpen ? (
            <div className='sidebar'>
              <div className='sidebar-inner' role='tablist' aria-label='功能模块'>
                {TABS.map((t) => (
                  <div
                    key={t.key}
                    className={`nav-item ${tab === t.key ? 'active' : ''}`}
                    title={t.label}
                    onClick={() => setTab(t.key)}
                    role='tab'
                    aria-selected={tab === t.key}
                    tabIndex={0}
                    aria-label={t.label}
                  >
                    <span className='nav-icon'>
                      <t.icon size={20} />
                    </span>
                    <span className='nav-label'>{t.label}</span>
                  </div>
                ))}
              </div>
              <div className='sidebar-foot'>
                <div className='nav-item' title='帮助' onClick={() => setHelpOpen(true)}>
                  <span className='nav-icon'>
                    <HelpCircle size={20} />
                  </span>
                </div>
                <div className='nav-item nav-toggle' title='隐藏侧边栏' onClick={toggleSidebar}>
                  <span className='nav-icon'>
                    <ChevronLeft size={20} />
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className='nav-rail-collapsed'>
              <button className='ghost' onClick={toggleSidebar} title='展开侧边栏'>
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </nav>

        <main className='main' role='main' aria-label='主内容区域'>
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className='center' style={{ height: '100%' }} aria-label='加载中'>
                  <div className='spinner' />
                </div>
              }
            >
              {tab === 'chapters' && (
                <ChaptersView novel={novelMeta} onDirty={onDirty} onSaving={onSaving} onSaved={onSaved} />
              )}
              {tab === 'think' && <AIServiceView novel={novelMeta} />}
              {tab === 'outline' && <OutlineView novel={novelMeta} />}
              {tab === 'characters' && <CharactersView novel={novelMeta} />}
              {tab === 'worlds' && <WorldsView novel={novelMeta} />}
              {tab === 'foreshadow' && <ForeshadowView novel={novelMeta} />}
              {tab === 'timeline' && <TimelineView novel={novelMeta} />}
              {tab === 'materials' && <MaterialsView novel={novelMeta} />}
              {tab === 'stats' && <StatsView novel={novelMeta} />}
              {tab === 'extract' && <ExtractAgentView novel={novelMeta} />}
              {tab === 'mindmap' && <MindmapView novel={novelMeta} />}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {searchOpen && <SearchModal novel={novelMeta} onClose={() => setSearchOpen(false)} onJump={jumpToChapter} onReplace={reloadChapter} />}
      {dataMenuOpen && <DataMenu novel={novelMeta} onClose={() => setDataMenuOpen(false)} />}
      {accountOpen && <AccountModal user={user} onClose={() => setAccountOpen(false)} onLock={onLock} />}
      {shortcutOpen && <ShortcutModal onClose={() => setShortcutOpen(false)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      {showOnboard && <Onboarding onClose={closeOnboard} />}
    </div>
  )
}
