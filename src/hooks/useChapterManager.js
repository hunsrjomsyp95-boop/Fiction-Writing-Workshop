import { useState, useEffect, useRef, useCallback } from 'react'

export function useChapterManager(novel, { onDirty, onSaving, onSaved, toast }) {
  const [chapters, setChapters] = useState(null)
  const [current, setCurrent] = useState(null)
  const [content, setContent] = useState('')
  const [marks, setMarks] = useState([])
  const [wordCount, setWordCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [savedWordCount, setSavedWordCount] = useState(0)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [searchText, setSearchText] = useState('')
  const [sortBy, setSortBy] = useState('order')

  const saveTimer = useRef(null)
  const chaptersRef = useRef(chapters)
  chaptersRef.current = chapters
  const contentRef = useRef('')
  contentRef.current = content
  const currentRef = useRef(null)
  currentRef.current = current
  const selectChapterRef = useRef(null)

  const loadChapters = async () => {
    const list = await window.api.listChapters(novel.id)
    setChapters(list)
    if (list.length > 0) {
      const lastId = await window.api.getSetting(`last_chapter_${novel.id}`, '')
      const last = lastId ? list.find((c) => c.id === Number(lastId)) : null
      const ch = last || list[0]
      setCurrent(ch)
      setContent(ch.content || '')
      setWordCount((ch.content || '').replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, '').length)
      setSavedWordCount(ch.word_count || 0)
    } else {
      setCurrent(null)
      setContent('')
    }
  }

  useEffect(() => {
    loadChapters()
    setSelectedIds(new Set())
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
        window.api.setSetting(`last_chapter_${novel.id}`, String(chapter.id))
        onSaved?.()
      } catch (e) {
        toast('保存失败：' + e.message, 'error')
      } finally {
        setSaving(false)
      }
    },
    [novel.id, onSaving, onSaved, toast]
  )

  const handleChange = useCallback(
    (text) => {
      const chId = currentRef.current?.id
      contentRef.current = text
      setContent(text)
      onDirty?.()
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        const ch = currentRef.current
        if (ch && ch.id === chId) doSave(ch, text)
      }, 1200)
    },
    [doSave, onDirty]
  )

  const selectChapter = useCallback(
    (ch) => {
      const prev = currentRef.current
      if (prev && prev.id !== ch.id) {
        if (saveTimer.current) {
          clearTimeout(saveTimer.current)
          saveTimer.current = null
        }
        doSave(prev, contentRef.current)
      }
      const newContent = ch.content || ''
      currentRef.current = ch
      setCurrent(ch)
      setContent(newContent)
      setWordCount(ch.word_count)
      setSavedWordCount(ch.word_count)
      setMarks([])
      contentRef.current = newContent
      window.api.setSetting(`last_chapter_${novel.id}`, String(ch.id))
    },
    [novel.id, doSave]
  )

  selectChapterRef.current = selectChapter

  const deleteChapter = useCallback(
    async (ch, confirm) => {
      if (!(await confirm({ title: '删除章节', message: `确认删除「${ch.title}」？版本历史也将删除。`, danger: true })))
        return
      await window.api.deleteChapter(ch.id)
      toast('已删除', 'success')
      if (current?.id === ch.id) setCurrent(null)
      loadChapters()
    },
    [current?.id, toast]
  )

  const createChapter = useCallback(
    async (prompt) => {
      const title = await prompt({ title: '章节名称', value: `第${chapters.length + 1} 章` })
      if (!title) return
      const ch = await window.api.createChapter(novel.id, { title })
      setChapters(await window.api.listChapters(novel.id))
      setCurrent(ch)
      setContent('')
      setMarks([])
      onSaved?.()
    },
    [novel.id, chapters?.length, onSaved]
  )

  const moveChapter = useCallback(
    async (id, dir) => {
      const idx = chapters.findIndex((c) => c.id === id)
      const target = idx + dir
      if (target < 0 || target >= chapters.length) return
      const arr = chapters.map((c) => c.id)
      ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
      setChapters(await window.api.reorderChapters(novel.id, arr))
    },
    [novel.id, chapters]
  )

  const saveNow = useCallback(async () => {
    if (!currentRef.current) return
    clearTimeout(saveTimer.current)
    await doSave(currentRef.current, contentRef.current)
    await window.api.saveVersion(currentRef.current.id, contentRef.current, `自动保存 ${new Date().toLocaleTimeString()}`)
    toast('已保存并生成版本快照', 'success')
  }, [doSave, toast])

  const saveSnapshot = useCallback(async () => {
    if (!currentRef.current) return
    await window.api.saveVersion(currentRef.current.id, contentRef.current, `快照 ${new Date().toLocaleString()}`)
    toast('已保存版本快照', 'success')
  }, [toast])

  const filteredChapters = chapters
    ? chapters.filter((ch) => !searchText || ch.title.toLowerCase().includes(searchText.toLowerCase()))
    : []

  const sortedChapters =
    sortBy === 'title'
      ? filteredChapters.slice().sort((a, b) => a.title.localeCompare(b.title, 'zh'))
      : filteredChapters

  return {
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
    deleteChapter,
    createChapter,
    moveChapter,
    saveNow,
    saveSnapshot,
    filteredChapters,
    sortedChapters,
  }
}
