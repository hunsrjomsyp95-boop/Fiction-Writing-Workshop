import { forwardRef, useEffect, useRef, useState } from 'react'

// CodeMirror 懒加载（共享 Promise 避免并发重复加载）
let cmModules = null
let cmModulesPromise = null
async function loadCodeMirror() {
  if (cmModules) return cmModules
  if (!cmModulesPromise) {
    cmModulesPromise = Promise.all([
      import('@codemirror/state'),
      import('@codemirror/view'),
      import('@codemirror/commands'),
      import('@codemirror/lang-markdown'),
      import('@codemirror/language'),
      import('@codemirror/search'),
    ]).then(([state, view, commands, lang, language, search]) => {
      cmModules = {
        EditorState: state.EditorState,
        Compartment: state.Compartment,
        StateEffect: state.StateEffect,
        StateField: state.StateField,
        EditorView: view.EditorView,
        keymap: view.keymap,
        Decoration: view.Decoration,
        ViewPlugin: view.ViewPlugin,
        highlightActiveLine: view.highlightActiveLine,
        defaultKeymap: commands.defaultKeymap,
        history: commands.history,
        historyKeymap: commands.historyKeymap,
        indentWithTab: commands.indentWithTab,
        markdown: lang.markdown,
        syntaxHighlighting: language.syntaxHighlighting,
        defaultHighlightStyle: language.defaultHighlightStyle,
        searchKeymap: search.searchKeymap,
        highlightSelectionMatches: search.highlightSelectionMatches,
        openSearchPanel: search.openSearchPanel,
      }
      return cmModules
    })
  }
  return cmModulesPromise
}

/**
 * 代码编辑器组件
 * 
 * 基于CodeMirror 6的Markdown编辑器，支持以下功能：
 * - 语法高亮和行号显示
 * - 错字和敏感词标记（通过marks属性）
 * - 实时保存和输入统计
 * - 光标位置和选区变化回调
 * - 快捷键支持（撤销、重做、搜索等）
 * 
 * @param {string} value - 编辑器内容
 * @param {Function} onChange - 内容变化回调
 * @param {Array} marks - 标记数组，用于高亮错字和敏感词
 * @param {boolean} readOnly - 是否只读（未使用）
 * @param {Function} onCaretChange - 光标位置变化回调
 * @param {Function} onTyping - 输入统计回调
 * @param {Function} onSelectionChange - 选区变化回调
 * @param {Object} ref - 转发的ref，用于访问编辑器实例
 */
const Editor = forwardRef(function Editor(
  { value, onChange, marks = [], readOnly: _readOnly = false, onCaretChange, onTyping, onSelectionChange, onWikiLink, fontSize = 16, lineHeight = 1.8 },
  ref
) {
  const wrapRef = useRef(null)
  const viewRef = useRef(null)
  const [ready, setReady] = useState(false)
  const marksComp = useRef(null)
  const marksEffect = useRef(null)
  const marksField = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onCaretRef = useRef(onCaretChange)
  onCaretRef.current = onCaretChange
  const onTypingRef = useRef(onTyping)
  onTypingRef.current = onTyping
  const onSelectionRef = useRef(onSelectionChange)
  onSelectionRef.current = onSelectionChange
  const onWikiLinkRef = useRef(onWikiLink)
  onWikiLinkRef.current = onWikiLink
  const typingRef = useRef({ skip: 0, pending: 0 })

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onPaste = () => {
      typingRef.current.skip++
    }
    el.addEventListener('paste', onPaste)
    const onCut = () => {
      typingRef.current.skip++
    }
    el.addEventListener('cut', onCut)
    return () => {
      el.removeEventListener('paste', onPaste)
      el.removeEventListener('cut', onCut)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function init() {
      const cm = await loadCodeMirror()
      if (cancelled || !wrapRef.current || viewRef.current) return

      // 初始化 marks 相关
      marksEffect.current = cm.StateEffect.define()
      marksField.current = cm.StateField.define({
        create: () => cm.Decoration.none,
        update: (marks, tr) => {
          marks = marks.map(tr.changes)
          for (const e of tr.effects) if (e.is(marksEffect.current)) marks = e.value
          return marks
        },
        provide: (f) => cm.EditorView.decorations.from(f),
      })
      marksComp.current = new cm.Compartment()

      // eslint-disable-next-line no-unused-vars
      function buildDecorations(marksArr) {
        const d = []
        for (const m of marksArr) {
          const cls = m.kind === 'sensitive' ? 'sensitive-mark' : 'typo-mark'
          const prefix = m.kind === 'sensitive' ? '敏感词：' : '建议先'
          const deco = cm.Decoration.mark({
            class: cls,
            attributes: { title: `${prefix}${m.right || m.note || '请检查'}` },
          })
          d.push(deco.range(m.start, m.end))
        }
        return cm.Decoration.set(d)
      }

      const state = cm.EditorState.create({
        doc: value || '',
        extensions: [
          marksComp.current.of(marksField.current),
          cm.keymap.of([...cm.defaultKeymap, ...cm.historyKeymap, ...cm.searchKeymap, cm.indentWithTab]),
          cm.history(),
          cm.highlightActiveLine(),
          cm.highlightSelectionMatches(),
          cm.syntaxHighlighting(cm.defaultHighlightStyle, { fallback: true }),
          cm.markdown(),
          cm.EditorView.lineWrapping,
          (() => {
            const wikiDeco = cm.ViewPlugin.fromClass(
              class {
                constructor(view) {
                  this.decorations = this.buildDecos(view)
                }
                update(u) {
                  if (u.docChanged || u.viewportChanged) this.decorations = this.buildDecos(u.view)
                }
                buildDecos(view) {
                  const decos = []
                  const regex = /\[\[([^\]]+)\]\]/g
                  for (const { from, to } of view.visibleRanges) {
                    const text = view.state.sliceDoc(from, to)
                    let m
                    while ((m = regex.exec(text)) !== null) {
                      const start = from + m.index
                      const end = start + m[0].length
                      decos.push(
                        cm.Decoration.mark({ class: 'wiki-link', attributes: { title: `跳转到：${m[1].trim()}` } }).range(start, end)
                      )
                    }
                  }
                  return cm.Decoration.set(decos, true)
                }
              },
              { decorations: (v) => v.decorations }
            )
            return wikiDeco
          })(),
          cm.EditorView.updateListener.of((u) => {
            if (u.docChanged) {
              const newText = u.state.doc.toString()
              const delta = newText.length - u.startState.doc.length
              if (delta > 0) {
                if (typingRef.current.skip > 0) typingRef.current.skip--
                else typingRef.current.pending += delta
              }
              onChangeRef.current?.(newText)
            }
            if (u.selectionSet || u.docChanged) {
              const sel = u.state.selection.main
              const pos = sel.head
              const line = u.state.doc.lineAt(pos)
              onCaretRef.current?.({ pos, line: line.number, total: u.state.doc.lines })
              if (sel.from !== sel.to) {
                const text = u.state.sliceDoc(sel.from, sel.to)
                const fromPos = u.view.coordsAtPos(sel.from)
                const toPos = u.view.coordsAtPos(sel.to)
                if (fromPos && toPos) {
                  onSelectionRef.current?.({ text, from: sel.from, to: sel.to, fromPos, toPos })
                }
              } else {
                onSelectionRef.current?.(null)
              }
            }
          }),
          cm.EditorView.domEventHandlers({
            blur: () => {
              if (typingRef.current.pending > 0) {
                const w = typingRef.current.pending
                typingRef.current.pending = 0
                onTypingRef.current?.(w)
              }
            },
            click: (e, view) => {
              const pos = view.posAtCoords({ x: e.clientX, y: e.clientY })
              if (pos == null) return false
              const doc = view.state.doc
              const line = doc.lineAt(pos)
              const lineText = line.text
              const lineStart = line.from
              const regex = /\[\[([^\]]+)\]\]/g
              let match
              while ((match = regex.exec(lineText)) !== null) {
                const from = lineStart + match.index
                const to = from + match[0].length
                if (pos >= from && pos <= to) {
                  const name = match[1].trim()
                  if (name && onWikiLinkRef.current) {
                    onWikiLinkRef.current(name)
                    return true
                  }
                }
              }
              return false
            },
          }),
          cm.EditorView.theme({
            '&': { backgroundColor: 'transparent', color: 'var(--text)', height: '100%' },
            '.cm-content': { fontSize: `${fontSize}px`, lineHeight: String(lineHeight), fontFamily: "'Noto Serif SC', 'SimSun', serif" },
            '.cm-gutters': { backgroundColor: 'var(--bg)', color: 'var(--text-faint)', border: 'none' },
            '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--accent) 7%, transparent)' },
            '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': {
              backgroundColor: 'color-mix(in srgb, var(--accent) 30%, transparent)',
            },
            '&.cm-focused .cm-cursor, .cm-cursorLayer .cm-cursor, .cm-dropCursor': {
              borderLeftColor: 'var(--cursor-color, var(--accent))',
            },
            '.wiki-link': {
              color: 'var(--accent)',
              textDecoration: 'underline',
              cursor: 'pointer',
              borderRadius: '2px',
              padding: '0 2px',
            },
            '.wiki-link:hover': {
              backgroundColor: 'color-mix(in srgb, var(--accent) 15%, transparent)',
            },
          }),
        ],
      })
      const v = new cm.EditorView({ state, parent: wrapRef.current })
      viewRef.current = v
      if (ref) ref.current = v
      setReady(true)
    }
    init()
    return () => {
      cancelled = true
      if (viewRef.current) {
        viewRef.current.destroy()
        viewRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!viewRef.current || !marksEffect.current) return
    const cm = cmModules
    if (!cm) return
    function buildDecorations(marksArr) {
      const d = []
      for (const m of marksArr) {
        const cls = m.kind === 'sensitive' ? 'sensitive-mark' : 'typo-mark'
        const prefix = m.kind === 'sensitive' ? '敏感词：' : '建议先'
        const deco = cm.Decoration.mark({
          class: cls,
          attributes: { title: `${prefix}${m.right || m.note || '请检查'}` },
        })
        d.push(deco.range(m.start, m.end))
      }
      return cm.Decoration.set(d)
    }
    viewRef.current.dispatch({ effects: marksComp.current.reconfigure(marksField.current) })
    viewRef.current.dispatch({ effects: marksEffect.current.of(buildDecorations(marks || [])) })
  }, [marks, ready])

  useEffect(() => {
    if (!viewRef.current || !ready) return
    const cm = cmModules
    if (!cm) return
    const h = () => cm.openSearchPanel(viewRef.current)
    window.addEventListener('editor-find', h)
    return () => window.removeEventListener('editor-find', h)
  }, [ready])

  useEffect(() => {
    if (!viewRef.current) return
    const cur = viewRef.current.state.doc.toString()
    if (cur !== (value || '')) {
      typingRef.current.skip++
      viewRef.current.dispatch({ changes: { from: 0, to: cur.length, insert: value || '' } })
      requestAnimationFrame(() => viewRef.current?.requestMeasure())
    }
  }, [value])

  useEffect(() => {
    if (!wrapRef.current) return
    // 使用 requestAnimationFrame 确保 CodeMirror 已完成渲染
    requestAnimationFrame(() => {
      if (!wrapRef.current) return
      const cmContent = wrapRef.current.querySelector('.cm-content')
      if (cmContent) {
        cmContent.style.fontSize = `${fontSize}px`
        cmContent.style.lineHeight = String(lineHeight)
      }
    })
  }, [fontSize, lineHeight, ready])

  return <div className='editor-wrap' ref={wrapRef} />
})

export default Editor
