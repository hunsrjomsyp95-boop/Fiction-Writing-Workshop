import { useState, useEffect } from 'react'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'
import { FolderOpen, Trash2, Check, X, Eye } from 'lucide-react'

export default function SkillsPanel() {
  const toast = useToast()
  const { confirm } = useDialog()
  const [skills, setSkills] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    load()
  }, [])

  const load = async () => {
    const list = await window.api.listSkills()
    setSkills(list)
    const active = list.find(s => s.active)
    setActiveId(active?.id || null)
  }

  const handleImport = async () => {
    try {
      const skill = await window.api.importSkill()
      if (skill?.canceled) return
      toast(`已导入Skill「${skill.display_name}」`, 'success')
      load()
    } catch (e) {
      toast('导入失败：' + e.message, 'error')
    }
  }

  const handleDelete = async (id, name) => {
    if (!(await confirm({ title: '删除Skill', message: `确定删除「${name}」？`, danger: true }))) return
    await window.api.deleteSkill(id)
    toast('已删除', 'success')
    load()
  }

  const handleToggleActive = async (id) => {
    const newActive = activeId === id ? null : id
    await window.api.setActiveSkill(newActive, !!newActive)
    setActiveId(newActive)
    toast(newActive ? '已激活' : '已停用', 'success')
  }

  const handlePreview = async (skill) => {
    try {
      const full = await window.api.getSkill(skill.id)
      if (!full || !full.content) {
        setPreview('无内容')
        return
      }
      const content = JSON.parse(full.content)
      const parts = []
      if (content.skill) parts.push(`# SKILL.md\n\n${content.skill.slice(0, 1000)}`)
      if (content.files) {
        for (const [name, text] of Object.entries(content.files).slice(0, 5)) {
          parts.push(`## ${name}\n\n${text.slice(0, 300)}`)
        }
      }
      setPreview(parts.join('\n\n---\n\n') || '无内容')
    } catch (e) {
      setPreview('解析失败：' + e.message)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className='row' style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <b>Skill 管理</b>
        <button className='small primary' onClick={handleImport}>
          <FolderOpen size={14} /> 导入Skill
        </button>
      </div>
      <div className='hint'>
        导入包含 SKILL.md 和 manifest.json 的文件夹，AI 会参考其中的知识。
      </div>
      {skills.length === 0 ? (
        <div className='hint' style={{ padding: 16, textAlign: 'center' }}>暂未导入任何Skill</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {skills.map(s => (
            <div
              key={s.id}
              className='panel'
              style={{
                padding: '10px 14px',
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                border: activeId === s.id ? '1px solid var(--accent)' : undefined,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{s.display_name || s.name}</div>
                {s.description && <div className='hint' style={{ fontSize: 12, marginTop: 2 }}>{s.description.slice(0, 80)}</div>}
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                  {s.version && `v${s.version}`}
                  {s.author && ` · ${s.author}`}
                  {s.tags && ` · ${s.tags.split(',').slice(0, 3).join(' ')}`}
                </div>
              </div>
              <button className='ghost small' onClick={() => handlePreview(s)} title='预览内容'>
                <Eye size={14} />
              </button>
              <button
                className='small'
                onClick={() => handleToggleActive(s.id)}
                style={{
                  background: activeId === s.id ? 'var(--accent)' : undefined,
                  color: activeId === s.id ? '#fff' : undefined,
                }}
              >
                {activeId === s.id ? <><Check size={14} /> 已激活</> : <><X size={14} /> 未激活</>}
              </button>
              <button className='ghost small danger' onClick={() => handleDelete(s.id, s.display_name || s.name)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div className='modal-mask' onClick={() => setPreview(null)}>
          <div className='modal' style={{ width: 600, maxHeight: '70vh' }} onClick={e => e.stopPropagation()}>
            <div className='modal-head'>
              Skill 内容预览
              <div className='spacer' />
              <button className='ghost small' onClick={() => setPreview(null)}>关闭</button>
            </div>
            <div className='modal-body' style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6 }}>
              {preview}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
