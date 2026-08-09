import { useState, useEffect } from 'react'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'

const TYPES = [
  '普通',
  '契诃夫之枪',
  '预言暗示',
  '象征伏笔',
  '角色伏笔',
  '对话伏笔',
  '环境伏笔',
  '时间线伏笔',
  '红鲱鱼',
  '平行伏笔',
  '回调伏笔',
]
const STATUSES = ['计划', '已埋', '已呼', '已回', '已收', '放弃']

const STATUS_BADGE = { 计划: 'yellow', 已埋: 'accent', 已呼: 'cyan', 已回: 'green', 已收: 'green', 放弃: 'red' }

export default function ForeshadowView({ novel }) {
  const toast = useToast()
  const { prompt, confirm } = useDialog()
  const [list, setList] = useState([])
  const [chapters, setChapters] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [current, setCurrent] = useState(null)
  const [form, setForm] = useState(null)

  const load = async () => {
    setList(await window.api.listForeshadowings(novel.id, statusFilter || null))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novel.id, statusFilter])

  useEffect(() => {
    window.api.listChapters(novel.id).then(setChapters)
  }, [novel.id])

  const create = async () => {
    const title = await prompt({ title: '伏笔名称', value: '新伏笔' })
    if (!title) return
    const it = await window.api.createForeshadowing(novel.id, { title })
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
    const updated = await window.api.updateForeshadowing(form.id, form)
    load()
    setCurrent(updated)
    setForm(null)
    toast('已保存', 'success')
  }

  const del = async (id) => {
    if (!(await confirm({ title: '删除伏笔', message: '确定删除该伏笔？', danger: true }))) return
    await window.api.deleteForeshadowing(id)
    if (current?.id === id) {
      setCurrent(null)
      setForm(null)
    }
    load()
    toast('已删除', 'success')
  }

  const setStatus = async (it, status) => {
    await window.api.updateForeshadowing(it.id, { status })
    load()
    if (current?.id === it.id) setForm((f) => (f ? { ...f, status } : f))
    toast(`状态（${status}`, 'success')
  }

  const filtered = list.filter((it) => !typeFilter || it.type === typeFilter)

  return (
    <div className='main' style={{ flex: 1 }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div className='row wrap' style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', gap: 6 }}>
          <span className='muted'>状态：</span>
          <button className={`small ${statusFilter === '' ? 'primary' : ''}`} onClick={() => setStatusFilter('')}>
            全部
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`small ${statusFilter === s ? 'primary' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
          <div className='grow' />
          <select style={{ width: 150 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value=''>全部类型</option>
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <button className='small primary' onClick={create}>
            更新伏笔
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
          {filtered.length === 0 ? (
            <div className='empty-state'>
              <div className='hint'>
                伏笔系统用于跟踪「埋 - 呼- 收」全过程。
                <br />
                类型包括：契诃夫之枪、预言暗示、象征、角色、对话、环境、时间线、红鲱鱼、平行、回调。
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
              {filtered.map((it) => (
                <div key={it.id} className='card' style={{ cursor: 'pointer' }} onClick={() => openEdit(it)}>
                  <div className='row'>
                    <b className='grow'>{it.title}</b>
                    <span className={`badge ${STATUS_BADGE[it.status] || ''}`}>{it.status}</span>
                  </div>
                  <div className='row mt8'>
                    <span className='badge cyan'>{it.type}</span>
                    {it.chapter_title && <span className='badge'>埋于《${it.chapter_title}》</span>}
                  </div>
                  {it.setup_desc && (
                    <div className='meta' style={{ marginTop: 6 }}>
                      {it.setup_desc.slice(0, 50)}
                      {it.setup_desc.length > 50 ? '...' : ''}
                    </div>
                  )}
                  <div className='row mt8'>
                    <button
                      className='ghost small'
                      onClick={(e) => {
                        e.stopPropagation()
                        setStatus(it, '已呼')
                      }}
                    >
                      呼应
                    </button>
                    <button
                      className='ghost small'
                      onClick={(e) => {
                        e.stopPropagation()
                        setStatus(it, '已收')
                      }}
                    >
                      回收
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
            width: 440,
            borderLeft: '1px solid var(--border)',
            background: 'var(--bg-2)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div className='list-header'>
            <h3>编辑伏笔</h3>
            <div className='grow' />
            <button className='ghost small' onClick={() => setForm(null)}>
              关闭
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className='form-field'>
              <label>名称</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className='form-grid'>
              <div className='form-field'>
                <label>类型</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
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
              <label>埋设章节</label>
              <select
                value={form.chapter_id || ''}
                onChange={(e) => setForm({ ...form, chapter_id: e.target.value ? Number(e.target.value) : null })}
              >
                <option value=''>- 未关联 -</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className='form-field'>
              <label>埋设设定（怎么埋）</label>
              <textarea
                rows={3}
                value={form.setup_desc || ''}
                onChange={(e) => setForm({ ...form, setup_desc: e.target.value })}
                placeholder='在什么位置、以什么方式埋下这个伏笔..'
              />
            </div>
            <div className='form-field'>
              <label>呼应设定（何时呼应）</label>
              <textarea
                rows={3}
                value={form.call_desc || ''}
                onChange={(e) => setForm({ ...form, call_desc: e.target.value })}
                placeholder='在什么剧情节点让读者重新意识到它..'
              />
            </div>
            <div className='form-field'>
              <label>回收设定（如何回收）</label>
              <textarea
                rows={3}
                value={form.resolve_desc || ''}
                onChange={(e) => setForm({ ...form, resolve_desc: e.target.value })}
                placeholder='伏笔如何得到解释和回报..'
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
