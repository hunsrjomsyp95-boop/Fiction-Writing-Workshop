import { useState } from 'react'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { useDialog } from '../Dialog.jsx'

export default function MobileFormView({ title, fields, data, onSave, onDelete, onBack, toast }) {
  const [formData, setFormData] = useState(data || {})
  const [saving, setSaving] = useState(false)
  const { confirm } = useDialog()

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(formData)
      toast('保存成功', 'success')
    } catch (err) {
      toast('保存失败: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    if (!(await confirm({ title: '删除确认', message: '确定删除？此操作不可恢复。', danger: true }))) return
    try {
      await onDelete()
      toast('已删除', 'success')
      onBack()
    } catch (err) {
      toast('删除失败: ' + err.message, 'error')
    }
  }

  return (
    <div className="mobile-form-view">
      {/* 顶部栏 */}
      <div className="mobile-form-header">
        <button className="mobile-back-btn" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <h2 className="mobile-form-title">{title}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {onDelete && (
            <button className="mobile-btn-icon danger" onClick={handleDelete}>
              <Trash2 size={20} />
            </button>
          )}
          <button 
            className="mobile-btn-icon primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={20} />
          </button>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="mobile-form-body">
        {fields.map(field => (
          <div key={field.key} className="mobile-form-group">
            <label className="mobile-form-label">{field.label}</label>
            {field.type === 'text' && (
              <input
                className="mobile-input"
                value={formData[field.key] || ''}
                onChange={e => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            )}
            {field.type === 'textarea' && (
              <textarea
                className="mobile-textarea"
                value={formData[field.key] || ''}
                onChange={e => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={field.rows || 4}
              />
            )}
            {field.type === 'select' && (
              <select
                className="mobile-select"
                value={formData[field.key] || ''}
                onChange={e => handleChange(field.key, e.target.value)}
              >
                {field.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
            {field.hint && <div className="mobile-form-hint">{field.hint}</div>}
          </div>
        ))}
      </div>

      {/* 底部按钮 */}
      <div className="mobile-form-footer">
        <button className="mobile-btn secondary" onClick={onBack}>取消</button>
        <button className="mobile-btn" onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  )
}