/**
 * 受保护的主入口文件
 * 在启动时进行完整性检测，然后加载应用
 */

const { app, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 完整性检测
function checkIntegrity() {
  try {
    const integrity = require('./integrity');
    const appPath = app.getAppPath();
    
    // 生成完整性报告
    const report = integrity.generateReport(appPath);
    
    if (!report.verified) {
      // 如果完整性检查失败，显示警告
      dialog.showMessageBox({
        type: 'warning',
        title: '安全警告',
        message: '应用文件可能已被修改',
        detail: '为确保安全，请从官方渠道重新下载应用。',
        buttons: ['继续使用', '退出']
      }).then(({ response }) => {
        if (response === 1) {
          app.quit();
          return;
        }
        // 继续启动应用
        loadApp();
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('完整性检查错误:', error);
    return true; // 检查出错时继续启动
  }
}

// 加载应用
function loadApp() {
  try {
    // 尝试加载混淆后的代码
    const obfuscatedPath = path.join(__dirname, 'electron-obfuscated', 'main.js');
    if (fs.existsSync(obfuscatedPath)) {
      require(obfuscatedPath);
    } else {
      // 回退到原始代码
      require('./electron/main.js');
    }
  } catch (error) {
    console.error('加载应用失败:', error);
    dialog.showErrorBox('启动错误', '应用启动失败，请重新安装。');
    app.quit();
  }
}

// 应用启动
app.whenReady().then(() => {
  if (checkIntegrity()) {
    loadApp();
  }
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});
