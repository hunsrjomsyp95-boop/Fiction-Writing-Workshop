import { useState, useEffect, useRef, useCallback } from 'react'
import { marked } from 'marked'
import sanitizeHtml from '../sanitizeHtml.js'
import { ChevronUp, ChevronDown, Clock, Target } from 'lucide-react'
import Editor from './Editor.jsx'
import SelectionToolbar from './SelectionToolbar.jsx'
import FocusModal from './FocusModal.jsx'
import ChapterListPanel from './ChapterListPanel.jsx'
import RightPanel from './RightPanel.jsx'
import ChapterContextMenu from './ChapterContextMenu.jsx'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'
import { useShortcutRun } from '../shortcuts.jsx'
import { useTypingTracker } from '../hooks/useTypingTracker.js'
import { useChapterManager } from '../hooks/useChapterManager.js'

marked.setOptions({ gfm: true, breaks: true })

export default function ChaptersView({ novel, onDirty, onSaving, onSaved }) {
  const toast = useToast()
  const { prompt, confirm } = useDialog()

  const {
    chapters,
    setChapters,
    current,
    setCurrent,
    content,
    setContent,
    marks,
    setMarks,
    wordCount,
    saving,
    savedWordCount,
    selectedIds,
    setSelectedIds,
    searchText,
    setSearchText,
    sortBy,
    setSortBy,
    contentRef,
    currentRef,
    chaptersRef,
    selectChapterRef,
    loadChapters,
    doSave,
    handleChange,
    selectChapter,
    deleteChapter: deleteChapterBase,
    createChapter: createChapterBase,
    moveChapter,
    saveNow,
    saveSnapshot,
    filteredChapters,
    sortedChapters,
  } = useChapterManager(novel, { onDirty, onSaving, onSaved, toast })

  const { typing, streak, dailyGoal, handleTyping } = useTypingTracker(novel.id)

  const [caret, setCaret] = useState(null)
  const caretRef = useRef(null)
  const [reading, setReading] = useState(false)
  const [readingFont, setReadingFont] = useState(18)
  const [toolbarOpen, setToolbarOpen] = useState(true)
  const [leftOpen, setLeftOpen] = useState(true)
  const [leftW, setLeftW] = useState(240)
  const [rightOpen, setRightOpen] = useState(true)
  const [rightW, setRightW] = useState(340)
  const [rightTab, setRightTab] = useState('ai')
  const [dragId, setDragId] = useState(null)
  const [splitChapter, setSplitChapter] = useState(null)
  const [splitContent, setSplitContent] = useState('')
  const [focusOpen, setFocusOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editorFontSize, setEditorFontSize] = useState(16)
  const [editorLineHeight, setEditorLineHeight] = useState(1.8)
  const [selection, setSelection] = useState(null)
  const [ctxMenu, setCtxMenu] = useState(null)
  const leftPanelRef = useRef(null)
  const rightPanelRef = useRef(null)
  const editorViewRef = useRef(null)
  const dragOverIdRef = useRef(null)

  useEffect(() => {
    window.api.getSetting('toolbar_open', '1').then((v) => setToolbarOpen(v !== '0'))
    window.api.getSetting('editor_font_size', '16').then((v) => setEditorFontSize(Number(v) || 16))
    window.api.getSetting('editor_line_height', '1.8').then((v) => setEditorLineHeight(Number(v) || 1.8))
  }, [novel.id])

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

  const deleteChapter = useCallback(
    async (ch) => {
      if (!(await confirm({ title: '删除章节', message: `确认删除「${ch.title}」？版本历史也将删除。`, danger: true })))
        return
      await window.api.deleteChapter(ch.id)
      toast('已删除', 'success')
      if (current?.id === ch.id) setCurrent(null)
      loadChapters()
    },
    [current?.id, confirm, toast, loadChapters, setCurrent]
  )

  const createChapter = useCallback(async () => {
    const title = await prompt({ title: '章节名称', value: `第${chapters.length + 1} 章` })
    if (!title) return
    const ch = await window.api.createChapter(novel.id, { title })
    setChapters(await window.api.listChapters(novel.id))
    setCurrent(ch)
    setContent('')
    setMarks([])
    onSaved?.()
  }, [novel.id, chapters?.length, prompt, setChapters, setCurrent, setContent, setMarks, onSaved])

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
          if (currentRef.current && currentRef.current.id !== cp.id) {
            selectChapter(cp)
          }
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
    [novel.id, toast, selectChapter, currentRef]
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

  const handleAutoCorrect = useCallback(async () => {
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
  }, [contentRef, setContent, toast])

  const handleFormat = useCallback(async () => {
    const text = contentRef.current
    if (!text) return
    const { text: formatted, changes } = await window.api.formatText(text)
    if (changes === 0) {
      toast('排版格式无需调整', 'success')
      return
    }
    setContent(formatted)
    toast(`已自动排版，调整 ${changes} 处`, 'success')
  }, [contentRef, setContent, toast])

  const toggleSelectAll = useCallback(() => {
    if (!chapters) return
    if (selectedIds.size === chapters.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(chapters.map((c) => c.id)))
    }
  }, [chapters, selectedIds, setSelectedIds])

  const handleBatchDelete = useCallback(async () => {
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
  }, [selectedIds, confirm, current, setSelectedIds, setCurrent, setContent, toast, loadChapters])

  const handleBatchStatus = useCallback(
    async (status) => {
      if (selectedIds.size === 0) return
      await window.api.batchUpdateChapters([...selectedIds], { status })
      setSelectedIds(new Set())
      toast(`已更新${selectedIds.size} 个章节状态为「${status}」`, 'success')
      loadChapters()
    },
    [selectedIds, setSelectedIds, toast, loadChapters]
  )

  const handleDragStart = useCallback((e, id) => {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback(
    (e, id) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (!dragId || dragId === id) return
      if (dragOverIdRef.current === id) return
      dragOverIdRef.current = id
      setChapters((list) => {
        const from = list.findIndex((c) => c.id === dragId)
        const to = list.findIndex((c) => c.id === id)
        if (from === -1 || to === -1) return list
        const next = [...list]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        return next
      })
    },
    [dragId, setChapters]
  )

  const handleDrop = useCallback(async () => {
    if (dragId) {
      await window.api.reorderChapters(novel.id, chaptersRef.current.map((c) => c.id))
    }
    setDragId(null)
    dragOverIdRef.current = null
  }, [dragId, novel.id, chaptersRef])

  const handleDragEnd = useCallback(() => {
    setDragId(null)
    dragOverIdRef.current = null
  }, [])

  const handleContextMenu = useCallback((e, ch) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ x: e.clientX, y: e.clientY, ch })
  }, [])

  useEffect(() => {
    if (!ctxMenu) return
    const close = () => setCtxMenu(null)
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [ctxMenu])

  const handleRename = useCallback(
    async (ch) => {
      const title = await prompt({ title: '重命名章节', value: ch.title })
      if (!title || title === ch.title) return
      const u = await window.api.updateChapter(ch.id, { title })
      setChapters((l) => l.map((c) => (c.id === u.id ? u : c)))
      if (current?.id === ch.id) setCurrent(u)
      toast('已重命名', 'success')
    },
    [current?.id, prompt, toast, setChapters, setCurrent]
  )

  const handleExport = useCallback(
    async (ch) => {
      try {
        await window.api.exportChapterDocx(ch.id)
        toast(`已导出「${ch.title}」`, 'success')
      } catch (e) {
        toast('导出失败：' + e.message, 'error')
      }
    },
    [toast]
  )

  const handleSummarize = useCallback(
    async (ch) => {
      const content = ch.content || ''
      if (!content.trim()) {
        toast('章节内容为空', 'info')
        return
      }
      toast('正在生成摘要...', 'info')
      try {
        const res = await window.api.aiAssistant(
          '请用一两句话概括以下章节内容的梗概（不超过80字），直接输出摘要，不要加任何前缀或解释。',
          content.slice(0, 6000)
        )
        const summary = res.content.trim()
        const u = await window.api.updateChapter(ch.id, { summary })
        setChapters((l) => l.map((c) => (c.id === u.id ? u : c)))
        if (current?.id === ch.id) setCurrent(u)
        toast('摘要已生成', 'success')
      } catch (e) {
        toast('AI 摘要失败：' + e.message, 'error')
      }
    },
    [current?.id, toast, setChapters, setCurrent]
  )

  const leftResizeStart = useCallback((e) => {
    const sx = e.clientX,
      sw = leftW
    const mv = (ev) => setLeftW(Math.max(48, Math.min(400, sw + ev.clientX - sx)))
    const up = () => {
      document.removeEventListener('mousemove', mv)
      document.removeEventListener('mouseup', up)
    }
    document.addEventListener('mousemove', mv)
    document.addEventListener('mouseup', up)
  }, [leftW])

  const rightResizeStart = useCallback((e) => {
    const sx = e.clientX,
      sw = rightW
    const mv = (ev) => setRightW(Math.max(120, Math.min(600, sw - (ev.clientX - sx))))
    const up = () => {
      document.removeEventListener('mousemove', mv)
      document.removeEventListener('mouseup', up)
    }
    document.addEventListener('mousemove', mv)
    document.addEventListener('mouseup', up)
  }, [rightW])

  useShortcutRun('save_chapter', saveNow)
  useShortcutRun('new_chapter', createChapter)
  useShortcutRun('snapshot', saveSnapshot)
  useShortcutRun('reading_mode', () => setReading((r) => !r))
  useShortcutRun('focus_mode', () => setFocusOpen(true))

  const realWordCount =
    current && content !== undefined ? (content || '').replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, '').length : null
  const delta = realWordCount !== null && savedWordCount !== null ? realWordCount - savedWordCount : null

  const currentIdx = chapters ? chapters.findIndex((c) => c.id === current?.id) : -1
  const prevChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null
  const nextChapter = currentIdx >= 0 && currentIdx < (chapters?.length || 0) - 1 ? chapters[currentIdx + 1] : null

  const wikiLinksToHtml = (text) => text.replace(/\[\[([^\]]+)\]\]/g, '<span class="wiki-link-inline">$1</span>')

  return (
    <div className='main' style={{ flex: 1 }}>
      <ChapterListPanel
        leftOpen={leftOpen}
        setLeftOpen={setLeftOpen}
        leftW={leftW}
        leftResizeStart={leftResizeStart}
        chapters={chapters}
        sortedChapters={sortedChapters}
        current={current}
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        searchText={searchText}
        setSearchText={setSearchText}
        sortBy={sortBy}
        setSortBy={setSortBy}
        dragId={dragId}
        selectChapter={selectChapter}
        moveChapter={moveChapter}
        deleteChapter={deleteChapter}
        createChapter={createChapter}
        loadChapters={loadChapters}
        handleDragStart={handleDragStart}
        handleDragOver={handleDragOver}
        handleDrop={handleDrop}
        handleDragEnd={handleDragEnd}
        handleContextMenu={handleContextMenu}
        setSplitChapter={setSplitChapter}
        setSplitContent={setSplitContent}
        toggleSelectAll={toggleSelectAll}
        handleBatchDelete={handleBatchDelete}
        handleBatchStatus={handleBatchStatus}
        toast={toast}
        novel={novel}
      />

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
              onChange={(e) => {
                const newTitle = e.target.value
                setChapters((l) => l.map((c) => (c.id === current.id ? { ...c, title: newTitle } : c)))
                setCurrent((c) => (c && c.id === current.id ? { ...c, title: newTitle } : c))
              }}
              onBlur={async (e) => {
                if (!current) return
                const u = await window.api.updateChapter(current.id, { title: e.target.value || '未命名' })
                setChapters((l) => l.map((c) => (c.id === u.id ? u : c)))
                setCurrent(u)
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
                setCurrent(u)
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
                const u = await window.api.updateChapter(current.id, { scene: e.target.value })
                setChapters((l) => l.map((c) => (c.id === u.id ? u : c)))
                setCurrent(u)
              }}
            />
            <input
              style={{ flex: 1, minWidth: 120, fontSize: 12 }}
              placeholder='摘要'
              value={current.summary || ''}
              onBlur={async (e) => {
                if (!current) return
                const u = await window.api.updateChapter(current.id, { summary: e.target.value })
                setChapters((l) => l.map((c) => (c.id === u.id ? u : c)))
                setCurrent(u)
              }}
            />
            <button
              className='small'
              style={{ fontSize: 11, padding: '2px 6px', flexShrink: 0 }}
              title='用 AI 自动生成摘要'
              onClick={async () => {
                if (!content.trim()) {
                  toast('章节内容为空', 'info')
                  return
                }
                toast('正在生成摘要...', 'info')
                try {
                  const res = await window.api.aiAssistant(
                    '请用一两句话概括以下章节内容的梗概（不超过80字），直接输出摘要，不要加任何前缀或解释。',
                    content.slice(0, 6000)
                  )
                  const summary = res.content.trim()
                  await window.api.updateChapter(current.id, { summary })
                  setCurrent((c) => ({ ...c, summary }))
                  setChapters((l) => l.map((c) => (c.id === current.id ? { ...c, summary } : c)))
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
                const u = await window.api.updateChapter(current.id, { notes: e.target.value })
                setChapters((l) => l.map((c) => (c.id === u.id ? u : c)))
                setCurrent(u)
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
                <button className='small' onClick={() => setReadingFont((s) => Math.max(14, s - 2))}>
                  A-
                </button>
                <span className='reading-fontsize'>{readingFont}px</span>
                <button className='small' onClick={() => setReadingFont((s) => Math.min(28, s + 2))}>
                  A+
                </button>
                <button className='small' onClick={() => setReading((r) => !r)} style={{ marginLeft: 8 }}>
                  退出阅读
                </button>
              </div>
              <div
                className='reading-wrap reading-content'
                style={{
                  flex: 1,
                  fontSize: readingFont,
                  overflow: 'auto',
                  padding: '28px 48px',
                  maxWidth: 780,
                  margin: '0 auto',
                  width: '100%',
                }}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(marked.parse(wikiLinksToHtml(content || ''))) }}
              />
              <div className='reading-nav'>
                <button
                  className='small'
                  disabled={!prevChapter}
                  onClick={() => {
                    if (prevChapter) selectChapterRef.current(prevChapter)
                  }}
                >
                  {prevChapter ? `◀ ${prevChapter.title}` : '无上一章'}
                </button>
                <span className='reading-progress'>
                  {chapters ? `${(chapters.findIndex((c) => c.id === current?.id) + 1) || 1} / ${chapters.length}` : ''}
                </span>
                <button
                  className='small'
                  disabled={!nextChapter}
                  onClick={() => {
                    if (nextChapter) selectChapterRef.current(nextChapter)
                  }}
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
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRight: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    background: 'var(--bg-2)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
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
                <div
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    background: 'var(--bg-2)',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span className='badge'>{splitChapter.title}</span>
                  <span className='hint'>右</span>
                  <div className='grow' />
                  <button
                    className='ghost small'
                    onClick={() => {
                      setSplitChapter(null)
                      setSplitContent('')
                    }}
                  >
                    关闭分屏
                  </button>
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
              fontSize={editorFontSize}
              lineHeight={editorLineHeight}
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

      <RightPanel
        rightOpen={rightOpen}
        setRightOpen={setRightOpen}
        rightW={rightW}
        rightResizeStart={rightResizeStart}
        rightTab={rightTab}
        setRightTab={setRightTab}
        novel={novel}
        current={current}
        contentRef={contentRef}
        caretRef={caretRef}
        content={content}
        marks={marks}
        setMarks={setMarks}
        doSave={doSave}
        toast={toast}
        editorViewRef={editorViewRef}
      />

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

      <ChapterContextMenu
        ctxMenu={ctxMenu}
        setCtxMenu={setCtxMenu}
        handleRename={handleRename}
        handleExport={handleExport}
        handleSummarize={handleSummarize}
        deleteChapter={deleteChapter}
      />
    </div>
  )
}
