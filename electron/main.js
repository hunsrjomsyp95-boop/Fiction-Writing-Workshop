const { app, BrowserWindow, dialog } = require('electron')
const path = require('path')
const { init } = require('./db')
const { registerAll } = require('./ipc')
const services = require('./services')
const { autoUpdater } = require('electron-updater')

let win = null
let backupTimer = null

// 自动更新配置
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true
autoUpdater.logger = {
  info: (msg) => console.log('[updater]', msg),
  warn: (msg) => console.warn('[updater]', msg),
  error: (msg) => console.error('[updater]', msg),
}

function checkForUpdates() {
  if (!app.isPackaged) {
    console.log('[updater] 开发模式，跳过更新检查')
    return
  }
  console.log('[updater] 检查更新...')
  autoUpdater.checkForUpdates().then((result) => {
    console.log('[updater] 检查结果:', result ? `发现 v${result.updateInfo.version}` : '无更新')
  }).catch((err) => {
    console.error('[updater] 检查失败:', err.message)
  })
}

autoUpdater.on('update-available', (info) => {
  if (!win) return
  dialog
    .showMessageBox(win, {
      type: 'info',
      title: '发现新版本',
      message: `发现新版本 v${info.version}`,
      detail: '是否立即下载更新？',
      buttons: ['下载更新', '稍后提醒'],
      defaultId: 0,
    })
    .then(({ response }) => {
      if (response === 0) {
        autoUpdater.downloadUpdate()
      }
    })
})

autoUpdater.on('download-progress', (progress) => {
  if (win) {
    win.setProgressBar(progress.percent / 100)
  }
})

autoUpdater.on('update-downloaded', () => {
  if (win) {
    win.setProgressBar(-1) // 移除进度条
    dialog
      .showMessageBox(win, {
        type: 'info',
        title: '更新已下载',
        message: '新版本已下载完成，是否立即重启安装？',
        buttons: ['立即重启', '稍后重启'],
        defaultId: 0,
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  }
})

autoUpdater.on('error', () => {
  // 静默处理更新错误
})

function startAutoBackup() {
  if (backupTimer) clearInterval(backupTimer)
  const minutes = Number(services.getSetting('auto_backup_minutes', '0'))
  const dir = services.getSetting('auto_backup_dir', '')
  if (!minutes || minutes <= 0 || !dir) {
    backupTimer = null
    return
  }
  const doBackup = () => {
    try {
      const res = services.autoBackupAll(dir)
      if (win && res.count) {
        const at = new Date().toLocaleString()
        services.setSetting('last_auto_backup', at)
        win.webContents.send('backup:event', { ok: true, at, count: res.count })
      }
    } catch (e) {
      console.error('[backup] 自动备份失败:', e.message)
      if (win && !win.isDestroyed()) {
        win.webContents.send('backup:event', { ok: false, error: e.message })
      }
    }
  }
  doBackup()
  backupTimer = setInterval(doBackup, minutes * 60 * 1000)
}

function createWindow() {
  const saved = (() => {
    try {
      const raw = services.getSetting('window_bounds', '')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })()

  win = new BrowserWindow({
    width: saved?.width || 1400,
    height: saved?.height || 900,
    x: saved?.x,
    y: saved?.y,
    minWidth: 1024,
    minHeight: 700,
    title: '小说创作工坊',
    backgroundColor: '#1e1e2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.removeMenu()

  // Ctrl+Shift+I 打开开发者工具
  win.webContents.on('before-input-event', (e, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      win.webContents.openDevTools({ mode: 'detach' })
      e.preventDefault()
    }
  })

  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) {
    win.loadURL(devUrl)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  const saveBounds = () => {
    if (win && !win.isMinimized()) {
      const b = win.getBounds()
      services.setSetting('window_bounds', JSON.stringify(b))
    }
  }

  win.on('resize', saveBounds)
  win.on('move', saveBounds)
  win.on('closed', () => {
    win = null
  })
}

app.whenReady().then(() => {
  try {
    init()
  } catch (e) {
    console.error('数据库初始化失败:', e)
  }
  createWindow()
  registerAll(() => win)
  startAutoBackup()

  // 延迟检查更新（启动后 30 秒）
  setTimeout(checkForUpdates, 30000)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('will-quit', () => {
  if (backupTimer) clearInterval(backupTimer)
  if (win) {
    const b = win.getBounds()
    services.setSetting('window_bounds', JSON.stringify(b))
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
