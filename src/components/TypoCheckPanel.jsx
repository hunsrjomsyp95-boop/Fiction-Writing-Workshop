import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'

export default function TypoCheckPanel({ novel: _novel, chapter: _chapter, content, setMarks, onReplace }) {
  const toast = useToast()
  const { confirm } = useDialog()
  const [issues, setIssues] = useState([])
  const [freq, setFreq] = useState([])
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [selected, setSelected] = useState(null) // eslint-disable-line no-unused-vars
  const [dictOpen, setDictOpen] = useState(false)
  const [dictList, setDictList] = useState([])

  const runLocal = async () => {
    if (!content) {
      toast('当前章节没有内容', 'error')
      return
    }
    setLoading(true)
    try {
      const res = await window.api.typoCheck(content, { includeFrequency: true })
      setIssues(res.issues)
      setFreq(res.frequency)
      const marks = res.issues
        .filter((i) => i.wrong)
        .map((i) => ({ start: i.start, end: i.end, right: i.right, note: i.note }))
      setMarks(marks)
      if (res.issues.length === 0) toast('未发现错字错词', 'success')
    } finally {
      setLoading(false)
    }
  }

  const runAI = async () => {
    if (!content) {
      toast('当前章节没有内容', 'error')
      return
    }
    setAiLoading(true)
    try {
      const list = await window.api.aiProofread(content)
      if (list.length === 0) {
        toast('AI 未发现问题', 'success')
        return
      }
      const withPos = []
      for (const it of list) {
        if (!it.wrong) continue
        let idx = 0
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const pos = content.indexOf(it.wrong, idx)
          if (pos === -1) break
          withPos.push({ ...it, kind: 'ai', start: pos, end: pos + it.wrong.length, source: 'AI' })
          idx = pos + it.wrong.length
        }
      }
      setIssues(withPos)
      setMarks(withPos.map((i) => ({ start: i.start, end: i.end, right: i.right, note: i.reason })))
      toast(`AI 发现 ${withPos.length} 处问题`, 'success')
    } catch (e) {
      toast('AI 校对失败：' + e.message, 'error')
    } finally {
      setAiLoading(false)
    }
  }

  const fixOne = (issue) => {
    if (!issue.right) {
      toast('该问题没有建议修正', 'error')
      return
    }
    const result = applyOne(content, issue)
    setIssues((list) => list.filter((i) => i !== issue))
    setMarks((m) => m.filter((x) => !(x.start === issue.start && x.end === issue.end)))
    onReplace(result.text)
    toast('已修改', 'success')
  }

  const fixAll = () => {
    const withFix = issues.filter((i) => i.wrong && i.right)
    if (withFix.length === 0) {
      toast('没有可自动修正的项目', 'error')
      return
    }
    const sorted = [...withFix].sort((a, b) => b.start - a.start)
    let text = content
    let count = 0
    for (const item of sorted) {
      if (text.slice(item.start, item.end) !== item.wrong) continue
      text = text.slice(0, item.start) + item.right + text.slice(item.end)
      count++
    }
    setIssues([])
    setMarks([])
    onReplace(text)
    toast(`已修改${count} 处`, 'success')
  }

  const addToDict = async (issue) => {
    if (!issue.wrong) return
    await window.api.typoDictAdd({
      wrong: issue.wrong,
      right: issue.right || '',
      note: issue.note || '',
      source: '用户',
    })
    toast('已加入自定义词典', 'success')
  }

  const openDict = async () => {
    setDictOpen(true)
    setDictList(await window.api.typoDictList())
  }

  const delDict = async (id) => {
    if (!(await confirm({ title: '删除词典条目', message: '确定删除该词典条目？', danger: true }))) return
    await window.api.typoDictDelete(id)
    setDictList(await window.api.typoDictList())
    toast('已删除', 'success')
  }

  const clearMarks = () => {
    setMarks([])
    setIssues([])
    setFreq([])
  }

  return (
    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
      <div className='row'>
        <button className='small primary grow' onClick={runLocal} disabled={loading}>
          {loading ? '检查中...' : '检查错字错词'}
        </button>
        <button className='small' onClick={runAI} disabled={aiLoading}>
          {aiLoading ? 'AI 校对」..' : 'AI 校对'}
        </button>
        <button className='small ghost' onClick={clearMarks}>
          清空标记
        </button>
      </div>
      <button className='small ghost' onClick={openDict}>
        管理自定义词典
      </button>

      {issues.length > 0 && (
        <div>
          <div className='row' style={{ marginBottom: 6 }}>
            <b>发现 {issues.length} 处问题</b>
            <div className='grow' />
            <button className='small primary' onClick={fixAll}>
              全部修正
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {issues.map((it, idx) => (
              <div key={idx} className='panel' style={{ padding: 8, background: 'var(--bg-3)' }}>
                <div className='row wrap'>
                  <span className='badge red'>){it.wrong}</span>
                  {it.right && <span className='badge green'>){it.right}</span>}
                  <span className='badge'>{it.source}</span>
                </div>
                {(it.note || it.reason) && (
                  <div className='hint' style={{ marginTop: 4 }}>
                    {it.note || it.reason}
                  </div>
                )}
                <div className='row mt8'>
                  {it.right && (
                    <button className='small primary' onClick={() => fixOne(it)}>
                      修正
                    </button>
                  )}
                  <button className='small' onClick={() => addToDict(it)}>
                    加入词典
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {freq.length > 0 && (
        <div>
          <div className='list-header' style={{ padding: '8px 4px', border: 'none' }}>
            <h3>高频字词统计（可能误用，仅供参考）</h3>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {freq.map((f, i) => (
              <span key={i} className='badge yellow' title={`出现 ${f.count} 次`}>
                {f.ch} ×{f.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {issues.length === 0 && freq.length === 0 && (
        <div className='hint'>
          提示：点击「检查错字错词」会结合内置/自定义词典与常见错别字库进行扫描；「AI
          校对」会调用已配置的大模型做更智能的审校。结果会在正文中以红色高亮标出。{' '}
        </div>
      )}

      {dictOpen && (
        <div className='modal-mask' onClick={() => setDictOpen(false)}>
          <div className='modal' style={{ width: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className='modal-head'>
              自定义错字词典 <div className='spacer' />
              <button className='ghost small' onClick={() => setDictOpen(false)}>
                关闭
              </button>
            </div>
            <div className='modal-body' style={{ maxHeight: '60vh' }}>
              <DictAdd onAdded={async () => setDictList(await window.api.typoDictList())} toast={toast} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {dictList.map((d) => (
                  <div key={d.id} className='row panel' style={{ padding: '6px 10px', background: 'var(--bg-3)' }}>
                    <span className='badge red'>{d.wrong}</span>
                    <span className='badge green'>{d.right}</span>
                    <span
                      className='hint grow'
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {d.note}
                    </span>
                    <span className='badge'>{d.source}</span>
                    <button className='ghost small danger' onClick={() => delDict(d.id)}>
                      登
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function applyOne(content, issue) {
  const seg = content.slice(issue.start, issue.end)
  if (seg !== issue.wrong) return { text: content }
  return { text: content.slice(0, issue.start) + issue.right + content.slice(issue.end) }
}

function DictAdd({ onAdded, toast }) {
  const [form, setForm] = useState({ wrong: '', right: '', note: '' })
  const add = async () => {
    if (!form.wrong.trim() || !form.right.trim()) {
      toast('请填写错误词和正确词', 'error')
      return
    }
    await window.api.typoDictAdd(form)
    setForm({ wrong: '', right: '', note: '' })
    toast('已添加', 'success')
    onAdded()
  }
  return (
    <div className='panel' style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className='row'>
        <input
          style={{ flex: 1 }}
          placeholder='错误写法'
          value={form.wrong}
          onChange={(e) => setForm({ ...form, wrong: e.target.value })}
        />
        <ArrowRight size={14} />
        <input
          style={{ flex: 1 }}
          placeholder='正确写法'
          value={form.right}
          onChange={(e) => setForm({ ...form, right: e.target.value })}
        />
      </div>
      <div className='row'>
        <input
          className='grow'
          placeholder='备注（可选）'
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button className='small primary' onClick={add}>
          添加
        </button>
      </div>
    </div>
  )
}
