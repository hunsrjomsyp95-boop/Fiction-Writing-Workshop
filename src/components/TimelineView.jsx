import { useState, useEffect } from 'react'
import { MapPin, ArrowUp, ArrowDown } from 'lucide-react'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'

const STATUSES = ['进行中', '已完成', '未来', '历史', '旁支']
const STATUS_BADGE = { 进行中: 'yellow', 已完成: 'green', 未来: 'cyan', 历史: 'accent', 旁支: 'red' }

export default function TimelineView({ novel }) {
  const toast = useToast()
  const { prompt, confirm } = useDialog()
  const [list, setList] = useState([])
  const [chapters, setChapters] = useState([])
  const [current, setCurrent] = useState(null)
  const [form, setForm] = useState(null)

  const load = async () => setList(await window.api.listTimeline(novel.id))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novel.id])
  useEffect(() => {
    window.api.listChapters(novel.id).then(setChapters)
  }, [novel.id])

  const create = async () => {
    const title = await prompt({ title: '事件名称', value: '新事件' })
    if (!title) return
    const it = await window.api.createTimelineEvent(novel.id, { title })
    load()
    setCurrent(it)
    setForm({ ...it })
  }

  const openEdit = (it) => {
    setCurrent(it)
    setForm({ ...it })
  }

  const save = async () => {
    if (!form?.title.trim()) {
      toast('名称不能为空', 'error')
      return
    }
    const updated = await window.api.updateTimelineEvent(form.id, form)
    load()
    setCurrent(updated)
    setForm(null)
    toast('已保存', 'success')
  }

  const del = async (id) => {
    if (!(await confirm({ title: '删除事件', message: '确定删除该事件？', danger: true }))) return
    await window.api.deleteTimelineEvent(id)
    if (current?.id === id) {
      setCurrent(null)
      setForm(null)
    }
    load()
    toast('已删除', 'success')
  }

  const move = async (id, dir) => {
    const idx = list.findIndex((e) => e.id === id)
    const target = idx + dir
    if (target < 0 || target >= list.length) return
    const arr = list.map((e) => e.id)
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    setList(await window.api.reorderTimeline(novel.id, arr))
  }

  const sortByTime = async () => {
    setList(await window.api.sortTimelineByStoryTime(novel.id))
    toast('已按故事时间排序', 'success')
  }

  return (
    <div className='main' style={{ flex: 1 }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div className='list-header'>
          <h3>故事年表（{list.length})</h3>
          <div className='grow' />
          <span className='hint'>可手动上下调整，或一键按故事时间排序。</span>
          <button className='small' onClick={sortByTime} title='按故事时间中的数值自动排序'>
            按故事时间排序
          </button>
          <button className='small primary' onClick={create}>
            更新事件
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {list.length === 0 ? (
            <div className='empty-state'>
              <div className='hint'>建立故事时间轴：为每个事件标注故事时间（如「开元三年春」），自动按时间排序。</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 720 }}>
              {list.map((e, i) => (
                <div
                  key={e.id}
                  className='row panel'
                  style={{
                    padding: '10px 14px',
                    background: 'var(--bg-3)',
                    cursor: 'pointer',
                    alignItems: 'flex-start',
                  }}
                  onClick={() => openEdit(e)}
                >
                  <div className='row' style={{ gap: 2, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    <button className='ghost small' title='上移' onClick={() => move(e.id, -1)} disabled={i === 0}>
                      <ArrowUp size={14} />
                    </button>
                    <button
                      className='ghost small'
                      title='下移'
                      onClick={() => move(e.id, 1)}
                      disabled={i === list.length - 1}
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <span className='badge accent' style={{ flexShrink: 0, marginTop: 2 }}>
                    {e.story_time || '未标注时间'}
                  </span>
                  <div className='grow' style={{ minWidth: 0 }}>
                    <div className='row'>
                      <b>{e.title}</b>
                      <span className={`badge ${STATUS_BADGE[e.status] || ''}`}>{e.status}</span>
                      {e.chapter_title && <span className='badge'>《{e.chapter_title})</span>}
                    </div>
                    {e.location && (
                      <div className='meta' style={{ marginTop: 2 }}>
                        <MapPin size={12} /> {e.location}
                      </div>
                    )}
                    {e.description && (
                      <div className='meta' style={{ marginTop: 4, lineHeight: 1.6 }}>
                        {e.description}
                      </div>
                    )}
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
            width: 420,
            borderLeft: '1px solid var(--border)',
            background: 'var(--bg-2)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className='list-header'>
            <h3>编辑事件</h3>
            <div className='grow' />
            <button className='ghost small' onClick={() => setForm(null)}>
              关闭
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className='form-field'>
              <label>事件名称</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className='form-grid'>
              <div className='form-field'>
                <label>故事时间</label>
                <input
                  value={form.story_time || ''}
                  onChange={(e) => setForm({ ...form, story_time: e.target.value })}
                  placeholder='开元三年春 / 穿越后第7天'
                />
              </div>
              <div className='form-field'>
                <label>状态</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className='form-field'>
              <label>发生地点</label>
              <input value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className='form-field'>
              <label>关联章节</label>
              <select
                value={form.chapter_id || ''}
                onChange={(e) => setForm({ ...form, chapter_id: e.target.value ? Number(e.target.value) : null })}
              >
                <option value=''>- 未关联-</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className='form-field'>
              <label>事件描述</label>
              <textarea
                rows={12}
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <div className='row right' style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
            <button className='danger small' onClick={() => del(form.id)}>
              删除
            </button>
            <div className='grow' />
            <button onClick={() => setForm(null)}>取消</button>
            <button className='primary' onClick={save}>
              保存
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
