import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import AIPanel from './AIPanel.jsx'
import TypoCheckPanel from './TypoCheckPanel.jsx'
import SensitiveWordsPanel from './SensitiveWordsPanel.jsx'
import VersionPanel from './VersionPanel.jsx'
import StagingPanel from './StagingPanel.jsx'

export default function RightPanel({
  rightOpen,
  setRightOpen,
  rightW,
  rightResizeStart,
  rightTab,
  setRightTab,
  novel,
  current,
  contentRef,
  caretRef,
  content,
  marks,
  setMarks,
  doSave,
  toast,
  editorViewRef,
}) {
  if (!rightOpen) {
    return (
      <div
        style={{
          width: 30,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 8,
          borderLeft: '1px solid var(--border)',
          background: 'var(--bg-2)',
        }}
      >
        <button className='ghost' onClick={() => setRightOpen(true)} title='展开 AI 助手'>
          <PanelRightOpen size={18} />
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexShrink: 0 }}>
      <div
        style={{ width: 4, flexShrink: 0, cursor: 'col-resize', background: 'transparent' }}
        onMouseDown={rightResizeStart}
      />
      <div
        style={{
          width: rightW,
          flexShrink: 0,
          borderLeft: '1px solid var(--border)',
          background: 'var(--bg-2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className='tabs'>
          <div className={`tab ${rightTab === 'ai' ? 'active' : ''}`} onClick={() => setRightTab('ai')}>
            AI 助手
          </div>
          <div className={`tab ${rightTab === 'typo' ? 'active' : ''}`} onClick={() => setRightTab('typo')}>
            校对
          </div>
          <div className={`tab ${rightTab === 'version' ? 'active' : ''}`} onClick={() => setRightTab('version')}>
            版本对比
          </div>
          <div className={`tab ${rightTab === 'sensitive' ? 'active' : ''}`} onClick={() => setRightTab('sensitive')}>
            敏感词
          </div>
          <div className={`tab ${rightTab === 'staging' ? 'active' : ''}`} onClick={() => setRightTab('staging')}>
            暂存
          </div>
          <div className='grow' />
          <button className='ghost' onClick={() => setRightOpen(false)} title='折叠右侧面板'>
            <PanelRightClose size={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          {rightTab === 'ai' && (
            <AIPanel
              novel={novel}
              chapter={current}
              contentRef={contentRef}
              cursorRef={caretRef}
              onApply={(text) => {
                doSave(current, text)
              }}
            />
          )}
          {rightTab === 'typo' && (
            <TypoCheckPanel
              novel={novel}
              chapter={current}
              content={content}
              setMarks={setMarks}
              onReplace={(text) => {
                doSave(current, text)
                setMarks([])
              }}
            />
          )}
          {rightTab === 'sensitive' && (
            <SensitiveWordsPanel novel={novel} chapter={current} content={content} setMarks={setMarks} />
          )}
          {rightTab === 'version' && (
            <VersionPanel
              chapter={current}
              currentContent={content}
              onRestore={(text) => {
                doSave(current, text)
                toast('已恢复版本', 'success')
              }}
            />
          )}
          {rightTab === 'staging' && (
            <StagingPanel
              onInsert={(text) => {
                if (!editorViewRef.current) return
                const view = editorViewRef.current
                const pos = view.state.selection.main.head
                view.dispatch({ changes: { from: pos, insert: text } })
                toast('已插入到光标位置', 'success')
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
