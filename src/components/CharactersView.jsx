import { useState, useEffect, useCallback, useMemo } from 'react'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'
import RelationGraph from './RelationGraph.jsx'

const ROLES = ['主角', '重要配角', '配角', '反派', '龙套', '未定']

const FIELDS = [
  { key: 'name', label: '姓名' },
  { key: 'alias', label: '别名/称号' },
  { key: 'role', label: '定位', select: ROLES },
  { key: 'gender', label: '性别' },
  { key: 'age', label: '年龄' },
  { key: 'appearance', label: '外貌', textarea: true },
  { key: 'personality', label: '性格', textarea: true },
  { key: 'background', label: '背景故事', textarea: true },
  { key: 'relationships', label: '人物关系', textarea: true },
  { key: 'notes', label: '备注', textarea: true },
]

export default function CharactersView({ novel }) {
  const toast = useToast()
  const { prompt, confirm } = useDialog()
  const [sub, setSub] = useState('list')
  const [list, setList] = useState([])
  const [current, setCurrent] = useState(null)
  const [form, setForm] = useState(null)
  const [filter, setFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [relations, setRelations] = useState([])
  const [relForm, setRelForm] = useState(null)
  const [appearances, setAppearances] = useState([])

  const load = useCallback(async () => {
    setList(await window.api.listCharacters(novel.id))
  }, [novel.id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (current?.id) {
      window.api.listRelations(novel.id, current.id).then(setRelations)
      window.api.characterAppearances(novel.id, current.id).then(setAppearances)
    } else {
      setRelations([])
      setAppearances([])
    }
  }, [current?.id, novel.id])

  const create = useCallback(async () => {
    const name = await prompt({ title: '人物姓名', value: '新人物' })
    if (!name) return
    const it = await window.api.createCharacter(novel.id, { name })
    setList(await window.api.listCharacters(novel.id))
    setCurrent(it)
    setForm({ ...it })
  }, [novel.id, prompt])

  const openEdit = useCallback((it) => {
    setCurrent(it)
    setForm({ ...it })
  }, [])

  const save = useCallback(async () => {
    if (!form?.name.trim()) {
      toast('姓名不能为空', 'error')
      return
    }
    const updated = await window.api.updateCharacter(form.id, form)
    setList(await window.api.listCharacters(novel.id))
    setCurrent(updated)
    setForm(null)
    toast('已保存', 'success')
  }, [form, novel.id, toast])

  const del = useCallback(async (id) => {
    if (!(await confirm({ title: '删除人物', message: '确定删除该人物？', danger: true }))) return
    await window.api.deleteCharacter(id)
    if (current?.id === id) {
      setCurrent(null)
      setForm(null)
    }
    load()
    toast('已删除', 'success')
  }, [confirm, current?.id, load, toast])

  const filtered = useMemo(() => {
    return list.filter((c) => {
      const kw = filter.toLowerCase()
      const hit = !kw || c.name.toLowerCase().includes(kw) || c.alias.toLowerCase().includes(kw) || c.notes.toLowerCase().includes(kw)
      const hitRole = !roleFilter || c.role === roleFilter
      return hit && hitRole
    })
  }, [list, filter, roleFilter])

  const openFromGraph = useCallback((id) => {
    const it = list.find((c) => c.id === id)
    if (!it) return
    setSub('list')
    setFilter(it.name)
    setCurrent(it)
    setForm({ ...it })
  }, [list])

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <div className='tabs'>
        <div className={`tab ${sub === 'list' ? 'active' : ''}`} onClick={() => setSub('list')}>
          人物列表
        </div>
        <div className={`tab ${sub === 'graph' ? 'active' : ''}`} onClick={() => setSub('graph')}>
          关系网
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {sub === 'graph' ? (
          <RelationGraph novel={novel} onOpenCharacter={openFromGraph} />
        ) : (
          <>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div className='row' style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', gap: 8 }}>
                <input
                  style={{ width: 180 }}
                  placeholder='搜索姓名/别名...'
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                <select style={{ width: 140 }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value=''>全部定位</option>
                  {ROLES.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
                <div className='grow' />
                <span className='muted'>{filtered.length}</span>
                <button className='small primary' onClick={create}>
                  「新建人物
                </button>
              </div>

              <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                {filtered.length === 0 ? (
                  <div className='empty-state'>
                    <div className='hint'>暂无人物。为角色建立设定卡片，随时查阅。</div>
                  </div>
                ) : (
                  <div
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}
                  >
                    {filtered.map((c) => (
                      <div key={c.id} className='card' style={{ cursor: 'pointer' }} onClick={() => openEdit(c)}>
                        <div className='row'>
                          <b className='grow'>{c.name}</b>
                          <span className='badge accent'>{c.role}</span>
                        </div>
                        {c.alias && <div className='meta'>{c.alias}</div>}
                        <div className='meta' style={{ marginTop: 6 }}>
                          {c.gender && <span>{c.gender}</span>}
                          {c.age && <span>{c.age}</span>}
                          {c.personality && (
                            <span>
                              {c.personality.slice(0, 18)}
                              {c.personality.length > 18 ? '...' : ''}
                            </span>
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
                  width: 400,
                  borderLeft: '1px solid var(--border)',
                  background: 'var(--bg-2)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div className='list-header'>
                  <h3>编辑人物</h3>
                  <div className='grow' />
                  <button className='ghost small' onClick={() => setForm(null)}>
                    关闭
                  </button>
                </div>
                <div
                  style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  {FIELDS.map((f) => (
                    <div className='form-field' key={f.key}>
                      <label>{f.label}</label>
                      {f.select ? (
                        <select value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                          {f.select.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      ) : f.textarea ? (
                        <textarea
                          rows={f.key === 'background' ? 5 : 3}
                          value={form[f.key] || ''}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        />
                      ) : (
                        <input
                          value={form[f.key] || ''}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}

                  <div className='list-header' style={{ padding: '8px 0', border: 'none' }}>
                    <h3>人物关系（{relations.length}）</h3>
                    <div className='grow' />
                    <button
                      className='small'
                      onClick={() =>
                        setRelForm({
                          char_a_id: form.id,
                          char_b_id: '',
                          type: '认识',
                          label: '',
                          direction: '双向',
                          description: '',
                        })
                      }
                    >
                      物关系
                    </button>
                  </div>

                  {relations.length === 0 && <div className='hint'>暂无关系。</div>}
                  {relations.map((r) => {
                    const other = r.char_a_id === form.id ? r.char_b_name : r.char_a_name
                    return (
                      <div key={r.id} className='row panel' style={{ padding: '8px 10px', background: 'var(--bg-3)' }}>
                        <div className='grow'>
                          <div className='row wrap'>
                            <b>{other}</b>
                            <span className='badge accent'>{r.type}</span>
                            <span className='badge'>{r.direction}</span>
                          </div>
                          {r.label && (
                            <div className='meta' style={{ marginTop: 2 }}>
                              {r.label}
                            </div>
                          )}
                        </div>
                        <button
                          className='ghost small danger'
                          onClick={async () => {
                            if (!(await confirm({ title: '删除关系', message: '确定删除该人物关系？', danger: true })))
                              return
                            await window.api.deleteRelation(r.id)
                            setRelations(await window.api.listRelations(novel.id, form.id))
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}

                  <div className='list-header' style={{ padding: '8px 0', border: 'none', marginTop: 4 }}>
                    <h3>出场章节（{appearances.length}）</h3>
                  </div>
                  {appearances.length === 0 && <div className='hint'>暂未在任何章节中出现。</div>}
                  {appearances.map((a) => (
                    <div key={a.chapterId} className='row panel' style={{ padding: '6px 10px', background: 'var(--bg-3)', fontSize: 13 }}>
                      <div className='grow'>
                        <b>{a.title}</b>
                        <span className='badge' style={{ marginLeft: 6 }}>{a.mentionCount} 次</span>
                      </div>
                      <span className='hint'>{a.wordCount} 字</span>
                    </div>
                  ))}
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

            {relForm && (
              <div className='modal-mask' onClick={() => setRelForm(null)}>
                <div className='modal' style={{ width: 460 }} onClick={(e) => e.stopPropagation()}>
                  <div className='modal-head'>新增人物关系</div>
                  <div className='modal-body'>
                    <div className='form-field'>
                      <label>对方人物</label>
                      <select
                        value={relForm.char_b_id}
                        onChange={(e) => setRelForm({ ...relForm, char_b_id: Number(e.target.value) })}
                      >
                        <option value=''>- 选择 -</option>
                        {list
                          .filter((c) => c.id !== form.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className='form-grid'>
                      <div className='form-field'>
                        <label>关系类型</label>
                        <input
                          list='rel-types'
                          value={relForm.type}
                          onChange={(e) => setRelForm({ ...relForm, type: e.target.value })}
                          placeholder='恋人/宿敌/师徒/朋友...'
                        />
                        <datalist id='rel-types'>
                          {[
                            '恋人',
                            '夫妻',
                            '宿敌',
                            '师徒',
                            '朋友',
                            '家人',
                            '上司下属',
                            '同盟',
                            '仇人',
                            '青梅竹马',
                            '竞争对手',
                          ].map((t) => (
                            <option key={t} value={t} />
                          ))}
                        </datalist>
                      </div>
                      <div className='form-field'>
                        <label>方向</label>
                        <select
                          value={relForm.direction}
                          onChange={(e) => setRelForm({ ...relForm, direction: e.target.value })}
                        >
                          <option>双向</option>
                          <option>单向</option>
                        </select>
                      </div>
                    </div>
                    <div className='form-field'>
                      <label>关系标签（简短）</label>
                      <input
                        value={relForm.label}
                        onChange={(e) => setRelForm({ ...relForm, label: e.target.value })}
                        placeholder='如：宿命 / 恩怨/ 暗恋'
                      />
                    </div>
                    <div className='form-field'>
                      <label>关系说明</label>
                      <textarea
                        rows={3}
                        value={relForm.description}
                        onChange={(e) => setRelForm({ ...relForm, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className='modal-foot'>
                    <button onClick={() => setRelForm(null)}>取消</button>
                    <button
                      className='primary'
                      onClick={async () => {
                        if (!relForm.char_b_id) {
                          toast('请选择对方人物', 'error')
                          return
                        }
                        await window.api.createRelation(novel.id, { ...relForm, char_a_id: form.id })
                        setRelForm(null)
                        setRelations(await window.api.listRelations(novel.id, form.id))
                        toast('已添加关系', 'success')
                      }}
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
