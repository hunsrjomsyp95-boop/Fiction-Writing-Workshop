import { useState, useEffect } from 'react'
import { useToast } from '../../ToastContext.jsx'
import { useDialog } from '../../Dialog.jsx'

const CATEGORIES = [
  '地理',
  '历史',
  '势力组织',
  '魔法/修炼体系',
  '政治制度',
  '文化习俗',
  '科技/物品',
  '神祇信仰',
  '种族',
  '其他',
]

export default function WorldsSub({ novel }) {
  const toast = useToast()
  const { prompt, confirm } = useDialog()
  const [list, setList] = useState([])
  const [current, setCurrent] = useState(null)
  const [form, setForm] = useState(null)
  const [catFilter, setCatFilter] = useState('')
  const [worldName, setWorldName] = useState('主世界')
  const [worldNames, setWorldNames] = useState(['主世界'])

  const load = async () => {
    const names = await window.api.listWorldNames(novel.id)
    const ns = names.length ? names : ['主世界']
    setWorldNames(ns)
    setWorldName((w) => (ns.includes(w) ? w : ns[0]))
    setList(await window.api.listWorlds(novel.id, worldName))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novel.id, worldName])

  const addWorld = async () => {
    const name = await prompt({ title: '新建世界', value: '新世界', placeholder: '如：仙界 / 地球 / 异界' })
    if (!name || name === worldName) return
    setWorldName(name)
    toast('已切换到新世界', 'success')
  }

  const create = async () => {
    const name = await prompt({ title: '设定名称', value: '新设定' })
    if (!name) return
    const category = (await prompt({ title: '分类', value: '其他' })) || '其他'
    const it = await window.api.createWorld(novel.id, { name, category, world_name: worldName })
    setList(await window.api.listWorlds(novel.id, worldName))
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
    const updated = await window.api.updateWorld(form.id, form)
    setList(await window.api.listWorlds(novel.id))
    setCurrent(updated)
    setForm(null)
    toast('已保存', 'success')
  }

  const del = async (id) => {
    if (!(await confirm({ title: '删除设定', message: '确定删除该设定？', danger: true }))) return
    await window.api.deleteWorld(id)
    if (current?.id === id) {
      setCurrent(null)
      setForm(null)
    }
    load()
    toast('已删除', 'success')
  }

  const [classifying, setClassifying] = useState(null)
  const [batchBusy, setBatchBusy] = useState(false)

  const classifyOne = async (w) => {
    setClassifying(w.id)
    try {
      const text = `${w.name}\n${w.content || ''}`.slice(0, 4000)
      const type = await window.api.aiClassifyTo(text, CATEGORIES)
      await window.api.updateWorld(w.id, { category: type })
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
        message: '将由 AI 为全部设定自动判断分类并填写（会覆盖手动设置的分/类）。确定继续？',
      }))
    )
      return
    setBatchBusy(true)
    try {
      let done = 0
      for (const w of list) {
        const text = `${w.name}\n${w.content || ''}`.slice(0, 4000)
        const type = await window.api.aiClassifyTo(text, CATEGORIES)
        await window.api.updateWorld(w.id, { category: type })
        done++
      }
      load()
      toast(`已为 ${done} 条设定完成分类`, 'success')
    } catch (e) {
      toast('批量分类失败：' + e.message, 'error')
    } finally {
      setBatchBusy(false)
    }
  }

  const cats = ['', ...new Set(list.map((w) => w.category))]
  const filtered = catFilter ? list.filter((w) => w.category === catFilter) : list

  return (
    <div className='main' style={{ flex: 1 }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div className='row' style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', gap: 8 }}>
          <span className='muted'>世界观</span>
          <select style={{ width: 140 }} value={worldName} onChange={(e) => setWorldName(e.target.value)}>
            {worldNames.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
          <button className='small' onClick={addWorld} title='新建一个世界并切换过去'>
            到新世界
          </button>
          <select style={{ width: 160 }} value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
            <option value=''>全部分类</option>
            {cats.filter(Boolean).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <div className='grow' />
          <span className='muted'>{filtered.length} 个</span>
          <button className='small' onClick={classifyAll} disabled={batchBusy}>
            {batchBusy ? '分类并..' : 'AI 批量分类'}
          </button>
          <button className='small primary' onClick={create}>
            新增设定
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {filtered.length === 0 ? (
            <div className='empty-state'>
              <div className='hint'>
                为你的世界建立设定：地理、历史、势力、力量体系等。
                <br />
                写好后可点「AI 批量分类」让 AI 自动判断分类并填写。
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
              {filtered.map((w) => (
                <div key={w.id} className='card' style={{ cursor: 'pointer' }} onClick={() => openEdit(w)}>
                  <div className='row'>
                    <b className='grow'>{w.name}</b>
                    <span className='badge cyan'>{w.category}</span>
                    <button
                      className='ghost small'
                      title='AI 判断分类并填写'
                      disabled={classifying === w.id || batchBusy}
                      onClick={(e) => {
                        e.stopPropagation()
                        classifyOne(w)
                      }}
                    >
                      {classifying === w.id ? 'AI 判断分..' : 'AI 分类'}
                    </button>
                  </div>
                  <div className='meta' style={{ marginTop: 6 }}>
                    {w.content.slice(0, 60)}
                    {w.content.length > 60 ? '...' : ''}
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
            <h3>编辑设定</h3>
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
            <div className='form-field'>
              <label>分类</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className='form-field'>
              <label>所属世界</label>
              <select
                value={form.world_name || '主世界'}
                onChange={(e) => setForm({ ...form, world_name: e.target.value })}
              >
                {worldNames.map((w) => (
                  <option key={w}>{w}</option>
                ))}
              </select>
            </div>
            <div className='form-field'>
              <label>设定内容</label>
              <textarea
                rows={22}
                value={form.content || ''}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder='详细设定。建议结构：概述 / 关键规则 / 与其他设定的关联 / 创作可用素材...'
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
