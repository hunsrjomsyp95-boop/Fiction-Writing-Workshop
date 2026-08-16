import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Save, Clock, FileText, Type, AlignLeft } from 'lucide-react'

export default function MobileChapterEditor({ chapter, onBack, toast }) {
  const [content, setContent] = useState(chapter.content || '')
  const [title, setTitle] = useState(chapter.title || '')
  const [saving, setSaving] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const textareaRef = useRef(null)

  useEffect(() => {
    setWordCount(content.length)
  }, [content])

  const save = async () => {
    setSaving(true)
    try {
      await window.api.updateChapter(chapter.id, { title, content })
      toast('保存成功', 'success')
    } catch (err) {
      toast('保存失败: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mobile-editor">
      {/* 编辑器顶部栏 */}
      <div className="mobile-editor-header">
        <button className="mobile-back-btn" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <input
          className="mobile-editor-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="章节标题"
        />
        <button 
          className="mobile-save-btn"
          onClick={save}
          disabled={saving}
        >
          <Save size={20} />
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      {/* 编辑器工具栏 */}
      <div className="mobile-editor-toolbar">
        <div className="mobile-editor-stat">
          <Type size={14} />
          <span>{wordCount} 字</span>
        </div>
        <div className="mobile-editor-stat">
          <Clock size={14} />
          <span>约 {Math.ceil(wordCount / 300)} 分钟</span>
        </div>
      </div>

      {/* 编辑区域 */}
      <textarea
        ref={textareaRef}
        className="mobile-editor-content"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="开始写作..."
        autoFocus
      />
    </div>
  )
}