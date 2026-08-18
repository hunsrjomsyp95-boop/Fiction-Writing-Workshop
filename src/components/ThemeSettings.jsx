import { useState } from 'react'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'
import { useTheme, TEXT_COLORS, CURSOR_COLORS, themeToJson, parseThemeJson } from '../themes.jsx'

const SWATCH_KEYS = [
  ['bg', '背景'],
  ['bg2', '面板'],
  ['border', '边框'],
  ['accent', '强调'],
  ['text', '文字'],
  ['green', '成功'],
  ['yellow', '警告'],
  ['red', '错误'],
]

export default function ThemeSettings() {
  const toast = useToast()
  const { confirm } = useDialog()
  const { themeId, textColor, fontSize, cursorColor, custom, all, current, set, autoTheme } = useTheme()
  const [importText, setImportText] = useState('')
  const [customName, setCustomName] = useState('')
  const [customColors, setCustomColors] = useState(null)
  const [customOpen, setCustomOpen] = useState(false)

  const importTheme = async () => {
    if (!importText.trim()) {
      toast('请粘贴主题JSON', 'error')
      return
    }
    try {
      const theme = parseThemeJson(importText)
      const id = `custom-${Date.now()}`
      await set({ custom: [...custom, { ...theme, id }], themeId: id })
      setImportText('')
      toast(`已导入并应用「${theme.name}」`, 'success')
    } catch (e) {
      toast('导入失败：' + e.message, 'error')
    }
  }

  const exportTheme = async () => {
    try {
      await navigator.clipboard.writeText(themeToJson(current()))
      toast('主题 JSON 已复制到剪贴板', 'success')
    } catch (e) {
      toast('复制失败', 'error')
    }
  }

  const removeCustom = async (id) => {
    if (!(await confirm({ title: '删除自定义主题', message: '确定删除该自定义主题？', danger: true }))) return
    await set({ custom: custom.filter((t) => t.id !== id), themeId: 'default' })
    toast('已删除自定义主题', 'success')
  }

  return (
    <>
      <div className='row' style={{ margin: '4px 0' }}>
        <b style={{ fontSize: 13 }}>主题</b>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
        {all().map((t) => (
          <div
            key={t.id}
            style={{
              cursor: 'pointer',
              padding: 8,
              border: themeId === t.id ? '2px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--bg-2)',
            }}
            onClick={async () => {
              await set({ themeId: t.id })
              toast(`已切换到「${t.name}」`, 'success')
            }}
          >
            <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
              {['bg', 'bg2', 'bg3', 'accent'].map((k) => (
                <div
                  key={k}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    background: t.colors[k],
                    border: '1px solid rgba(0,0,0,0.2)',
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.name}
            </div>
            {t.id.startsWith('custom-') && (
              <button
                className='ghost small danger'
                style={{ marginTop: 4 }}
                onClick={(e) => {
                  e.stopPropagation()
                  removeCustom(t.id)
                }}
              >
                删除
              </button>
            )}
          </div>
        ))}
      </div>

      <div className='row' style={{ margin: '12px 0 6px' }}>
        <b style={{ fontSize: 13 }}>文字颜色</b>
      </div>
      <div className='row wrap' style={{ gap: 8 }}>
        {TEXT_COLORS.map((tc) => (
          <button
            key={tc.id || 'follow'}
            className={`small ${textColor === tc.id ? 'primary' : ''}`}
            onClick={async () => {
              await set({ textColor: tc.id })
              toast(`文字颜色：${tc.label}`, 'success')
            }}
          >
            {tc.colors ? <span style={{ color: tc.colors.text, fontWeight: 700 }}>A</span> : '跟随'} {tc.label}
          </button>
        ))}
      </div>

      <div className='row' style={{ margin: '12px 0 6px' }}>
        <b style={{ fontSize: 13 }}>功能区字号：{fontSize}px</b>
      </div>
      <div className='row' style={{ gap: 8 }}>
        <input
          type='range'
          min='12'
          max='20'
          step='1'
          value={fontSize}
          onChange={async (e) => await set({ fontSize: Number(e.target.value) })}
          style={{ flex: 1 }}
        />
        <span className='hint'>12 - 20 px</span>
      </div>

      <div className='row' style={{ margin: '12px 0 6px' }}>
        <b style={{ fontSize: 13 }}>输入光标颜色</b>
      </div>
      <div className='row wrap' style={{ gap: 8 }}>
        {CURSOR_COLORS.map((cc) => (
          <button
            key={cc.id || 'follow'}
            className={`small ${cursorColor === cc.id ? 'primary' : ''}`}
            onClick={async () => {
              await set({ cursorColor: cc.id })
              toast(`光标颜色：${cc.label}`, 'success')
            }}
          >
            {cc.color ? <span style={{ color: cc.color, fontWeight: 700 }}>|</span> : '跟随'} {cc.label}
          </button>
        ))}
      </div>

      <div className='row' style={{ margin: '12px 0 6px' }}>
        <b style={{ fontSize: 13 }}>自动跟随系统深色/浅色模式</b>
      </div>
      <button
        className={`small ${autoTheme ? 'primary' : ''}`}
        onClick={async () => {
          const next = !autoTheme
          await set({ autoTheme: next })
          toast(next ? '已开启跟随系统主题' : '已关闭跟随系统主题', 'success')
        }}
      >
        {autoTheme ? '已开启' : '已关闭'}
      </button>

      <div className='row' style={{ margin: '12px 0 6px' }}>
        <b style={{ fontSize: 13 }}>导入 / 导出主题模板</b>
      </div>
      <div className='hint' style={{ marginBottom: 6 }}>
        从网上获取他人发布的主题模板（JSON）粘贴导入。格式：
        <pre style={{ background: 'var(--bg-3)', padding: 8, borderRadius: 6, fontSize: 11, marginTop: 4 }}>
          {'{"name":"我的主题","colors":{"bg":"#1e1e2e","text":"#e6e6ef","accent":"#7c7cf0",...}}'}
        </pre>
      </div>
      <textarea
        rows={3}
        value={importText}
        onChange={(e) => setImportText(e.target.value)}
        placeholder='粘贴主题 JSON...'
      />
      <div className='row' style={{ marginTop: 8 }}>
        <button className='small primary' onClick={importTheme}>
          导入并应用
        </button>
        <button className='small' onClick={exportTheme}>
          复制当前主题
        </button>
        <button className='small' onClick={() => setCustomOpen((o) => !o)}>
          除自定义主题
        </button>
      </div>

      {customOpen && (
        <div
          className='panel'
          style={{ padding: 12, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <div className='row'>
            <input
              className='grow'
              placeholder='主题名称'
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
            <input
              style={{ width: 140 }}
              placeholder='背景 #1e1e2e'
              value={customColors?.bg || ''}
              onChange={(e) => setCustomColors({ ...(customColors || {}), bg: e.target.value })}
            />
          </div>
          <div className='row wrap' style={{ gap: 6 }}>
            {SWATCH_KEYS.map(([k, label]) => (
              <label key={k} className='row' style={{ gap: 4 }}>
                <span className='hint'>{label}</span>
                <input
                  type='color'
                  value={customColors?.[k] || current().colors[k]}
                  style={{ width: 34, height: 26, padding: 0 }}
                  onChange={(e) => setCustomColors({ ...(customColors || {}), [k]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <div className='row right'>
            <button
              className='small primary'
              onClick={async () => {
                if (!customName.trim()) {
                  toast('请输入主题名称', 'error')
                  return
                }
                const colors = { ...current().colors, ...(customColors || {}) }
                const id = `custom-${Date.now()}`
                await set({ custom: [...custom, { id, name: customName.trim(), colors }], themeId: id })
                setCustomName('')
                setCustomColors(null)
                setCustomOpen(false)
                toast('自定义主题已创建并应用', 'success')
              }}
            >
              创建并应用
            </button>
          </div>
        </div>
      )}
    </>
  )
}
