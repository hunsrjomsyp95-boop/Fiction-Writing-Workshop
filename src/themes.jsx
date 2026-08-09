import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export const THEMES = [
  {
    id: 'default',
    name: '默认暗紫',
    colors: {
      bg: '#1e1e2e',
      bg2: '#252536',
      bg3: '#2f2f42',
      bgHover: '#343448',
      border: '#3b3b52',
      text: '#e6e6ef',
      dim: '#a0a0b8',
      faint: '#6c6c85',
      accent: '#7c7cf0',
      accent2: '#5ba3ff',
      green: '#58c47b',
      yellow: '#e5b567',
      red: '#e06c75',
      orange: '#d19a66',
      cyan: '#56b6c2',
    },
  },
  {
    id: 'eye',
    name: '护眼模式',
    colors: {
      bg: '#f7f4ea',
      bg2: '#efebdc',
      bg3: '#e5deca',
      bgHover: '#ddd3ba',
      border: '#d0c7a8',
      text: '#3d3d34',
      dim: '#6b6759',
      faint: '#9b977f',
      accent: '#6b8f3a',
      accent2: '#5a7a3a',
      green: '#5c8a4a',
      yellow: '#b58a3a',
      red: '#a0523a',
      orange: '#b0763a',
      cyan: '#3a7a6a',
    },
  },
  {
    id: 'magma',
    name: '岩浆红',
    colors: {
      bg: '#1c1210',
      bg2: '#291a16',
      bg3: '#3a241e',
      bgHover: '#472b23',
      border: '#5a3a30',
      text: '#f0d8cc',
      dim: '#c0a294',
      faint: '#8a6e62',
      accent: '#ff6b4a',
      accent2: '#ff8c4a',
      green: '#ffaa4a',
      yellow: '#ffd24a',
      red: '#ff3b3b',
      orange: '#ff7043',
      cyan: '#ff9a4a',
    },
  },
  {
    id: 'ocean',
    name: '深海蓝',
    colors: {
      bg: '#0b1526',
      bg2: '#12203a',
      bg3: '#1a2e52',
      bgHover: '#213a66',
      border: '#2c4a7a',
      text: '#dce8f5',
      dim: '#a0b8d0',
      faint: '#607890',
      accent: '#3aa0ff',
      accent2: '#5ab8ff',
      green: '#4ad1a0',
      yellow: '#e5c060',
      red: '#ff5a5a',
      orange: '#ff9a4a',
      cyan: '#4ad8ff',
    },
  },
  {
    id: 'gold',
    name: '闪耀金',
    colors: {
      bg: '#1a1608',
      bg2: '#2a2410',
      bg3: '#3a3218',
      bgHover: '#4a3f1e',
      border: '#6a5a2a',
      text: '#f5e8c0',
      dim: '#c0b080',
      faint: '#807040',
      accent: '#ffc83a',
      accent2: '#ffd66a',
      green: '#c0e04a',
      yellow: '#ffe08a',
      red: '#ff7a4a',
      orange: '#ffb04a',
      cyan: '#ffd24a',
    },
  },
  {
    id: 'mint',
    name: '清新绿',
    colors: {
      bg: '#eef5ee',
      bg2: '#e0ece0',
      bg3: '#d0e0d0',
      bgHover: '#c4d8c4',
      border: '#a8c8a8',
      text: '#223822',
      dim: '#4a6a4a',
      faint: '#7a9a7a',
      accent: '#3aa05a',
      accent2: '#5ab87a',
      green: '#3aa05a',
      yellow: '#b0a03a',
      red: '#d06050',
      orange: '#c0803a',
      cyan: '#3a9aa0',
    },
  },
  {
    id: 'sunshine',
    name: '阳光橙',
    colors: {
      bg: '#1f1408',
      bg2: '#2d1e0e',
      bg3: '#3d2a16',
      bgHover: '#4d361e',
      border: '#6a4e2a',
      text: '#f5e6d0',
      dim: '#c0a080',
      faint: '#806040',
      accent: '#ff8c2a',
      accent2: '#ffa94a',
      green: '#8ac04a',
      yellow: '#ffc84a',
      red: '#ff5a3a',
      orange: '#ff8c2a',
      cyan: '#4ac0d0',
    },
  },
  {
    id: 'ultramarine',
    name: '群青蓝',
    colors: {
      bg: '#0a0e1a',
      bg2: '#111830',
      bg3: '#1a2448',
      bgHover: '#223060',
      border: '#2e3e78',
      text: '#d8e0f5',
      dim: '#90a0c8',
      faint: '#5868a0',
      accent: '#4a6aff',
      accent2: '#6a8aff',
      green: '#4ad080',
      yellow: '#e0c040',
      red: '#ff4a6a',
      orange: '#ff8a4a',
      cyan: '#4ac8ff',
    },
  },
]

export const TEXT_COLORS = [
  { id: '', label: '跟随主题', colors: null },
  { id: 'black', label: '黑字', colors: { text: '#1f1f1f', dim: '#555555', faint: '#999999' } },
  { id: 'white', label: '白字', colors: { text: '#f0f0f0', dim: '#c0c0c0', faint: '#909090' } },
  { id: 'neon', label: '荧光绿', colors: { text: '#00ff66', dim: '#33cc77', faint: '#66aa88' } },
]

export const CURSOR_COLORS = [
  { id: '', label: '跟随主题', color: null },
  { id: 'white', label: '白色', color: '#ffffff' },
  { id: 'black', label: '黑色', color: '#000000' },
  { id: 'neon', label: '荧光绿', color: '#00ff66' },
  { id: 'red', label: '红色', color: '#ff4444' },
  { id: 'cyan', label: '青色', color: '#00ffff' },
]

const VAR_KEYS = [
  'bg',
  'bg2',
  'bg3',
  'bgHover',
  'border',
  'text',
  'dim',
  'faint',
  'accent',
  'accent2',
  'green',
  'yellow',
  'red',
  'orange',
  'cyan',
]

export function applyThemeVars(theme, textColorId, fontSize, cursorColor) {
  const root = document.documentElement
  root.dataset.theme = theme.id
  const c = theme.colors
  root.style.setProperty('--bg', c.bg)
  root.style.setProperty('--bg-2', c.bg2)
  root.style.setProperty('--bg-3', c.bg3)
  root.style.setProperty('--bg-hover', c.bgHover)
  root.style.setProperty('--border', c.border)
  const tc = TEXT_COLORS.find((t) => t.id === textColorId)
  if (tc && tc.colors) {
    root.style.setProperty('--text', tc.colors.text)
    root.style.setProperty('--text-dim', tc.colors.dim)
    root.style.setProperty('--text-faint', tc.colors.faint)
  } else {
    root.style.setProperty('--text', c.text)
    root.style.setProperty('--text-dim', c.dim)
    root.style.setProperty('--text-faint', c.faint)
  }
  root.style.setProperty('--accent', c.accent)
  root.style.setProperty('--accent-2', c.accent2)
  root.style.setProperty('--green', c.green)
  root.style.setProperty('--yellow', c.yellow)
  root.style.setProperty('--red', c.red)
  root.style.setProperty('--orange', c.orange)
  root.style.setProperty('--cyan', c.cyan)
  root.style.setProperty('--font-size', `${fontSize}px`)
  const cc = CURSOR_COLORS.find((c) => c.id === cursorColor)
  root.style.setProperty('--cursor-color', (cc && cc.color) || c.accent)
}

const ThemeCtx = createContext(null)
export const useTheme = () => useContext(ThemeCtx)

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState('default')
  const [textColor, setTextColor] = useState('')
  const [fontSize, setFontSize] = useState(14)
  const [cursorColor, setCursorColor] = useState('')
  const [custom, setCustom] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [autoTheme, setAutoTheme] = useState(false)

  useEffect(() => {
    ;(async () => {
      const [tid, tc, fs, cc, ct, at] = await Promise.all([
        window.api.getSetting('theme_id', 'default'),
        window.api.getSetting('text_color', ''),
        window.api.getSetting('font_size', '14'),
        window.api.getSetting('cursor_color', ''),
        window.api.getSetting('custom_themes', '[]'),
        window.api.getSetting('auto_theme', '0'),
      ])
      setAutoTheme(at === '1')
      let initialThemeId = tid || 'default'
      if (at === '1') {
        initialThemeId = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'default' : 'eye'
      }
      setThemeId(initialThemeId)
      setTextColor(tc || '')
      setFontSize(Number(fs) || 14)
      setCursorColor(cc || '')
      try {
        setCustom(JSON.parse(ct || '[]'))
      } catch (e) {
        setCustom([])
      }
      setLoaded(true)
    })()
  }, [])

  useEffect(() => {
    if (!loaded || !autoTheme) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setThemeId(e.matches ? 'default' : 'eye')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [loaded, autoTheme])

  const all = useCallback(() => [...THEMES, ...custom], [custom])
  const current = useCallback(() => all().find((t) => t.id === themeId) || THEMES[0], [all, themeId])

  useEffect(() => {
    if (!loaded) return
    applyThemeVars(current(), textColor, fontSize, cursorColor)
  }, [loaded, current, textColor, fontSize, cursorColor])

  const set = useCallback(async (patch) => {
    if (patch.autoTheme !== undefined) {
      setAutoTheme(patch.autoTheme)
      await window.api.setSetting('auto_theme', patch.autoTheme ? '1' : '0')
      if (patch.autoTheme) {
        setThemeId(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'default' : 'eye')
      }
    }
    if (patch.themeId !== undefined) {
      setThemeId(patch.themeId)
      await window.api.setSetting('theme_id', patch.themeId)
    }
    if (patch.textColor !== undefined) {
      setTextColor(patch.textColor)
      await window.api.setSetting('text_color', patch.textColor)
    }
    if (patch.fontSize !== undefined) {
      setFontSize(patch.fontSize)
      await window.api.setSetting('font_size', String(patch.fontSize))
    }
    if (patch.cursorColor !== undefined) {
      setCursorColor(patch.cursorColor)
      await window.api.setSetting('cursor_color', patch.cursorColor)
    }
    if (patch.custom !== undefined) {
      setCustom(patch.custom)
      await window.api.setSetting('custom_themes', JSON.stringify(patch.custom))
    }
  }, [])

  useEffect(() => {
    if (!loaded) return
    const handler = (e) => {
      const btn = e.target.closest('button')
      if (!btn) return
      const rect = btn.getBoundingClientRect()
      const r = document.createElement('span')
      r.className = 'ripple'
      const sz = Math.max(rect.width, rect.height)
      r.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX - rect.left - sz / 2}px;top:${e.clientY - rect.top - sz / 2}px`
      btn.appendChild(r)
      setTimeout(() => r.remove(), 600)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [loaded])

  return (
    <ThemeCtx.Provider
      value={{ themeId, textColor, fontSize, cursorColor, custom, all, current, set, autoTheme, setAutoTheme }}
    >
      {children}
    </ThemeCtx.Provider>
  )
}

// 主题 → 可分享的 JSON 文本
export function themeToJson(theme) {
  return JSON.stringify({ name: theme.name, colors: theme.colors }, null, 2)
}

// 解析导入的主题（校验结构）
export function parseThemeJson(text) {
  const obj = JSON.parse(text)
  if (!obj || typeof obj !== 'object' || !obj.name || !obj.colors || typeof obj.colors !== 'object') {
    throw new Error('格式无效：需要 {"name":"主题名", "colors":{"bg":"#...","text":"#..."}}')
  }
  const colors = {}
  for (const k of VAR_KEYS) colors[k] = obj.colors[k]
  // 补齐缺失变量为默认
  const def = THEMES[0].colors
  for (const k of VAR_KEYS) if (!colors[k]) colors[k] = def[k]
  return { name: String(obj.name).slice(0, 30), colors }
}
