import { useState, useEffect } from 'react'

export default function EditorSettings() {
  const [editorFontSize, setEditorFontSize] = useState(16)
  const [editorLineHeight, setEditorLineHeight] = useState(1.8)

  useEffect(() => {
    window.api.getSetting('editor_font_size', '16').then((v) => setEditorFontSize(Number(v) || 16))
    window.api.getSetting('editor_line_height', '1.8').then((v) => setEditorLineHeight(Number(v) || 1.8))
  }, [])

  return (
    <>
      <div className='form-field'>
        <label>编辑器字号：{editorFontSize}px</label>
        <div className='row' style={{ gap: 8 }}>
          <input
            type='range'
            min='12'
            max='28'
            step='1'
            value={editorFontSize}
            onChange={(e) => {
              const v = Number(e.target.value)
              setEditorFontSize(v)
              window.api.setSetting('editor_font_size', String(v))
            }}
            style={{ flex: 1 }}
          />
          <span className='hint' style={{ minWidth: 50 }}>12 - 28</span>
        </div>
      </div>
      <div className='form-field'>
        <label>编辑器行距：{editorLineHeight}</label>
        <div className='row' style={{ gap: 8 }}>
          <input
            type='range'
            min='1.2'
            max='3'
            step='0.1'
            value={editorLineHeight}
            onChange={(e) => {
              const v = Number(e.target.value)
              setEditorLineHeight(v)
              window.api.setSetting('editor_line_height', String(v))
            }}
            style={{ flex: 1 }}
          />
          <span className='hint' style={{ minWidth: 50 }}>1.2 - 3.0</span>
        </div>
      </div>
      <div className='hint' style={{ marginTop: 8 }}>
        拖动滑块调整编辑器字号和行距，修改后切换页面生效。
      </div>
    </>
  )
}
