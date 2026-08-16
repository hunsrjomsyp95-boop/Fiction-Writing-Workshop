import { useState, useEffect, useRef } from 'react'
import { useToast } from '../ToastContext.jsx'

export default function DataMenu({ novel, onClose }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [autoMin, setAutoMin] = useState('0')
  const [autoDir, setAutoDir] = useState('')
  const [lastBackup, setLastBackup] = useState('')
  const [exportFormat, setExportFormat] = useState('md')
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [size, setSize] = useState({ w: 620, h: 520 })
  const dragRef = useRef({})
  const modalRef = useRef(null)

  useEffect(() => {
    setPos({
      x: Math.max(20, (window.innerWidth - 620) / 2),
      y: Math.max(20, (window.innerHeight - 520) / 3),
    })
  }, [])

  useEffect(() => {
    Promise.all([
      window.api.getSetting('auto_backup_minutes', '0'),
      window.api.getSetting('auto_backup_dir', ''),
      window.api.getSetting('last_auto_backup', ''),
    ]).then(([m, d, t]) => {
      setAutoMin(m)
      setAutoDir(d)
      setLastBackup(t)
    })
  }, [])

  const dragStart = (type) => (e) => {
    e.preventDefault()
    dragRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startXPos: pos.x,
      startYPos: pos.y,
      startW: size.w,
      startH: size.h,
    }
    const mv = (ev) => {
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      if (dragRef.current.type === 'move') {
        setPos({ x: dragRef.current.startXPos + dx, y: dragRef.current.startYPos + dy })
      } else if (dragRef.current.type === 'resize') {
        setSize({
          w: Math.max(400, dragRef.current.startW + dx),
          h: Math.max(300, dragRef.current.startH + dy),
        })
      }
    }
    const up = () => {
      document.removeEventListener('mousemove', mv)
      document.removeEventListener('mouseup', up)
    }
    document.addEventListener('mousemove', mv)
    document.addEventListener('mouseup', up)
  }

  const wrap = async (fn, okMsg) => {
    setBusy(true)
    try {
      const res = await fn()
      if (res && res.canceled) return
      toast(okMsg || '完成', 'success')
    } catch (e) {
      if (e.message !== 'canceled') toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  const saveAuto = async () => {
    const minutes = Number(autoMin)
    if (minutes > 0 && !autoDir) {
      toast('请先选择自动备份目录', 'error')
      return
    }
    await window.api.setSetting('auto_backup_minutes', String(minutes))
    await window.api.setSetting('auto_backup_dir', autoDir)
    toast(minutes > 0 ? `已启用自动备份，每${minutes} 分钟一次` : '已关闭自动备份', 'success')
    onClose()
    window.location.reload()
  }

  const pickAutoDir = async () => {
    try {
      const res = await window.api.pickFolder()
      if (res && !res.canceled) setAutoDir(res.dir)
    } catch (e) {
      toast(e.message, 'error')
    }
  }

  return (
    <div className='modal-mask'>
      <div
        className='modal'
        ref={modalRef}
        style={{
          position: 'absolute',
          left: pos.x,
          top: pos.y,
          width: size.w,
          height: size.h,
          maxWidth: 'none',
          maxHeight: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className='modal-head' onMouseDown={dragStart('move')} style={{ cursor: 'move', userSelect: 'none' }}>
          数据管理
          <div className='spacer' />
          <button className='ghost small' onClick={onClose}>
            关闭
          </button>
        </div>
        <div className='modal-body'>
          <div className='hint'>建议定期备份，防止误删或系统故障导致数据丢失。</div>

          <div className='panel' style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <b>导出当前项目</b>
            <div className='hint'>将章节导出为文件 + 全部设定导出为project.json（含伏笔/年表/关系/物品/提示词）。</div>
            <div className='row wrap' style={{ gap: 8 }}>
              <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} style={{ width: 120 }}>
                <option value='md'>Markdown</option>
                <option value='txt'>纯文本TXT</option>
              </select>
              <div className='grow' />
              <button
                className='small primary'
                disabled={busy}
                onClick={() => wrap(() => window.api.exportNovel(novel.id, exportFormat), '导出成功')}
              >
                导出项目
              </button>
              <button
                className='small'
                disabled={busy}
                onClick={() =>
                  wrap(async () => {
                    const res = await window.api.exportNovelAsPdf(novel.id)
                    if (res?.canceled) throw new Error('canceled')
                    return res
                  }, 'PDF 导出成功')
                }
              >
                导出 PDF
              </button>
              <button
                className='small'
                disabled={busy}
                onClick={() => wrap(() => window.api.exportDocx(novel.id), 'Word 导出成功')}
              >
                导出 Word
              </button>
            </div>
          </div>

          <div className='panel' style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <b>导入项目</b>
            <div className='row'>
              <div className='hint grow'>
                选择之前导出的项目文件夹（含 project.json），或一个纯 Markdown 章节文件夹，作为新项目导入。
              </div>
              <button
                className='small'
                disabled={busy}
                onClick={() =>
                  wrap(async () => {
                    const n = await window.api.importNovel()
                    if (n?.canceled) throw new Error('canceled')
                    if (n) toast(`已导入项目「${n.name}」`, 'success')
                  })
                }
              >
                导入
              </button>
            </div>
          </div>

          <div className='panel' style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <b>立即备份</b>
            <div className='row'>
              <div className='hint grow'>把当前项目以带时间戳的文件夹备份到你选择的位置。</div>
              <button
                className='small primary'
                disabled={busy}
                onClick={() => wrap(() => window.api.backupNovel(novel.id), '备份成功')}
              >
                备份
              </button>
            </div>
          </div>

          <div className='panel' style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <b>数据库级备份 / 恢复</b>
            <div className='hint'>备份包含所有项目与设置文件的完整数据库（db）。恢复后将替换当前数据库并立即生效。</div>
            <div className='row'>
              <button
                className='small'
                disabled={busy}
                onClick={() => wrap(() => window.api.backupExportDb(), '数据库已备份')}
              >
                备份数据库
              </button>
              <button
                className='small danger'
                disabled={busy}
                onClick={() => wrap(() => window.api.backupImportDb(), '数据库已恢复')}
              >
                恢复数据库
              </button>
            </div>
          </div>

          <div className='panel' style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <b>自动备份</b>
            <div className='row' style={{ gap: 8 }}>
              <input
                type='number'
                min='0'
                style={{ width: 90 }}
                value={autoMin}
                onChange={(e) => setAutoMin(e.target.value)}
                placeholder='分钟'
              />
              <span className='hint'> N 分钟自动备份全部项目（0 = 关闭）</span>
            </div>
            <div className='row'>
              <input
                className='grow'
                value={autoDir}
                onChange={(e) => setAutoDir(e.target.value)}
                placeholder='自动备份目录（在下方选择）'
                readOnly
              />
              <button className='small' onClick={pickAutoDir}>
                选择目录
              </button>
            </div>
            {lastBackup && <div className='hint'>上次自动备份：{lastBackup}</div>}
            <div className='row right'>
              <button className='primary' onClick={saveAuto}>
                保存自动备份设置
              </button>
            </div>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 14,
            height: 14,
            cursor: 'nwse-resize',
            background: 'linear-gradient(135deg, transparent 50%, var(--text-3) 50%)',
            borderBottomRightRadius: 10,
          }}
          onMouseDown={dragStart('resize')}
        />
      </div>
    </div>
  )
}
