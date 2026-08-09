import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'

export default function SensitiveWordsPanel({ novel: _novel, chapter: _chapter, content, setMarks }) {
  const toast = useToast()
  const { confirm } = useDialog()
  const [words, setWords] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ word: '', note: '' })

  const loadWords = useCallback(async () => {
    try {
      const raw = await window.api.getSetting('sensitive_words', '[]')
      setWords(JSON.parse(raw))
    } catch {
      setWords([])
    }
  }, [])

  useEffect(() => {
    loadWords()
  }, [loadWords])

  const scan = useCallback(() => {
    if (!content) {
      setMatches([])
      setMarks([])
      return
    }
    setLoading(true)
    const found = []
    for (const w of words) {
      if (!w.word) continue
      let idx = 0
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const pos = content.indexOf(w.word, idx)
        if (pos === -1) break
        found.push({ word: w.word, note: w.note, start: pos, end: pos + w.word.length })
        idx = pos + w.word.length
      }
    }
    const marks = found.map((m) => ({ start: m.start, end: m.end, note: m.note, right: m.word, kind: 'sensitive' }))
    setMatches(found)
    setMarks(marks)
    setLoading(false)
  }, [content, words, setMarks])

  useEffect(() => {
    scan()
  }, [scan])

  const addWord = async () => {
    if (!form.word.trim()) {
      toast('请输入敏感词', 'error')
      return
    }
    const updated = [...words, { word: form.word.trim(), note: form.note.trim() }]
    setWords(updated)
    await window.api.setSetting('sensitive_words', JSON.stringify(updated))
    setForm({ word: '', note: '' })
    setShowAdd(false)
    toast('已添加', 'success')
  }

  const removeWord = async (idx) => {
    if (!(await confirm({ title: '删除敏感词', message: '确定删除该词？', danger: true }))) return
    const updated = words.filter((_, i) => i !== idx)
    setWords(updated)
    await window.api.setSetting('sensitive_words', JSON.stringify(updated))
    if (updated.length === 0) {
      setMatches([])
      setMarks([])
    }
    toast('已删除', 'success')
  }

  const clearMarks = () => {
    setMarks([])
    setMatches([])
  }

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
      <div className='row'>
        <button className='small primary grow' onClick={scan} disabled={loading}>
          {loading ? '扫描橙..' : '重新扫描'}
        </button>
        <button className='small' onClick={() => setShowAdd(!showAdd)}>
          添加敏感词
        </button>
        <button className='small ghost' onClick={clearMarks}>
          清除标记
        </button>
      </div>

      {showAdd && (
        <div className='panel' style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className='row'>
            <input
              className='grow'
              placeholder='敏感词'
              value={form.word}
              onChange={(e) => setForm({ ...form, word: e.target.value })}
            />
          </div>
          <div className='row'>
            <input
              className='grow'
              placeholder='备注（可选）'
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && addWord()}
            />
            <button className='small primary' onClick={addWord}>
              添加
            </button>
          </div>
        </div>
      )}

      {matches.length > 0 && (
        <div>
          <div className='row' style={{ marginBottom: 6 }}>
            <b>
              发现 {matches.length} 处匹配（{words.length} 个敏感词）
            </b>
          </div>
          {matches.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {[...new Set(matches.map((m) => m.word))].sort().map((w, i) => {
                const cnt = matches.filter((m) => m.word === w).length
                return (
                  <span key={i} className='badge yellow' title={words.find((x) => x.word === w)?.note}>
                    {w} ×{cnt}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}

      {words.length > 0 && (
        <div>
          <div className='list-header' style={{ padding: '8px 4px', border: 'none' }}>
            <h3>敏感词列表</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {words.map((w, i) => (
              <div key={i} className='row panel' style={{ padding: '6px 10px', background: 'var(--bg-3)' }}>
                <span className='badge orange'>{w.word}</span>
                <span
                  className='hint grow'
                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {w.note || ''}
                </span>
                <button className='ghost small danger' onClick={() => removeWord(i)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {words.length === 0 && (
        <div className='hint'>
          暂无敏感词。点击「添加敏感词」开始管理敏感词列表，扫描结果会在正文中以橙色高亮标出。敏感词列表保存在本地。{' '}
        </div>
      )}
    </div>
  )
}
