export default function ChapterContextMenu({ ctxMenu, setCtxMenu, handleRename, handleExport, handleSummarize, deleteChapter }) {
  if (!ctxMenu) return null

  return (
    <div
      style={{
        position: 'fixed',
        left: Math.min(ctxMenu.x, window.innerWidth - 160),
        top: Math.min(ctxMenu.y, window.innerHeight - 180),
        background: 'var(--bg-2)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '4px 0',
        minWidth: 140,
        zIndex: 999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className='ctx-item' onClick={() => { setCtxMenu(null); handleRename(ctxMenu.ch) }}>
        重命名
      </div>
      <div className='ctx-item' onClick={() => { setCtxMenu(null); handleExport(ctxMenu.ch) }}>
        导出 Word
      </div>
      <div className='ctx-item' onClick={() => { setCtxMenu(null); handleSummarize(ctxMenu.ch) }}>
        AI 概括
      </div>
      <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
      <div className='ctx-item danger' onClick={() => { setCtxMenu(null); deleteChapter(ctxMenu.ch) }}>
        删除
      </div>
    </div>
  )
}
