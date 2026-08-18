import { memo } from 'react'
import { ChevronUp, ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react'

const ChapterItem = memo(function ChapterItem({
  ch,
  isActive,
  isSelected,
  isDragging,
  canMoveUp,
  canMoveDown,
  onSelect,
  onToggleSelect,
  onMoveUp,
  onMoveDown,
  onDelete,
  onSplit,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  return (
    <div
      className={`tree-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      onContextMenu={onContextMenu}
    >
      <input
        type='checkbox'
        checked={isSelected}
        onClick={(e) => e.stopPropagation()}
        onChange={onToggleSelect}
        style={{ marginLeft: 4 }}
      />
      <div className='row' onClick={(e) => e.stopPropagation()} style={{ gap: 2, flexShrink: 0 }}>
        <button className='ghost' onClick={onMoveUp} disabled={!canMoveUp}>
          <ChevronUp size={16} />
        </button>
        <button className='ghost' onClick={onMoveDown} disabled={!canMoveDown}>
          <ChevronDown size={16} />
        </button>
      </div>
      <div className='grow' style={{ overflow: 'hidden' }}>
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.title}</div>
        <div className='hint' style={{ fontSize: 11 }}>
          {ch.word_count}字 · {ch.status}
        </div>
      </div>
      <button className='ghost small' title='分屏编辑' onClick={onSplit} style={{ flexShrink: 0 }}>
        ⧉
      </button>
      <button className='ghost small danger' onClick={onDelete} style={{ flexShrink: 0 }}>
        ×
      </button>
    </div>
  )
})

function Skeleton({ count = 4 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className='skeleton-line' style={{ height: 32 }} />
      ))}
    </div>
  )
}

export default function ChapterListPanel({
  leftOpen,
  setLeftOpen,
  leftW,
  leftResizeStart,
  chapters,
  sortedChapters,
  current,
  selectedIds,
  setSelectedIds,
  searchText,
  setSearchText,
  sortBy,
  setSortBy,
  dragId,
  selectChapter,
  moveChapter,
  deleteChapter,
  createChapter,
  loadChapters,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  handleContextMenu,
  setSplitChapter,
  setSplitContent,
  toggleSelectAll,
  handleBatchDelete,
  handleBatchStatus,
  toast,
  novel,
}) {
  if (!leftOpen) {
    return (
      <div
        style={{
          width: 30,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 8,
          borderRight: '1px solid var(--border)',
          background: 'var(--bg-2)',
        }}
      >
        <button className='ghost' onClick={() => setLeftOpen(true)} title='展开章节列表'>
          <PanelLeftOpen size={18} />
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexShrink: 0 }}>
      <div className='sidebar' style={{ width: leftW, display: 'flex', flexDirection: 'column' }}>
        <div className='list-header' style={{ flexWrap: 'wrap', gap: 4 }}>
          <button className='ghost' onClick={() => setLeftOpen(false)} title='折叠章节列表'>
            <PanelLeftClose size={18} />
          </button>
          <h3>章节{chapters ? `(${chapters.length})` : ''}</h3>
          <button className='small primary' onClick={createChapter} title='新建章节'>
            +
          </button>
          <button
            className='small'
            onClick={async () => {
              try {
                const ch = await window.api.importDocxChapter(novel.id)
                if (ch?.canceled) return
                loadChapters()
                selectChapter(ch)
                toast(`已从 Word 导入「${ch.title}」`, 'success')
              } catch (e) {
                toast(e.message, 'error')
              }
            }}
            title=' Word 文档导入为章节'
          >
            导入 Word
          </button>
        </div>
        <div style={{ padding: '2px 6px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 4 }}>
          <input
            style={{ flex: 1, fontSize: 12 }}
            placeholder='搜索章节标题...'
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <select
            style={{ fontSize: 11, width: 72 }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            title='排序方式'
          >
            <option value='order'>手动</option>
            <option value='title'>名称</option>
          </select>
        </div>
        {chapters && chapters.length > 0 && (
          <div
            className='row'
            style={{ padding: '4px 8px', gap: 4, borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}
          >
            <input
              type='checkbox'
              checked={selectedIds.size > 0 && selectedIds.size === chapters.length}
              onChange={toggleSelectAll}
              title='全选/全不选'
            />
            <span style={{ fontSize: 11, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
              {selectedIds.size}/{chapters.length}
            </span>
            <button className='ghost small' onClick={toggleSelectAll}>
              {selectedIds.size === chapters.length ? '全不选' : '全部'}
            </button>
            <div className='grow' />
            <button
              className='ghost small danger'
              disabled={selectedIds.size === 0}
              onClick={handleBatchDelete}
              title='批量删除'
            >
              批量删除
            </button>
            <select
              style={{ width: 80, fontSize: 11 }}
              disabled={selectedIds.size === 0}
              value=''
              onChange={(e) => {
                if (e.target.value) handleBatchStatus(e.target.value)
                e.target.value = ''
              }}
            >
              <option value=''>状态</option>
              <option value='草稿'>草稿</option>
              <option value='待修改'>待修改</option>
              <option value='已完成'>已完成</option>
            </select>
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {chapters === null ? (
            <div style={{ padding: 16 }}>
              <Skeleton count={6} />
            </div>
          ) : sortedChapters.length === 0 ? (
            searchText ? (
              <div className='empty-state' style={{ padding: 16 }}>
                <div className='hint'>未找到匹配的章节</div>
              </div>
            ) : (
              <div className='empty-state' style={{ padding: 16 }}>
                <div className='hint'>暂无章节</div>
              </div>
            )
          ) : (
            sortedChapters.map((ch) => {
              const fi = chapters.indexOf(ch)
              return (
                <ChapterItem
                  key={ch.id}
                  ch={ch}
                  isActive={current?.id === ch.id}
                  isSelected={selectedIds.has(ch.id)}
                  isDragging={dragId === ch.id}
                  canMoveUp={sortBy === 'order' && fi > 0}
                  canMoveDown={sortBy === 'order' && fi < chapters.length - 1}
                  onSelect={() => selectChapter(ch)}
                  onToggleSelect={() => {
                    const next = new Set(selectedIds)
                    if (next.has(ch.id)) next.delete(ch.id)
                    else next.add(ch.id)
                    setSelectedIds(next)
                  }}
                  onMoveUp={() => moveChapter(ch.id, -1)}
                  onMoveDown={() => moveChapter(ch.id, 1)}
                  onDelete={(e) => {
                    e.stopPropagation()
                    deleteChapter(ch)
                  }}
                  onSplit={(e) => {
                    e.stopPropagation()
                    setSplitChapter(ch)
                    setSplitContent(ch.content || '')
                  }}
                  onContextMenu={(e) => handleContextMenu(e, ch)}
                  onDragStart={sortBy === 'order' ? (e) => handleDragStart(e, ch.id) : undefined}
                  onDragOver={sortBy === 'order' ? (e) => handleDragOver(e, ch.id) : undefined}
                  onDrop={sortBy === 'order' ? handleDrop : undefined}
                  onDragEnd={sortBy === 'order' ? handleDragEnd : undefined}
                />
              )
            })
          )}
        </div>
      </div>
      <div
        style={{ width: 4, flexShrink: 0, cursor: 'col-resize', background: 'transparent' }}
        onMouseDown={leftResizeStart}
      />
    </div>
  )
}
