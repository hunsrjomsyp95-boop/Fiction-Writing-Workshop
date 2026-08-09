import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'

// 可绑定动作清单
export const ACTIONS = [
  { key: 'save_chapter', label: '保存当前章节', group: '写作', defaultKey: 'ctrl+s' },
  { key: 'new_chapter', label: '新建章节', group: '写作', defaultKey: 'ctrl+n' },
  { key: 'snapshot', label: '保存版本快照', group: '写作', defaultKey: 'ctrl+shift+s' },
  { key: 'reading_mode', label: '切换阅读模式', group: '写作', defaultKey: 'ctrl+r' },
  { key: 'full_search', label: '全文搜索', group: '全局', defaultKey: 'ctrl+shift+f' },
  { key: 'data_menu', label: '数据管理', group: '全局', defaultKey: 'ctrl+shift+d' },
  { key: 'ai_settings', label: 'AI 设置', group: '全局', defaultKey: 'ctrl+,' },
  { key: 'shortcut_settings', label: '快捷键设置', group: '全局', defaultKey: 'ctrl+shift+k' },
  { key: 'account', label: '账号管理', group: '全局', defaultKey: 'ctrl+shift+a' },
  { key: 'lock', label: '锁定软件', group: '全局', defaultKey: 'ctrl+shift+l' },
  { key: 'tab_chapters', label: '切到章节', group: '导航', defaultKey: 'ctrl+1' },
  { key: 'tab_think', label: '切到 AI 思考', group: '导航', defaultKey: 'ctrl+9' },
  { key: 'tab_outline', label: '切到大纲', group: '导航', defaultKey: 'ctrl+2' },
  { key: 'tab_characters', label: '切到人物', group: '导航', defaultKey: 'ctrl+3' },
  { key: 'tab_worlds', label: '切到世界观', group: '导航', defaultKey: 'ctrl+4' },
  { key: 'tab_foreshadow', label: '切到伏笔', group: '导航', defaultKey: 'ctrl+5' },
  { key: 'tab_timeline', label: '切到年表', group: '导航', defaultKey: 'ctrl+6' },
  { key: 'tab_materials', label: '切到资料库', group: '导航', defaultKey: 'ctrl+7' },
  { key: 'tab_stats', label: '切到统计', group: '导航', defaultKey: 'ctrl+8' },
  { key: 'tab_mindmap', label: '切到思维导图', group: '导航', defaultKey: 'ctrl+0' },
]

export function getDefaultMap() {
  const m = {}
  for (const a of ACTIONS) m[a.key] = a.defaultKey
  return m
}

const SPECIAL = {
  ' ': 'space',
  Enter: 'enter',
  Escape: 'esc',
  Tab: 'tab',
  Backspace: 'backspace',
  Delete: 'delete',
  Insert: 'insert',
  Home: 'home',
  End: 'end',
  PageUp: 'pageup',
  PageDown: 'pagedown',
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

// 从键盘事件构造组合键标识，如 'ctrl+shift+s'
export function buildCombo(e) {
  const parts = []
  if (e.ctrlKey || e.metaKey) parts.push('ctrl')
  if (e.shiftKey) parts.push('shift')
  if (e.altKey) parts.push('alt')
  let key = null
  const k = e.key
  if (SPECIAL[k]) key = SPECIAL[k]
  else if (/^F\d{1,2}$/.test(k)) key = k.toLowerCase()
  else if (k && k.length === 1) key = k.toLowerCase()
  if (!key) return null
  parts.push(key)
  return parts.join('+')
}

// 显示格式：ctrl+shift+s → Ctrl+Shift+S
export function formatKey(combo) {
  if (!combo) return '未设置'
  return combo
    .split('+')
    .map((p) =>
      p === 'ctrl'
        ? 'Ctrl'
        : p === 'shift'
          ? 'Shift'
          : p === 'alt'
            ? 'Alt'
            : p.length === 1
              ? p.toUpperCase()
              : p[0].toUpperCase() + p.slice(1)
    )
    .join('+')
}

const ShortcutCtx = createContext(null)
export const useShortcuts = () => useContext(ShortcutCtx)

export function ShortcutProvider({ children }) {
  const [map, setMap] = useState(null)
  const mapRef = useRef(map)
  mapRef.current = map

  useEffect(() => {
    window.api.getShortcuts().then((v) => {
      const def = getDefaultMap()
      setMap(v && Object.keys(v).length ? { ...def, ...v } : def)
    })
  }, [])

  const setKey = useCallback(async (action, combo) => {
    const next = { ...mapRef.current, [action]: combo }
    setMap(next)
    await window.api.setShortcuts(next)
  }, [])

  const reset = useCallback(async () => {
    const def = getDefaultMap()
    setMap(def)
    await window.api.setShortcuts(def)
  }, [])

  // 全局按键分发
  useEffect(() => {
    if (!map) return
    const handler = (e) => {
      if (e.defaultPrevented) return
      const combo = buildCombo(e)
      if (!combo) return
      // 普通字符无修饰键不触发，避免打字误触
      const hasMod = e.ctrlKey || e.metaKey || e.altKey
      if (
        !hasMod &&
        !/^(f\d|space|enter|esc|tab|backspace|delete|insert|home|end|pageup|pagedown|up|down|left|right)$/.test(combo)
      )
        return
      for (const [action, c] of Object.entries(map)) {
        if (c && c.toLowerCase() === combo) {
          e.preventDefault()
          e.stopPropagation()
          window.dispatchEvent(new CustomEvent('shortcut-run', { detail: action }))
          return
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [map])

  if (!map) return null
  return <ShortcutCtx.Provider value={{ map, setKey, reset, actions: ACTIONS }}>{children}</ShortcutCtx.Provider>
}

// 在组件内绑定某动作的处理函数
export function useShortcutRun(action, handler) {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    const h = (e) => {
      if (e.detail === action) ref.current?.()
    }
    window.addEventListener('shortcut-run', h)
    return () => window.removeEventListener('shortcut-run', h)
  }, [action])
}
