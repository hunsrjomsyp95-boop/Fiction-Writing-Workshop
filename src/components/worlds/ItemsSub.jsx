import { useState, useEffect } from 'react'
import { useToast } from '../../ToastContext.jsx'
import { useDialog } from '../../Dialog.jsx'

const CATEGORIES = ['物品', '道具', '关键地点', '武器', '防具', '丹药', '功法秘籍', '状态', '其他']
const IMPORTANCE = ['普通', '重要', '稀有', '绝世']

export default function ItemsSub({ novel }) {
  const toast = useToast()
  const { prompt, confirm } = useDialog()
  const [list, setList] = useState([])
  const [characters, setCharacters] = useState([])
  const [catFilter, setCatFilter] = useState('')
  const [current, setCurrent] = useState(null)
  const [form, setForm] = useState(null)

  const load = async () => setList(await window.api.listItems(novel.id, catFilter || null))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novel.id, catFilter])
  useEffect(() => {
    window.api.listCharacters(novel.id).then(setCharacters)
  }, [novel.id])

  const create = async () => {
    const name = await prompt({ title: '名称', value: '新物品' })
    if (!name) return
    const it = await window.api.createItem(novel.id, { name })
    load()
    setCurrent(it)
    setForm({ ...it })
  }

  const openEdit = (it) => {
    setCurrent(it)
    setForm({ ...it })
  }

  const save = async () => {
    if (!form?.name.trim()) {
      toast('名称不能为空', 'error')
      return
    }
    const updated = await window.api.updateItem(form.id, form)
    load()
    setCurrent(updated)
    setForm(null)
    toast('已保存', 'success')
  }

  const del = async (id) => {
    if (!(await confirm({ title: '删除', message: '确定删除该项？', danger: true }))) return
    await window.api.deleteItem(id)
    if (current?.id === id) {
      setCurrent(null)
      setForm(null)
    }
    load()
    toast('已删除', 'success')
  }

  const [classifying, setClassifying] = useState(null)
  const [batchBusy, setBatchBusy] = useState(false)

  const classifyOne = async (it) => {
    setClassifying(it.id)
    try {
      const text = `${it.name}\n${it.description || ''}`.slice(0, 4000)
      const type = await window.api.aiClassifyTo(text, CATEGORIES)
      await window.api.updateItem(it.id, { category: type })
      load()
      toast(`已分类为「${type}」`, 'success')
    } catch (e) {
      toast('分类失败：' + e.message, 'error')
    } finally {
      setClassifying(null)
    }
  }

  const classifyAll = async () => {
    if (
      !(await confirm({
        title: '批量 AI 分类',
        message: '将由 AI 为全部物品地点自动判断分类并填写（会覆盖手动设置的分类）。确定继续？',
      }))
    )
      return
    setBatchBusy(true)
    try {
      let done = 0
      for (const it of list) {
        const text = `${it.name}\n${it.description || ''}`.slice(0, 4000)
        const type = await window.api.aiClassifyTo(text, CATEGORIES)
        await window.api.updateItem(it.id, { category: type })
        done++
      }
      load()
      toast(`已为 ${done} 项完成分类`, 'success')
    } catch (e) {
      toast('批量分类失败：' + e.message, 'error')
    } finally {
      setBatchBusy(false)
    }
  }

  return (
    <div className='main' style={{ flex: 1 }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div className='row wrap' style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', gap: 6 }}>
          <span className='muted'>分类：</span>
          <button className={`small ${catFilter === '' ? 'primary' : ''}`} onClick={() => setCatFilter('')}>
            全部
          </button>
          {CATEGORIES.map((c) => (
            <button key={c} className={`small ${catFilter === c ? 'primary' : ''}`} onClick={() => setCatFilter(c)}>
              {c}
            </button>
          ))}
          <div className='grow' />
          <button className='small' onClick={classifyAll} disabled={batchBusy}>
            {batchBusy ? '分类并..' : 'AI 批量分类'}
          </button>
          <button className='small primary' onClick={create}>
            新增物品
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {list.length === 0 ? (
            <div className='empty-state'>
              <div className='hint'>
                记录重要物品、道具、关键地点与状态。例如：主角的佩剑、改变局势的宝物、故事核心地点。
                <br />
                写好后可点「AI 批量分类」让 AI 自动判断分类并填写。
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
              {list.map((it) => (
                <div key={it.id} className='card' style={{ cursor: 'pointer' }} onClick={() => openEdit(it)}>
                  <div className='row'>
                    <b className='grow'>{it.name}</b>
                    <span className='badge cyan'>{it.category}</span>
                    <button
                      className='ghost small'
                      title='AI 判断分类并填写'
                      disabled={classifying === it.id || batchBusy}
                      onClick={(e) => {
                        e.stopPropagation()
                        classifyOne(it)
                      }}
                    >
                      {classifying === it.id ? 'AI 判断分..' : 'AI 分类'}
                    </button>
                  </div>
                  <div className='row mt8'>
                    <span className='badge'>{it.importance}</span>
                    {it.owner_name && <span className='badge accent'>持有人：{it.owner_name}</span>}
                    {it.location && <span className='badge'>位于：{it.location}</span>}
                  </div>
                  {it.description && (
                    <div className='meta' style={{ marginTop: 6 }}>
                      {it.description.slice(0, 50)}
                      {it.description.length > 50 ? '...' : ''}
                    </div>
                  )}
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
            <h3>编辑</h3>
            <div className='grow' />
            <button className='ghost small' onClick={() => setForm(null)}>
              关闭
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className='form-field'>
              <label>名称</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className='form-grid'>
              <div className='form-field'>
                <label>分类</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className='form-field'>
                <label>重要程度</label>
                <select value={form.importance} onChange={(e) => setForm({ ...form, importance: e.target.value })}>
                  {IMPORTANCE.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className='form-grid'>
              <div className='form-field'>
                <label>持有者</label>
                <select
                  value={form.owner_id || ''}
                  onChange={(e) => setForm({ ...form, owner_id: e.target.value ? Number(e.target.value) : null })}
                >
                  <option value=''>- 无 -</option>
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className='form-field'>
                <label>所在地</label>
                <input value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
            <div className='form-field'>
              <label>标签（逗号分隔）</label>
              <input value={form.tags || ''} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </div>
            <div className='form-field'>
              <label>描述 / 来历 / 能力效果</label>
              <textarea
                rows={16}
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
