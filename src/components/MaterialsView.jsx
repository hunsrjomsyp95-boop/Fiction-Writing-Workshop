import { useState, useEffect, useMemo } from 'react'
import { Globe } from 'lucide-react'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'
import { marked } from 'marked'
import sanitizeHtml from '../sanitizeHtml.js'

const COMMON_TYPES = ['灵感素材', '人物设定', '世界观设定', '剧情大纲', '考据资料', '文笔词句', '未分类']

const SORT_OPTIONS = [
  { k: 'updated_at', l: '更新时间' },
  { k: 'created_at', l: '创建时间' },
  { k: 'title', l: '标题' },
  { k: 'type', l: '类型' },
]

export default function MaterialsView({ novel }) {
  const toast = useToast()
  const { prompt, confirm } = useDialog()
  const [materials, setMaterials] = useState([])
  const [types, setTypes] = useState([])
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [current, setCurrent] = useState(null)
  const [form, setForm] = useState(null)
  const [classifying, setClassifying] = useState(false)
  const [useAI, setUseAI] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState('updated_at')
  const [preview, setPreview] = useState(false)
  const [crawlDlg, setCrawlDlg] = useState(null)
  const [crawling, setCrawling] = useState(false)

  const sorted = useMemo(() => {
    const list = [...materials]
    list.sort((a, b) => {
      const va = a[sortBy] || '',
        vb = b[sortBy] || ''
      if (sortBy === 'updated_at' || sortBy === 'created_at') return vb.localeCompare(va)
      return va.localeCompare(vb)
    })
    return list
  }, [materials, sortBy])

  const load = async () => {
    setLoading(true)
    try {
      const list = await window.api.queryMaterials(novel.id, keyword, typeFilter || null)
      setMaterials(list)
      setTypes(await window.api.getMaterialTypes(novel.id))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novel.id, keyword, typeFilter])

  const create = async () => {
    const title = await prompt({ title: '资料标题', value: '新资料' })
    if (!title) return
    const it = await window.api.createMaterial(novel.id, { title })
    setMaterials(await window.api.listMaterials(novel.id))
    setCurrent(it)
    setForm({ ...it })
    load()
  }

  const openEdit = (it) => {
    setCurrent(it)
    setForm({ ...it })
  }

  const save = async () => {
    if (!form?.title.trim()) {
      toast('标题不能为空', 'error')
      return
    }
    const updated = await window.api.updateMaterial(form.id, form)
    setMaterials(await window.api.listMaterials(novel.id))
    setCurrent(updated)
    setForm(null)
    load()
    toast('已保存', 'success')
  }

  const del = async (id) => {
    if (!(await confirm({ title: '删除资料', message: '确定删除该资料？', danger: true }))) return
    await window.api.deleteMaterial(id)
    if (current?.id === id) {
      setCurrent(null)
      setForm(null)
    }
    load()
    toast('已删除', 'success')
  }

  const classifyOne = async (it) => {
    setClassifying(true)
    try {
      const text = (it.title + '\n' + it.content + '\n' + it.tags).slice(0, 4000)
      const type = await window.api.aiClassify(text, useAI)
      const updated = await window.api.updateMaterial(it.id, { type })
      setMaterials((list) => list.map((m) => (m.id === updated.id ? updated : m)))
      toast(`已分类为「${type}」`, 'success')
      if (form?.id === it.id) setForm((f) => (f ? { ...f, type } : f))
      setTypes(await window.api.getMaterialTypes(novel.id))
    } catch (e) {
      toast('分类失败：' + e.message, 'error')
    } finally {
      setClassifying(false)
    }
  }

  // 批量自动分类
  const classifyAll = async () => {
    setClassifying(true)
    try {
      let done = 0
      for (const it of materials) {
        if (it.type && it.type !== '未分类') {
          done++
          continue
        }
        const text = (it.title + '\n' + it.content + '\n' + it.tags).slice(0, 4000)
        const type = await window.api.aiClassify(text, useAI)
        await window.api.updateMaterial(it.id, { type })
        done++
      }
      load()
      toast(`批量分类完成：${done} 条`, 'success')
    } catch (e) {
      toast('批量分类失败：' + e.message, 'error')
    } finally {
      setClassifying(false)
    }
  }

  const handleCrawl = async () => {
    if (!crawlDlg?.url.trim()) {
      toast('请输入网址', 'error')
      return
    }
    if (!crawlDlg?.topic.trim()) {
      toast('请输入主题', 'error')
      return
    }
    setCrawling(true)
    try {
      const res = await window.api.crawlMaterial(novel.id, crawlDlg.url.trim(), crawlDlg.topic.trim())
      if (res.filtered) {
        const keep = await confirm({
          title: '内容与主题相关性较低',
          message: `AI 判断理由：${res.reason}\n\n是否仍然强制保存？`,
        })
        if (keep) {
          await window.api.crawlMaterial(novel.id, crawlDlg.url.trim(), crawlDlg.topic.trim(), true)
          toast('已强制保存', 'success')
        }
      } else {
        toast(`已保存资料「${res.material.title}」`, 'success')
      }
      setCrawlDlg(null)
      load()
    } catch (e) {
      toast('爬取失败：' + e.message, 'error')
    } finally {
      setCrawling(false)
    }
  }

  const allTypes = ['', ...new Set([...COMMON_TYPES, ...types])]

  return (
    <div className='main' style={{ flex: 1 }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* 类型导航）*/}
        <div
          style={{
            padding: '8px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            alignItems: 'center',
          }}
        >
          <span className='muted'>资料类型：</span>
          {allTypes.map((t) =>
            t === '' ? (
              <button
                key='__all'
                className={`small ${typeFilter === '' ? 'primary' : ''}`}
                onClick={() => setTypeFilter('')}
              >
                全部
              </button>
            ) : (
              <button key={t} className={`small ${typeFilter === t ? 'primary' : ''}`} onClick={() => setTypeFilter(t)}>
                {t}
              </button>
            )
          )}
        </div>

        {/* 查询与操作*/}
        <div
          className='row'
          style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', gap: 8, flexWrap: 'wrap' }}
        >
          <span className='hint' style={{ whiteSpace: 'nowrap' }}>
            ){materials.length} 条
          </span>
          <input
            className='grow'
            placeholder='查询标题/内容/标签/来源...'
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') load()
            }}
          />
          <button onClick={load}>查询</button>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ width: 90, fontSize: 12 }}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.k} value={o.k}>
                {o.l}
              </option>
            ))}
          </select>
          <label className='row hint' style={{ gap: 5 }}>
            <input type='checkbox' checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
            AI 分类
          </label>
          <button className='small' onClick={classifyAll} disabled={classifying}>
            {classifying ? '分类并..' : '批量自动分类'}
          </button>
          <button className='small' onClick={() => setCrawlDlg({ url: '', topic: '' })}>
            <Globe size={14} /> 爬取
          </button>
          <button
            className='small'
            onClick={async () => {
              await window.api.importMaterial(novel.id)
              load()
            }}
          >
            导入
          </button>
          <button
            className='small'
            onClick={async () => {
              const res = await window.api.batchImportMaterial(novel.id)
              if (res?.canceled) return
              load()
            }}
          >
            批量导入
          </button>
          <button className='small primary' onClick={create}>
            更新资料
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {loading ? (
            <div className='loading'>加载中..</div>
          ) : sorted.length === 0 ? (
            <div className='empty-state'>
              <div className='hint'>暂无资料。添加考据、灵感、素材等内容，自动或手动分类后，可按类型快速查询。</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {sorted.map((m) => (
                <div key={m.id} className='card' style={{ cursor: 'pointer' }} onClick={() => openEdit(m)}>
                  <div className='row'>
                    <b className='grow'>{m.title}</b>
                    <span className='badge accent'>{m.type}</span>
                  </div>
                  <div className='meta' style={{ marginTop: 6 }}>
                    {m.content.slice(0, 80)}
                    {m.content.length > 80 ? '...' : ''}
                  </div>
                  <div className='row mt8'>
                    {m.tags && (
                      <span
                        className='hint grow'
                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {m.tags}
                      </span>
                    )}
                    <button
                      className='ghost small'
                      onClick={(e) => {
                        e.stopPropagation()
                        classifyOne(m)
                      }}
                      disabled={classifying}
                    >
                      自动分类
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {form && (
        <div
          style={{
            width: 430,
            borderLeft: '1px solid var(--border)',
            background: 'var(--bg-2)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className='list-header'>
            <h3>编辑资料</h3>
            <div className='grow' />
            <button className='ghost small' onClick={() => setForm(null)}>
              关闭
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className='form-field'>
              <label>标题</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className='form-grid'>
              <div className='form-field'>
                <label>类型</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {allTypes.filter(Boolean).map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className='form-field'>
                <label>标签（逗号分隔）</label>
                <input value={form.tags || ''} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
              </div>
            </div>
            <div className='form-field'>
              <label>来源</label>
              <input
                value={form.source || ''}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                placeholder='书籍 / 网址 / 笔记...'
              />
            </div>
            <div className='form-field'>
              <label>
                内容{' '}
                <span className='hint' style={{ cursor: 'pointer' }} onClick={() => setPreview((p) => !p)}>
                  [{preview ? '编辑' : '预览'}]
                </span>
              </label>
              {preview ? (
                <div
                  className='reading-wrap'
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: 8,
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    minHeight: 200,
                    background: 'var(--bg-3)',
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(marked(form.content || '')) }}
                />
              ) : (
                <textarea
                  rows={18}
                  value={form.content || ''}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              )}
            </div>
          </div>
          <div className='row right' style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
            <button className='danger small' onClick={() => del(form.id)}>
              删除
            </button>
            <button className='small' onClick={() => classifyOne(form)} disabled={classifying}>
              自动分类
            </button>
            <button
              className='small'
              onClick={async () => {
                await window.api.exportMaterial(form.id)
                toast('已导入', 'success')
              }}
            >
              导出
            </button>
            <div className='grow' />
            <button onClick={() => setForm(null)}>取消</button>
            <button className='primary' onClick={save}>
              保存
            </button>
          </div>
        </div>
      )}

      {crawlDlg && (
        <div
          className='modal-mask'
          onClick={() => {
            if (!crawling) setCrawlDlg(null)
          }}
        >
          <div className='modal' style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className='modal-head'>
              <Globe size={16} /> 网页爬取
            </div>
            <div className='modal-body' style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className='form-field'>
                <label>网址</label>
                <input
                  autoFocus
                  placeholder='https://...'
                  value={crawlDlg.url}
                  onChange={(e) => setCrawlDlg({ ...crawlDlg, url: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !crawling) handleCrawl()
                  }}
                />
              </div>
              <div className='form-field'>
                <label>感兴趣的主题</label>
                <input
                  placeholder='例如：唐朝官制、魔法体系、悬疑写作技巧……'
                  value={crawlDlg.topic}
                  onChange={(e) => setCrawlDlg({ ...crawlDlg, topic: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !crawling) handleCrawl()
                  }}
                />
              </div>
              {crawling && (
                <div className='loading' style={{ textAlign: 'center' }}>
                  正在抓取并分析…(
                </div>
              )}
            </div>
            <div className='modal-foot'>
              <button disabled={crawling} onClick={() => setCrawlDlg(null)}>
                取消
              </button>
              <button className='primary' disabled={crawling} onClick={handleCrawl}>
                开始爬取
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
