import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'
import { paramsToText, textToParams } from './aiConstants.js'

export default function PromptLibraryModal({ novel, prompts, setPrompts, busy, runPrompt, onClose }) {
  const toast = useToast()
  const { confirm } = useDialog()

  const grouped = prompts.reduce((acc, p) => {
    ;(acc[p.category] = acc[p.category] || []).push(p)
    return acc
  }, {})

  return (
    <div className='modal-mask'>
      <div className='modal' style={{ width: 680 }} onClick={(e) => e.stopPropagation()}>
        <div className='modal-head'>
          提示词库
          <div className='spacer' />
          <button className='ghost small' onClick={onClose}>关闭</button>
        </div>
        <div className='modal-body' style={{ maxHeight: '62vh' }}>
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <div className='row' style={{ margin: '4px 0' }}>
                <b style={{ fontSize: 13 }}>{cat}</b>
                <span className='badge'>{items.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map((p) => (
                  <div key={p.id} className='row panel' style={{ padding: '8px 12px', background: 'var(--bg-3)' }}>
                    <div className='grow'>
                      <div className='row'>
                        <b>{p.name}</b>
                        {p.builtin ? <span className='badge accent'>内置</span> : <span className='badge green'>自定义</span>}
                      </div>
                      <div className='hint' style={{ marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.user_prompt}
                      </div>
                    </div>
                    <button className='small primary' disabled={busy} onClick={() => { onClose(); runPrompt(p) }}>
                      运行
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function PromptEditModal({ novel, prompt: editPrompt, setPrompt: setEditPrompt, prompts, setPrompts, onClose }) {
  const toast = useToast()
  const { confirm } = useDialog()

  return (
    <div className='modal-mask'>
      <div className='modal' style={{ width: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className='modal-head'>{editPrompt.id ? '编辑提示词' : '新建提示词'}</div>
        <div className='modal-body'>
          <div className='form-grid'>
            <div className='form-field'>
              <label>名称</label>
              <input value={editPrompt.name} onChange={(e) => setEditPrompt({ ...editPrompt, name: e.target.value })} />
            </div>
            <div className='form-field'>
              <label>分类</label>
              <input list='prompt-cats' value={editPrompt.category} onChange={(e) => setEditPrompt({ ...editPrompt, category: e.target.value })} />
              <datalist id='prompt-cats'>
                {['通用', '大纲', '正文', '人物', '世界观', '文笔', '构建', '结构'].map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
          <div className='form-field'>
            <label>系统提示词（角色设定）</label>
            <textarea rows={3} value={editPrompt.system_prompt} onChange={(e) => setEditPrompt({ ...editPrompt, system_prompt: e.target.value })} />
          </div>
          <div className='form-field'>
            <label>{`用户提示词（支持变量：{正文} {题材} {字数} {灵感} {样本} {标题} 等）`}</label>
            <textarea rows={5} value={editPrompt.user_prompt} onChange={(e) => setEditPrompt({ ...editPrompt, user_prompt: e.target.value })} />
          </div>
          <div className='form-field'>
            <label>{`参数定义（可选，每行一个：key|类型|标签|默认值|选项逗号分隔）`}</label>
            <textarea
              rows={4}
              value={paramsToText(editPrompt.params)}
              onChange={(e) => setEditPrompt({ ...editPrompt, params: textToParams(e.target.value) })}
              placeholder={'style|select|风格倾向|保持原味|保持原味,华丽典雅,精炼简洁\ncount|number|数量|5|1-12\nsample|textarea|文风样本||'}
            />
            <div className='hint'>类型：text / textarea / number / select / multiSelect。模板中用{`{key}`} 引用；number 默认值写 3-8 表示 min-max。</div>
          </div>
        </div>
        <div className='modal-foot'>
          {editPrompt.id && (
            <button className='danger' onClick={async () => {
              if (!(await confirm({ title: '删除提示词', message: '确定删除该提示词？', danger: true }))) return
              await window.api.deletePrompt(editPrompt.id)
              setEditPrompt(null)
              setPrompts(await window.api.listPrompts(novel.id))
              toast('已删除', 'success')
            }}>删除</button>
          )}
          <div className='grow' />
          <button onClick={onClose}>取消</button>
          <button className='primary' onClick={async () => {
            if (!editPrompt.name.trim()) { toast('请输入名称', 'error'); return }
            if (editPrompt.id) await window.api.updatePrompt(editPrompt.id, editPrompt)
            else await window.api.createPrompt(novel.id, editPrompt)
            setEditPrompt(null)
            setPrompts(await window.api.listPrompts(novel.id))
            toast('已保存', 'success')
          }}>保存</button>
        </div>
      </div>
    </div>
  )
}

export function PromptParamsModal({ runningPrompt, paramValues, setParamValues, onClose, onRun }) {
  return (
    <div className='modal-mask'>
      <div className='modal' style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className='modal-head'>{runningPrompt.name} · 参数</div>
        <div className='modal-body'>
          {runningPrompt.params.map((p) => (
            <div className='form-field' key={p.key}>
              <label>{p.label || p.key}</label>
              {p.type === 'select' ? (
                <select value={paramValues[p.key] || ''} onChange={(e) => setParamValues({ ...paramValues, [p.key]: e.target.value })}>
                  {(p.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : p.type === 'multiSelect' ? (
                <div className='row wrap' style={{ gap: 6 }}>
                  {(p.options || []).map((o) => {
                    const arr = paramValues[p.key] || []
                    const on = arr.includes(o)
                    return (
                      <button key={o} className={`small ${on ? 'primary' : ''}`} onClick={() => {
                        const next = on ? arr.filter((x) => x !== o) : [...arr, o]
                        setParamValues({ ...paramValues, [p.key]: next })
                      }}>{o}</button>
                    )
                  })}
                </div>
              ) : p.type === 'number' ? (
                <div className='row'>
                  <input type='number' min={p.min} max={p.max} step={p.step} value={paramValues[p.key] ?? ''} onChange={(e) => setParamValues({ ...paramValues, [p.key]: e.target.value })} />
                  {p.unit && <span className='muted'>{p.unit}</span>}
                </div>
              ) : p.type === 'textarea' ? (
                <textarea rows={3} value={paramValues[p.key] || ''} placeholder={p.placeholder || ''} onChange={(e) => setParamValues({ ...paramValues, [p.key]: e.target.value })} />
              ) : (
                <input value={paramValues[p.key] || ''} placeholder={p.placeholder || ''} onChange={(e) => setParamValues({ ...paramValues, [p.key]: e.target.value })} />
              )}
            </div>
          ))}
        </div>
        <div className='modal-foot'>
          <button onClick={onClose}>取消</button>
          <button className='primary' onClick={onRun}>生成</button>
        </div>
      </div>
    </div>
  )
}
