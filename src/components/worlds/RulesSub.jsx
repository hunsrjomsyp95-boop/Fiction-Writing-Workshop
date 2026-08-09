import { useState, useEffect } from 'react'
import { Anchor, Wand2 } from 'lucide-react'
import { useToast } from '../../ToastContext.jsx'
import { useDialog } from '../../Dialog.jsx'

const ERAS = ['架空', '先秦', '秦汉三国', '魏晋南北朝', '隋唐五代', '两宋辽金', '元明', '明清', '民国', '近现代']
const TYPES = ['史实', '架空']

export default function RulesSub({ novel }) {
  const toast = useToast()
  const { prompt, confirm } = useDialog()
  const [list, setList] = useState([])
  const [eras, setEras] = useState(ERAS.slice())
  const [era, setEra] = useState('架空')
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    const [e, custom] = await Promise.all([window.api.listRuleEras(novel.id), window.api.getCustomRuleEras(novel.id)])
    const ns = [...new Set([...ERAS, ...e, ...custom])]
    setEras(ns)
    setEra((cur) => (cur && ns.includes(cur) ? cur : ns[0]))
    setList(await window.api.listWorldRules(novel.id, era))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [novel.id, era])

  const addEra = async () => {
    const name = await prompt({ title: '新建时代/领域', value: '', placeholder: '如：修仙界/ 大唐 / 蒸汽时代' })
    if (!name) return
    const saved = await window.api.addCustomRuleEra(novel.id, name)
    setEras([...new Set([...ERAS, ...saved])])
    setEra(name)
    toast(`已创建领域「${name}」，现在可以添加规则了`, 'success')
  }

  const create = async () => {
    const item = await prompt({ title: '规则条目', value: '', placeholder: '如：使用铜钱，无银票 / 修行到筑基需百年' })
    if (!item) return
    const type = (await prompt({ title: '类型', value: '史实' })) === '架空' ? '架空' : '史实'
    const it = await window.api.createWorldRule(novel.id, { era, item, type })
    setList(await window.api.listWorldRules(novel.id, era))
    setForm({ ...it })
  }

  const save = async () => {
    if (!form?.item.trim()) {
      toast('条目不能为空', 'error')
      return
    }
    await window.api.updateWorldRule(form.id, form)
    setList(await window.api.listWorldRules(novel.id, era))
    setForm(null)
    toast('已保存', 'success')
  }

  const del = async (id) => {
    if (!(await confirm({ title: '删除规则', message: '确定删除该规则？', danger: true }))) return
    await window.api.deleteWorldRule(id)
    load()
  }

  const toggleVerify = async (r) => {
    await window.api.updateWorldRule(r.id, { verified: r.verified ? 0 : 1 })
    load()
  }

  const aiSuggest = async () => {
    setBusy(true)
    try {
      const [worlds, items] = await Promise.all([window.api.listWorlds(novel.id), window.api.listItems(novel.id)])
      const ctx = [
        `【时代领域：${era}`,
        worlds.length
          ? `【世界设定】${worlds
              .map((w) => `${w.name}${w.content || ''}`)
              .join('\n')
              .slice(0, 10000)}`
          : '',
        items.length
          ? `【物品】${items
              .map((i) => `${i.name}${i.description || ''}`)
              .join('\n')
              .slice(0, 4000)}`
          : '',
      ]
        .filter(Boolean)
        .join('\n\n')
      const res = await window.api.aiAssistantWithSystem(
        '你是历史考据与世界观一致性专家。基于用户提供的时代/领域与现有设定，给出「真实与幻想」规则清单。每条规则格式：【史实】或【架空】 条目 + 说明。史实规则用于锚定不能违背的历史细节，架空规则声明允许的改动。只输出规则清单。',
        `请为时代「${era}」生成8-15 条规则：\n\n${ctx}`,
        ''
      )
      toast('规则建议已生成，请手动录入想要的条目', 'success')
      setForm({ era, item: '', type: '史实', content: res.content })
    } catch (e) {
      toast('生成失败：' + e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='main' style={{ flex: 1 }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div className='row wrap' style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', gap: 8 }}>
          <span className='muted'>时代/领域：</span>
          <select style={{ width: 150 }} value={era} onChange={(e) => setEra(e.target.value)}>
            {eras.map((e) => (
              <option key={e}>{e}</option>
            ))}
          </select>
          <button className='small' onClick={addEra}>
            更新领域
          </button>
          <div className='grow' />
          <button className='small' onClick={aiSuggest} disabled={busy}>
            {busy ? '生成版..' : 'AI 规则建议'}
          </button>
          <button className='small primary' onClick={create}>
            已新规则
          </button>
        </div>

        <div className='row wrap' style={{ padding: '6px 16px', gap: 8 }}>
          <span className='badge red'>
            <Anchor size={12} /> 史实锚点（不可违背）
          </span>
          <span className='badge green'>
            <Wand2 size={12} /> 架空改造（允许改动）
          </span>
          <span className='hint'>这些规则会在 AI 写作时作为「真实与幻想」约束附加给模型。</span>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {list.length === 0 ? (
            <div className='empty-state'>
              <div className='hint'>
                记录「真实与幻想」规则：史实锚点锚定不能违背的历史现实细节，架空改造声明你的世界允许哪些改动。
                <br />
                写作时AI 会强制遵守这些规则，避免时代错乱或设定漂移。
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 760 }}>
              {list.map((r) => (
                <div
                  key={r.id}
                  className='row panel'
                  style={{ padding: '10px 14px', background: 'var(--bg-3)', alignItems: 'flex-start' }}
                >
                  <div className='grow' style={{ minWidth: 0 }} onClick={() => setForm({ ...r })}>
                    <div className='row wrap'>
                      <span className={`badge ${r.type === '史实' ? 'red' : 'green'}`}>
                        {r.type === '史实' ? (
                          <>
                            <Anchor size={12} /> 史实
                          </>
                        ) : (
                          <>
                            <Wand2 size={12} /> 架空
                          </>
                        )}
                      </span>
                      <b>{r.item}</b>
                      {r.verified ? (
                        <span className='badge accent'>已核实</span>
                      ) : (
                        <span className='badge'>待核实</span>
                      )}
                    </div>
                    {r.content && (
                      <div className='meta' style={{ marginTop: 4, lineHeight: 1.6 }}>
                        {r.content}
                      </div>
                    )}
                  </div>
                  <button className='ghost small' onClick={() => toggleVerify(r)} title='标记核实状态'>
                    {r.verified ? '未核实' : '已核实'}
                  </button>
                  <button className='ghost small danger' onClick={() => del(r.id)}>
                    ×
                  </button>
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
            <h3>编辑规则</h3>
            <div className='grow' />
            <button className='ghost small' onClick={() => setForm(null)}>
              关闭
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className='form-grid'>
              <div className='form-field'>
                <label>时代/领域</label>
                <input value={form.era} onChange={(e) => setForm({ ...form, era: e.target.value })} />
              </div>
              <div className='form-field'>
                <label>类型</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className='form-field'>
              <label>条目</label>
              <input value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} />
            </div>
            <div className='form-field'>
              <label>说明</label>
              <textarea
                rows={12}
                value={form.content || ''}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder='规则说明：何时适用、不允许违背的细节，或允许的改动范围...'
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
