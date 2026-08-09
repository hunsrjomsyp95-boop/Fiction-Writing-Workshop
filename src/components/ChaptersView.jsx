import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { marked } from 'marked'
import sanitizeHtml from '../sanitizeHtml.js'
import {
  Clock,
  Target,
  ChevronUp,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react'
import Editor from './Editor.jsx'
import TypoCheckPanel from './TypoCheckPanel.jsx'
import SensitiveWordsPanel from './SensitiveWordsPanel.jsx'
import VersionPanel from './VersionPanel.jsx'
import StagingPanel from './StagingPanel.jsx'
import AIPanel from './AIPanel.jsx'
import SelectionToolbar from './SelectionToolbar.jsx'
import FocusModal from './FocusModal.jsx'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'
import { useShortcutRun } from '../shortcuts.jsx'

marked.setOptions({ gfm: true, breaks: true })

// 章节列表项组件 - 使用 React.memo 避免无效重渲染
const ChapterItem = memo(function ChapterItem({
  ch,
  isActive,
  isSelected,
  isDragging,
  canMoveUp,
  canMoveDown,
  onSelect,
  onToggleSelect,
  onMoveUp,
  onMoveDown,
  onDelete,
  onSplit,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  return (
    <div
      className={`tree-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onSelect}
    >
      <input
        type='checkbox'
        checked={isSelected}
        onClick={(e) => e.stopPropagation()}
        onChange={onToggleSelect}
        style={{ marginLeft: 4 }}
      />
      <div className='row' onClick={(e) => e.stopPropagation()} style={{ gap: 2, flexShrink: 0 }}>
        <button className='ghost' onClick={onMoveUp} disabled={!canMoveUp}>
          <ChevronUp size={16} />
        </button>
        <button className='ghost' onClick={onMoveDown} disabled={!canMoveDown}>
          <ChevronDown size={16} />
        </button>
      </div>
      <div className='grow' style={{ overflow: 'hidden' }}>
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.title}</div>
        <div className='hint' style={{ fontSize: 11 }}>
          {ch.word_count}字 · {ch.status}
        </div>
      </div>
      <button className='ghost small' title='分屏编辑' onClick={onSplit}>
        ⧉
      </button>
      <button className='ghost small danger' onClick={onDelete}>
        ×
      </button>
    </div>
  )
}, (prev, next) => {
  return prev.ch === next.ch && prev.isActive === next.isActive && prev.isSelected === next.isSelected &&
    prev.isDragging === next.isDragging && prev.canMoveUp === next.canMoveUp && prev.canMoveDown === next.canMoveDown
})

function Skeleton({ count = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className='skeleton-line' style={{ height: 32 }} />
      ))}
    </div>
  )
}

/**
 * 章节管理视图
 * 
 * 提供完整的章节管理功能，包括：
 * - 章节列表：显示所有章节，支持拖拽排序、多选、批量操作
 * - 编辑器：集成CodeMirror编辑器，支持Markdown语法高亮
 * - 实时预览：Markdown渲染预览，支持同步滚动
 * - AI辅助：集成AI面板，支持续写、改写等
 * - 错字检查：实时错字和敏感词检测
 * - 版本管理：自动保存版本历史，支持对比和恢复
 * - 专注模式：番茄钟、字数目标、全屏写作
 * - 快捷键：丰富的快捷键支持
 * 
 * @param {Object} novel - 小说对象
 * @param {Function} onDirty - 内容变化回调（用于标记未保存状态）
 * @param {Function} onSaving - 保存开始回调
 * @param {Function} onSaved - 保存完成回调
 */
export default function ChaptersView({ novel, onDirty, onSaving, onSaved }) {
  const toast = useToast()
  const { prompt, confirm } = useDialog()
  const [chapters, setChapters] = useState(null)
  const [current, setCurrent] = useState(null)
  const [content, setContent] = useState('')
  const [marks, setMarks] = useState([])
  const [rightTab, setRightTab] = useState('ai')
  const [wordCount, setWordCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [caret, setCaret] = useState(null)
  const caretRef = useRef(null)
  const [reading, setReading] = useState(false)
  const [readingFont, setReadingFont] = useState(18)
  const [toolbarOpen, setToolbarOpen] = useState(true)
  const [leftOpen, setLeftOpen] = useState(true)
  const [leftW, setLeftW] = useState(240)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [searchText, setSearchText] = useState('')
  const [dragId, setDragId] = useState(null)
  const [rightOpen, setRightOpen] = useState(true)
  const [rightW, setRightW] = useState(340)
  const [splitChapter, setSplitChapter] = useState(null)
  const [splitContent, setSplitContent] = useState('')
  const [typing, setTyping] = useState({ today: 0, session: 0, hourly: [] })
  const [streak, setStreak] = useState(0)
  const [dailyGoal, setDailyGoal] = useState(0)
  const [focusOpen, setFocusOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [savedWordCount, setSavedWordCount] = useState(0)
  const saveTimer = useRef(null)
  const chaptersRef = useRef(chapters)
  chaptersRef.current = chapters
  const contentRef = useRef('')
  contentRef.current = content
  const typingPending = useRef(0)
  const typingTimer = useRef(null)
  const editorViewRef = useRef(null)
  const [selection, setSelection] = useState(null)
  const leftPanelRef = useRef(null)
  const rightPanelRef = useRef(null)

  useEffect(() => {
    if (!leftOpen) return
    const handler = (e) => {
      if (leftPanelRef.current && !leftPanelRef.current.contains(e.target)) setLeftOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [leftOpen])

  useEffect(() => {
    if (!rightOpen) return
    const handler = (e) => {
      if (rightPanelRef.current && !rightPanelRef.current.contains(e.target)) setRightOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [rightOpen])

  const typingFlush = useCallback(() => {
    if (typingPending.current <= 0) return
    const w = typingPending.current
    typingPending.current = 0
    window.api.addTypingWords(novel.id, w).then(setTyping)
  }, [novel.id])

  useEffect(() => {
    window.api.getTypingStats(novel.id).then(setTyping)
    window.api.getWritingStreak(novel.id).then(setStreak)
    window.api.getSetting('toolbar_open', '1').then((v) => setToolbarOpen(v !== '0'))
    window.api.getSetting('daily_goal', '0').then((v) => setDailyGoal(parseInt(v) || 0))
    return () => {
      clearTimeout(typingTimer.current)
      typingFlush()
    }
  }, [novel.id, typingFlush])

  const handleTyping = useCallback(
    (n) => {
      typingPending.current += n
      setTyping((t) => ({ ...t, session: t.session + n }))
      if (!typingTimer.current) {
        typingTimer.current = setTimeout(() => {
          typingTimer.current = null
          typingFlush()
        }, 3000)
      }
    },
    [typingFlush]
  )

  const selectChapterRef = useRef(null)

  useEffect(() => {
    const h = (e) => {
      const id = e.detail?.chapterId
      if (!id) return
      const ch = chapters?.find((c) => c.id === id)
      if (ch) selectChapterRef.current(ch)
    }
    window.addEventListener('jump-chapter', h)
    return () => window.removeEventListener('jump-chapter', h)
  }, [chapters])

  const loadChapters = async () => {
    const list = await window.api.listChapters(novel.id)
    setChapters(list)
    if (list.length > 0) {
      if (!current || !list.find((c) => c.id === current.id)) {
        setCurrent(list[0])
        setContent(list[0].content || '')
        setWordCount((list[0].content || '').replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, '').length)
      }
    } else {
      setCurrent(null)
      setContent('')
    }
  }

  useEffect(() => {
    loadChapters()
    setSelectedIds(new Set())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novel.id])

  const doSave = useCallback(
    async (chapter, text) => {
      setSaving(true)
      onSaving?.()
      try {
        const updated = await window.api.updateChapter(chapter.id, { content: text })
        setChapters((list) => list.map((c) => (c.id === updated.id ? updated : c)))
        setWordCount(updated.word_count)
        setSavedWordCount(updated.word_count)
        onSaved?.()
      } catch (e) {
        toast('保存失败：' + e.message, 'error')
      } finally {
        setSaving(false)
      }
    },
    [onSaving, onSaved, toast]
  )

  const currentRef = useRef(null)
  currentRef.current = current

  const handleChange = useCallback(
    (text) => {
      setContent(text)
      onDirty?.()
      const chId = currentRef.current?.id
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        const ch = currentRef.current
        if (ch && ch.id === chId) doSave(ch, text)
      }, 1200)
    },
    [doSave, onDirty]
  )

  const handleSelectionChange = useCallback((sel) => {
    setSelection(sel)
  }, [])

  const handleWikiLink = useCallback(
    async (name) => {
      try {
        const chars = await window.api.listCharacters(novel.id)
        const ch = chars.find((c) => c.name === name || c.alias === name)
        if (ch) {
          window.dispatchEvent(new CustomEvent('jump-tab', { detail: { tab: 'characters', characterId: ch.id } }))
          toast(`已跳转到人物：${ch.name}`, 'success')
          return
        }
        const chaps = await window.api.listChapters(novel.id)
        const cp = chaps.find((c) => c.title === name)
        if (cp) {
          setCurrent(cp)
          setContent(cp.content || '')
          setWordCount((cp.content || '').replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, '').length)
          toast(`已跳转到章节：${cp.title}`, 'success')
          return
        }
        const worlds = await window.api.listWorlds(novel.id)
        const w = worlds.find((ww) => ww.name === name)
        if (w) {
          window.dispatchEvent(new CustomEvent('jump-tab', { detail: { tab: 'worlds', worldName: w.name } }))
          toast(`已跳转到设定：${w.name}`, 'success')
          return
        }
        toast(`未找到「${name}」，可使用 [[名称]] 链接人物/章节/设定`, 'info')
      } catch (e) {
        toast('链接跳转失败：' + e.message, 'error')
      }
    },
    [novel.id, toast]
  )

  const handleToolbarAction = useCallback(
    async (action, text) => {
      if (!text) return
      try {
        switch (action) {
          case 'create_setting': {
            const entities = await window.api.aiExtractEntities?.(text)
            if (entities) {
              const count =
                (entities.characters?.length || 0) +
                (entities.worlds?.length || 0) +
                (entities.items?.length || 0) +
                (entities.events?.length || 0) +
                (entities.foreshadowings?.length || 0)
              toast(`提取」${count} 个设定元素`, 'success')
            }
            break
          }
          case 'ai_opinion': {
            setRightTab('ai')
            break
          }
          case 'polish': {
            const v = editorViewRef.current
            if (!v) break
            const res = await window.api.aiAssistantWithSystem(
              '你是资深小说润色专家',
              '请润色这段文字，改进表达但保留原意，只返回润色后的文本',
              text
            )
            const polished = res?.content || res?.text || res || text
            v.dispatch({
              changes: { from: selection?.from ?? 0, to: selection?.to ?? 0, insert: polished },
              scrollIntoView: true,
            })
            v.focus()
            break
          }
        }
      } catch (e) {
        toast('操作失败: ' + e.message, 'error')
      }
    },
    [toast, selection]
  )

  const saveNow = async () => {
    if (!current) return
    clearTimeout(saveTimer.current)
    await doSave(current, contentRef.current)
    await window.api.saveVersion(current.id, contentRef.current, `自动保存 ${new Date().toLocaleTimeString()}`)
    toast('已保存并生成版本快照', 'success')
  }

  const createChapter = async () => {
    const title = await prompt({ title: '章节名称', value: `第${chapters.length + 1} 章` })
    if (!title) return
    const ch = await window.api.createChapter(novel.id, { title })
    setChapters(await window.api.listChapters(novel.id))
    setCurrent(ch)
    setContent('')
    setMarks([])
    onSaved?.()
  }

  const selectChapter = (ch) => {
    if (current && current.id !== ch.id) doSave(current, contentRef.current)
    setCurrent(ch)
    setContent(ch.content || '')
    setWordCount(ch.word_count)
    setSavedWordCount(ch.word_count)
    setMarks([])
    setCaret(null)
  }

  selectChapterRef.current = selectChapter

  const deleteChapter = async (ch) => {
    if (!(await confirm({ title: '删除章节', message: `确认删除「${ch.title}」？版本历史也将删除。`, danger: true })))
      return
    await window.api.deleteChapter(ch.id)
    toast('已删除', 'success')
    if (current?.id === ch.id) setCurrent(null)
    loadChapters()
  }

  const saveSnapshot = async () => {
    if (!current) return
    await window.api.saveVersion(current.id, contentRef.current, `快照 ${new Date().toLocaleString()}`)
    toast('已保存版本快照', 'success')
  }

  const handleAutoCorrect = async () => {
    const text = contentRef.current
    if (!text) return
    const { issues } = await window.api.typoCheck(text)
    if (!issues || issues.length === 0) {
      toast('未发现错别字', 'success')
      return
    }
    const { text: fixed, count } = await window.api.typoApply(text, issues)
    setContent(fixed)
    toast(`已自动纠错${count} 处`, 'success')
  }

  const handleFormat = async () => {
    const text = contentRef.current
    if (!text) return
    const { text: formatted, changes } = await window.api.formatText(text)
    if (changes === 0) {
      toast('排版格式无需调整', 'success')
      return
    }
    setContent(formatted)
    toast(`已自动排版，调整 ${changes} 处`, 'success')
  }

  const moveChapter = async (id, dir) => {
    const idx = chapters.findIndex((c) => c.id === id)
    const target = idx + dir
    if (target < 0 || target >= chapters.length) return
    const arr = chapters.map((c) => c.id)
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    setChapters(await window.api.reorderChapters(novel.id, arr))
  }

  const toggleSelectAll = () => {
    if (!chapters) return
    if (selectedIds.size === chapters.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(chapters.map((c) => c.id)))
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    if (
      !(await confirm({
        title: '批量删除',
        message: `确认删除选中的${selectedIds.size} 个章节？版本历史也将删除。`,
        danger: true,
      }))
    )
      return
    await window.api.batchDeleteChapters([...selectedIds])
    setSelectedIds(new Set())
    if (current && selectedIds.has(current.id)) {
      setCurrent(null)
      setContent('')
    }
    toast(`已删除${selectedIds.size} 个章节`, 'success')
    loadChapters()
  }

  const handleBatchStatus = async (status) => {
    if (selectedIds.size === 0) return
    await window.api.batchUpdateChapters([...selectedIds], { status })
    setSelectedIds(new Set())
    toast(`已更新${selectedIds.size} 个章节状态为「${status}」`, 'success')
    loadChapters()
  }

  useShortcutRun('save_chapter', saveNow)
  useShortcutRun('new_chapter', createChapter)
  useShortcutRun('snapshot', saveSnapshot)
  useShortcutRun('reading_mode', () => setReading((r) => !r))
  useShortcutRun('focus_mode', () => setFocusOpen(true))

  const leftResizeStart = (e) => {
    const sx = e.clientX,
      sw = leftW
    const mv = (ev) => setLeftW(Math.max(48, Math.min(400, sw + ev.clientX - sx)))
    const up = () => {
      document.removeEventListener('mousemove', mv)
      document.removeEventListener('mouseup', up)
    }
    document.addEventListener('mousemove', mv)
    document.addEventListener('mouseup', up)
  }

  const rightResizeStart = (e) => {
    const sx = e.clientX,
      sw = rightW
    const mv = (ev) => setRightW(Math.max(120, Math.min(600, sw - (ev.clientX - sx))))
    const up = () => {
      document.removeEventListener('mousemove', mv)
      document.removeEventListener('mouseup', up)
    }
    document.addEventListener('mousemove', mv)
    document.addEventListener('mouseup', up)
  }

  const filteredChapters = chapters
    ? chapters.filter((ch) => !searchText || ch.title.toLowerCase().includes(searchText.toLowerCase()))
    : []

  const realWordCount =
    current && content !== undefined ? (content || '').replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, '').length : null
  const delta = realWordCount !== null && savedWordCount !== null ? realWordCount - savedWordCount : null

  const currentIdx = chapters ? chapters.findIndex((c) => c.id === current?.id) : -1
  const prevChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null
  const nextChapter = currentIdx >= 0 && currentIdx < (chapters?.length || 0) - 1 ? chapters[currentIdx + 1] : null

  const wikiLinksToHtml = (text) => text.replace(/\[\[([^\]]+)\]\]/g, '<span class="wiki-link-inline">$1</span>')

  const handleDragOver = useCallback(
    (e, overId) => {
      e.preventDefault()
      if (!dragId || dragId === overId) return
      setChapters((list) => {
        const ids = list.map((c) => c.id)
        const from = ids.indexOf(dragId)
        const to = ids.indexOf(overId)
        if (from === -1 || to === -1) return list
        ids.splice(from, 1)
        ids.splice(to, 0, dragId)
        return ids.map((id) => list.find((c) => c.id === id))
      })
    },
    [dragId]
  )

  const handleDrop = useCallback(async () => {
    if (!dragId) return
    setChapters(
      await window.api.reorderChapters(
        novel.id,
        chaptersRef.current.map((c) => c.id)
      )
    )
    setDragId(null)
  }, [dragId, novel.id])

  const renderLeft = (ref) => {
    if (!leftOpen) {
      return (
        <div
          style={{
            width: 30,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 8,
            borderRight: '1px solid var(--border)',
            background: 'var(--bg-2)',
          }}
        >
          <button className='ghost' onClick={() => setLeftOpen(true)} title='展开章节列表'>
            <PanelLeftOpen size={18} />
          </button>
        </div>
      )
    }
    return (
      <div ref={ref} style={{ display: 'flex', flexShrink: 0 }}>
        <div className='sidebar' style={{ width: leftW, display: 'flex', flexDirection: 'column' }}>
          <div className='list-header' style={{ flexWrap: 'wrap', gap: 4 }}>
            <button className='ghost' onClick={() => setLeftOpen(false)} title='折叠章节列表'>
              <PanelLeftClose size={18} />
            </button>
            <h3>章节{chapters ? `(${chapters.length})` : ''}</h3>
            <button className='small primary' onClick={createChapter} title='新建章节'>
              +
            </button>
            <button
              className='small'
              onClick={async () => {
                try {
                  const ch = await window.api.importDocxChapter(novel.id)
                  if (ch?.canceled) return
                  loadChapters()
                  selectChapter(ch)
                  toast(`已从 Word 导入「${ch.title}」`, 'success')
                } catch (e) {
                  toast(e.message, 'error')
                }
              }}
              title=' Word 文档导入为章节'
            >
              导入 Word
            </button>
          </div>
          <div style={{ padding: '2px 6px', borderBottom: '1px solid var(--border)' }}>
            <input
              style={{ width: '100%', fontSize: 12 }}
              placeholder='搜索章节标题...'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          {chapters && chapters.length > 0 && (
            <div
              className='row'
              style={{ padding: '4px 8px', gap: 4, borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}
            >
              <input
                type='checkbox'
                checked={selectedIds.size > 0 && selectedIds.size === chapters.length}
                onChange={toggleSelectAll}
                title='全选/全不选'
              />
              <span style={{ fontSize: 11, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                {selectedIds.size}/{chapters.length}
              </span>
              <button className='ghost small' onClick={toggleSelectAll}>
                {selectedIds.size === chapters.length ? '全不选' : '全部'}
              </button>
              <div className='grow' />
              <button
                className='ghost small danger'
                disabled={selectedIds.size === 0}
                onClick={handleBatchDelete}
                title='批量删除'
              >
                批量删除
              </button>
              <select
                style={{ width: 80, fontSize: 11 }}
                disabled={selectedIds.size === 0}
                value=''
                onChange={(e) => {
                  if (e.target.value) handleBatchStatus(e.target.value)
                  e.target.value = ''
                }}
              >
                <option value=''>状态</option>
                <option value='草稿'>草稿</option>
                <option value='待修改'>待修改</option>
                <option value='已完成'>已完成</option>
              </select>
            </div>
          )}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {chapters === null ? (
              <div style={{ padding: 16 }}>
                <Skeleton count={6} />
              </div>
            ) : filteredChapters.length === 0 ? (
              searchText ? (
                <div className='empty-state' style={{ padding: 16 }}>
                  <div className='hint'>未找到匹配的章节</div>
                </div>
              ) : (
                <div className='empty-state' style={{ padding: 16 }}>
                  <div className='hint'>暂无章节</div>
                </div>
              )
            ) : (
              filteredChapters.map((ch) => {
                const fi = chapters.indexOf(ch)
                return (
                  <ChapterItem
                    key={ch.id}
                    ch={ch}
                    isActive={current?.id === ch.id}
                    isSelected={selectedIds.has(ch.id)}
                    isDragging={dragId === ch.id}
                    canMoveUp={fi > 0}
                    canMoveDown={fi < chapters.length - 1}
                    onSelect={() => selectChapter(ch)}
                    onToggleSelect={() => {
                      const next = new Set(selectedIds)
                      if (next.has(ch.id)) next.delete(ch.id)
                      else next.add(ch.id)
                      setSelectedIds(next)
                    }}
                    onMoveUp={() => moveChapter(ch.id, -1)}
                    onMoveDown={() => moveChapter(ch.id, 1)}
                    onDelete={(e) => {
                      e.stopPropagation()
                      deleteChapter(ch)
                    }}
                    onSplit={(e) => {
                      e.stopPropagation()
                      setSplitChapter(ch)
                      setSplitContent(ch.content || '')
                    }}
                    onDragStart={() => setDragId(ch.id)}
                    onDragOver={(e) => handleDragOver(e, ch.id)}
                    onDrop={handleDrop}
                    onDragEnd={() => setDragId(null)}
                  />
                )
              })
            )}
          </div>
        </div>
        <div
          style={{ width: 4, flexShrink: 0, cursor: 'col-resize', background: 'transparent' }}
          onMouseDown={leftResizeStart}
        />
      </div>
    )
  }

  const renderRight = (ref) => {
    if (!rightOpen) {
      return (
        <div
          style={{
            width: 30,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: 8,
            borderLeft: '1px solid var(--border)',
            background: 'var(--bg-2)',
          }}
        >
          <button className='ghost' onClick={() => setRightOpen(true)} title='展开 AI 助手'>
            <PanelRightOpen size={18} />
          </button>
        </div>
      )
    }
    return (
      <div ref={ref} style={{ display: 'flex', flexShrink: 0 }}>
        <div
          style={{ width: 4, flexShrink: 0, cursor: 'col-resize', background: 'transparent' }}
          onMouseDown={rightResizeStart}
        />
        <div
          style={{
            width: rightW,
            flexShrink: 0,
            borderLeft: '1px solid var(--border)',
            background: 'var(--bg-2)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className='tabs'>
            <div className={`tab ${rightTab === 'ai' ? 'active' : ''}`} onClick={() => setRightTab('ai')}>
              AI 助手
            </div>
            <div className={`tab ${rightTab === 'typo' ? 'active' : ''}`} onClick={() => setRightTab('typo')}>
              校对
            </div>
            <div className={`tab ${rightTab === 'version' ? 'active' : ''}`} onClick={() => setRightTab('version')}>
              版本对比
            </div>
            <div className={`tab ${rightTab === 'sensitive' ? 'active' : ''}`} onClick={() => setRightTab('sensitive')}>
              敏感词
            </div>
            <div className={`tab ${rightTab === 'staging' ? 'active' : ''}`} onClick={() => setRightTab('staging')}>
              暂存
            </div>
            <div className='grow' />
            <button className='ghost' onClick={() => setRightOpen(false)} title='折叠右侧面板'>
              <PanelRightClose size={18} />
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            {rightTab === 'ai' && (
              <AIPanel
                novel={novel}
                chapter={current}
                contentRef={contentRef}
                cursorRef={caretRef}
                onApply={(text) => {
                  doSave(current, text)
                }}
              />
            )}
            {rightTab === 'typo' && (
              <TypoCheckPanel
                novel={novel}
                chapter={current}
                content={content}
                setMarks={setMarks}
                onReplace={(text) => {
                  doSave(current, text)
                  setMarks([])
                }}
              />
            )}
            {rightTab === 'sensitive' && (
              <SensitiveWordsPanel novel={novel} chapter={current} content={content} setMarks={setMarks} />
            )}
            {rightTab === 'version' && (
              <VersionPanel
                chapter={current}
                currentContent={content}
                onRestore={(text) => {
                  doSave(current, text)
                  toast('已恢复版本', 'success')
                }}
              />
            )}
            {rightTab === 'staging' && (
              <StagingPanel
                onInsert={(text) => {
                  if (!editorViewRef.current) return
                  const view = editorViewRef.current
                  const pos = view.state.selection.main.head
                  view.dispatch({ changes: { from: pos, insert: text } })
                  toast('已插入到光标位置', 'success')
                }}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='main' style={{ flex: 1 }}>
      {renderLeft(leftPanelRef)}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div
          className='row'
          style={{
            padding: '4px 12px',
            borderBottom: '1px solid var(--border)',
            gap: 8,
            flexShrink: 0,
            alignItems: 'center',
          }}
        >
          <button
            className='ghost'
            onClick={() => setPanelOpen((p) => !p)}
            title={panelOpen ? '收起工具栏' : '展开工具栏'}
          >
            {panelOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {current && (
            <input
              style={{
                fontSize: 15,
                fontWeight: 600,
                minWidth: 80,
                maxWidth: 200,
                border: 'none',
                background: 'transparent',
                padding: '2px 4px',
              }}
              value={current.title}
              onChange={(e) =>
                setChapters((l) => l.map((c) => (c.id === current.id ? { ...c, title: e.target.value } : c)))
              }
              onBlur={async (e) => {
                if (!current) return
                const u = await window.api.updateChapter(current.id, { title: e.target.value || '未命名' })
                setChapters((l) => l.map((c) => (c.id === u.id ? u : c)))
              }}
            />
          )}
          <div className='grow' />
          <span className='badge accent' style={{ fontSize: 11 }}>
            {wordCount} 字
          </span>
          {delta !== null && (
            <span className='hint' style={{ fontSize: 11, marginLeft: 4 }}>
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
          <button
            className='small primary'
            onClick={saveNow}
            disabled={saving}
            title='保存 (Ctrl+S)'
            style={{ border: '1px solid var(--accent)' }}
          >
            {saving ? '...' : '保存'}
          </button>
          {panelOpen && (
            <>
              <button
                className='small'
                style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px' }}
                onClick={() => window.dispatchEvent(new CustomEvent('editor-find'))}
              >
                查找
              </button>
              <button
                className={`small ${reading ? 'active' : ''}`}
                style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px' }}
                onClick={() => setReading((r) => !r)}
              >
                {reading ? '退出阅读' : '阅读'}
              </button>
              <button
                className={`small ${showPreview ? 'active' : ''}`}
                style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px' }}
                onClick={() => setShowPreview((p) => !p)}
              >
                预览
              </button>
              <button
                className='small'
                style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px' }}
                onClick={() => setFocusOpen(true)}
              >
                专注
              </button>
              <button
                className='small'
                style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px' }}
                onClick={saveSnapshot}
              >
                快照
              </button>
              <button
                className='small'
                style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px' }}
                onClick={handleAutoCorrect}
              >
                纠错
              </button>
              <button
                className='small'
                style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px' }}
                onClick={handleFormat}
              >
                排版
              </button>
              <button
                className='small'
                style={{ border: '1px solid var(--border)', borderRadius: 4, padding: '2px 8px' }}
                onClick={async () => {
                  if (!current) return
                  await window.api.exportChapterDocx(current.id)
                  toast('已导出章节为 Word', 'success')
                }}
              >
                导出
              </button>
            </>
          )}
        </div>

        {panelOpen && current && (
          <div
            className='row wrap'
            style={{
              padding: '4px 12px',
              borderBottom: '1px solid var(--border)',
              gap: 8,
              background: 'var(--bg-2)',
              flexShrink: 0,
              alignItems: 'center',
            }}
          >
            <select
              style={{ width: 100, fontSize: 12 }}
              value={current.status || '草稿'}
              onChange={async (e) => {
                const u = await window.api.updateChapter(current.id, { status: e.target.value })
                setChapters((l) => l.map((c) => (c.id === u.id ? u : c)))
              }}
            >
              <option>草稿</option>
              <option>待修改</option>
              <option>已完成</option>
            </select>
            <input
              style={{ width: 160, fontSize: 12 }}
              placeholder='场景'
              value={current.scene || ''}
              onBlur={async (e) => {
                if (!current) return
                await window.api.updateChapter(current.id, { scene: e.target.value })
              }}
            />
            <input
              style={{ flex: 1, minWidth: 120, fontSize: 12 }}
              placeholder='摘要'
              value={current.summary || ''}
              onBlur={async (e) => {
                if (!current) return
                await window.api.updateChapter(current.id, { summary: e.target.value })
              }}
            />
            <button
              className='small'
              style={{ fontSize: 11, padding: '2px 6px', flexShrink: 0 }}
              title='用 AI 自动生成摘要'
              onClick={async () => {
                if (!content.trim()) { toast('章节内容为空', 'info'); return }
                toast('正在生成摘要...', 'info')
                try {
                  const res = await window.api.aiAssistant(
                    '请用一两句话概括以下章节内容的梗概（不超过80字），直接输出摘要，不要加任何前缀或解释。',
                    content.slice(0, 6000)
                  )
                  const summary = res.content.trim()
                  await window.api.updateChapter(current.id, { summary })
                  setCurrent({ ...current, summary })
                  toast('摘要已生成', 'success')
                } catch (e) {
                  toast('AI 摘要失败：' + e.message, 'error')
                }
              }}
            >
              AI 摘要
            </button>
            <input
              style={{ flex: 1, minWidth: 120, fontSize: 12 }}
              placeholder='笔记'
              value={current.notes || ''}
              onBlur={async (e) => {
                if (!current) return
                await window.api.updateChapter(current.id, { notes: e.target.value })
              }}
            />
          </div>
        )}

        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          {reading ? (
            <div className='reading-mode' style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div className='reading-topbar'>
                <span className='reading-title'>{current?.title || '未命名'}</span>
                <div className='grow' />
                <button className='small' onClick={() => setReadingFont((s) => Math.max(14, s - 2))}>A-</button>
                <span className='reading-fontsize'>{readingFont}px</span>
                <button className='small' onClick={() => setReadingFont((s) => Math.min(28, s + 2))}>A+</button>
                <button className='small' onClick={() => setReading((r) => !r)} style={{ marginLeft: 8 }}>退出阅读</button>
              </div>
              <div
                className='reading-wrap reading-content'
                style={{ flex: 1, fontSize: readingFont, overflow: 'auto', padding: '28px 48px', maxWidth: 780, margin: '0 auto', width: '100%' }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(marked.parse(wikiLinksToHtml(content || ''))) }}
              />
              <div className='reading-nav'>
                <button
                  className='small'
                  disabled={!prevChapter}
                  onClick={() => { if (prevChapter) { setCurrent(prevChapter); setContent(prevChapter.content || '') } }}
                >
                  {prevChapter ? `◀ ${prevChapter.title}` : '无上一章'}
                </button>
                <span className='reading-progress'>{chapters ? `${(chapters.findIndex((c) => c.id === current?.id) + 1) || 1} / ${chapters.length}` : ''}</span>
                <button
                  className='small'
                  disabled={!nextChapter}
                  onClick={() => { if (nextChapter) { setCurrent(nextChapter); setContent(nextChapter.content || '') } }}
                >
                  {nextChapter ? `${nextChapter.title} ▶` : '无下一章'}
                </button>
              </div>
            </div>
          ) : showPreview ? (
            <div style={{ display: 'flex', flex: 1, height: '100%', minHeight: 0 }}>
              <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                <Editor
                  ref={editorViewRef}
                  value={content}
                  onChange={handleChange}
                  marks={marks}
                  readOnly={false}
                  onCaretChange={setCaret}
                  onTyping={handleTyping}
                  onSelectionChange={handleSelectionChange}
                  onWikiLink={handleWikiLink}
                />
              </div>
              <div
                className='reading-wrap'
                style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: 16,
                  borderLeft: '1px solid var(--border)',
                  background: 'var(--bg-3)',
                }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(marked.parse(content || '')) }}
              />
            </div>
          ) : splitChapter ? (
            <div style={{ display: 'flex', flex: 1, height: '100%', minHeight: 0 }}>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
                <div style={{ padding: '4px 8px', fontSize: 12, background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className='badge accent'>{current?.title || '未命名'}</span>
                  <span className='hint'>左</span>
                </div>
                <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                  <Editor
                    ref={editorViewRef}
                    value={content}
                    onChange={handleChange}
                    marks={marks}
                    readOnly={false}
                    onCaretChange={setCaret}
                    onTyping={handleTyping}
                    onSelectionChange={handleSelectionChange}
                    onWikiLink={handleWikiLink}
                  />
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '4px 8px', fontSize: 12, background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className='badge'>{splitChapter.title}</span>
                  <span className='hint'>右</span>
                  <div className='grow' />
                  <button className='ghost small' onClick={() => { setSplitChapter(null); setSplitContent('') }}>关闭分屏</button>
                </div>
                <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                  <Editor
                    value={splitContent}
                    onChange={async (text) => {
                      setSplitContent(text)
                      await window.api.updateChapter(splitChapter.id, { content: text })
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <Editor
              ref={editorViewRef}
              value={content}
              onChange={handleChange}
              marks={marks}
              readOnly={false}
              onCaretChange={setCaret}
              onTyping={handleTyping}
              onSelectionChange={handleSelectionChange}
              onWikiLink={handleWikiLink}
            />
          )}
          {selection && toolbarOpen && (
            <SelectionToolbar
              editorView={editorViewRef.current}
              selection={selection}
              novelId={novel.id}
              onAction={handleToolbarAction}
              onClose={() => setSelection(null)}
            />
          )}
        </div>

        <div
          className='row'
          style={{
            padding: '2px 12px',
            borderTop: '1px solid var(--border)',
            gap: 12,
            fontSize: 11,
            color: 'var(--text-2)',
            flexShrink: 0,
            alignItems: 'center',
          }}
        >
          <span>本日 {typing.today} 字</span>
          <span>本次 {typing.session} 字</span>
          {streak > 0 && (
            <span>
              <Clock size={12} /> 连续 {streak} 天
            </span>
          )}
          {dailyGoal > 0 && (
            <span>
              <Target size={12} /> {dailyGoal} 字{' '}
              <span style={{ marginLeft: 4, color: typing.today >= dailyGoal ? 'var(--green)' : 'var(--text-2)' }}>
                ({Math.min(100, Math.round((typing.today / dailyGoal) * 100))}%)
              </span>
            </span>
          )}
          <div className='grow' />
          {caret && (
            <span className='hint'>
              行 {caret.line}/{caret.total}
            </span>
          )}
          {current && (
            <span
              className='hint'
              style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {current.title}
            </span>
          )}
        </div>
      </div>

      {renderRight(rightPanelRef)}

      {focusOpen && (
        <FocusModal
          novel={novel}
          chapter={current}
          initialContent={content}
          onSave={(text) => {
            doSave(current, text)
            setContent(text)
          }}
          onClose={() => setFocusOpen(false)}
        />
      )}
    </div>
  )
}
