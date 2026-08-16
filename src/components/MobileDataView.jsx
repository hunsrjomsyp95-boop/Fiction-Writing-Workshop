import { useState } from 'react'
import { Database, Download, Upload, RefreshCw, Trash2, FileText } from 'lucide-react'

export default function MobileDataView({ novel, toast }) {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)

  const exportNovel = async (format) => {
    setExporting(true)
    try {
      const result = await window.api.exportNovel(novel.id, format)
      toast(`导出成功，共 ${result.totalWords} 字`, 'success')
    } catch (e) {
      toast('导出失败: ' + e.message, 'error')
    } finally {
      setExporting(false)
    }
  }

  const backupDatabase = async () => {
    try {
      await window.api.backupExportDb()
      toast('数据库已备份', 'success')
    } catch (e) {
      toast('备份失败: ' + e.message, 'error')
    }
  }

  const importDatabase = async () => {
    setImporting(true)
    try {
      await window.api.backupImportDb()
      toast('数据库已恢复', 'success')
      window.location.reload()
    } catch (e) {
      toast('恢复失败: ' + e.message, 'error')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="mobile-data">
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
        <Database size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        数据管理
      </h2>

      {/* 导出功能 */}
      <div className="mobile-data-section">
        <h3><Download size={16} /> 导出小说</h3>
        <p className="mobile-text-dim">将小说导出为文件保存到本地</p>
        <div className="mobile-btn-group">
          <button 
            className="mobile-btn" 
            onClick={() => exportNovel('md')}
            disabled={exporting}
          >
            <FileText size={16} /> 导出 Markdown
          </button>
          <button 
            className="mobile-btn secondary" 
            onClick={() => exportNovel('txt')}
            disabled={exporting}
          >
            <FileText size={16} /> 导出 TXT
          </button>
        </div>
      </div>

      {/* 备份功能 */}
      <div className="mobile-data-section">
        <h3><RefreshCw size={16} /> 备份与恢复</h3>
        <p className="mobile-text-dim">备份数据库文件，防止数据丢失</p>
        <div className="mobile-btn-group">
          <button className="mobile-btn" onClick={backupDatabase}>
            <Download size={16} /> 备份数据库
          </button>
          <button 
            className="mobile-btn secondary" 
            onClick={importDatabase}
            disabled={importing}
          >
            <Upload size={16} /> {importing ? '恢复中...' : '恢复数据库'}
          </button>
        </div>
      </div>

      {/* 提示 */}
      <div className="mobile-data-section">
        <h3>提示</h3>
        <ul className="mobile-tips">
          <li>数据存储在浏览器本地，清除浏览器数据会丢失</li>
          <li>建议定期备份数据库</li>
          <li>恢复数据库会覆盖当前数据</li>
        </ul>
      </div>
    </div>
  )
}