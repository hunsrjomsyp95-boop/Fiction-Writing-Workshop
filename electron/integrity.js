/**
 * asar 完整性检测模块
 * 检测应用是否被篡改
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class AsarIntegrity {
  constructor() {
    this.expectedHash = null;
    this.algorithm = 'sha256';
  }

  /**
   * 计算文件的哈希值
   */
  calculateHash(filePath) {
    try {
      const content = fs.readFileSync(filePath);
      return crypto.createHash(this.algorithm).update(content).digest('hex');
    } catch (error) {
      return null;
    }
  }

  /**
   * 计算目录的哈希值
   */
  calculateDirectoryHash(dirPath) {
    try {
      const files = fs.readdirSync(dirPath).sort();
      const hashes = [];

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          hashes.push(this.calculateDirectoryHash(filePath));
        } else {
          const hash = this.calculateHash(filePath);
          if (hash) {
            hashes.push(`${file}:${hash}`);
          }
        }
      }

      const combined = hashes.join('|');
      return crypto.createHash(this.algorithm).update(combined).digest('hex');
    } catch (error) {
      return null;
    }
  }

  /**
   * 设置预期的哈希值
   */
  setExpectedHash(hash) {
    this.expectedHash = hash;
  }

  /**
   * 验证应用完整性
   */
  verify(appPath) {
    try {
      // 检查是否在 asar 包中
      if (appPath.includes('app.asar')) {
        // 在生产环境中，检查 asar 文件的完整性
        const asarPath = appPath.split('app.asar')[0] + 'app.asar';
        const currentHash = this.calculateHash(asarPath);
        
        if (this.expectedHash && currentHash !== this.expectedHash) {
          console.warn('警告: 应用文件可能已被篡改');
          return false;
        }
        return true;
      }

      // 在开发环境中，跳过检查
      return true;
    } catch (error) {
      console.error('完整性检查失败:', error.message);
      return false;
    }
  }

  /**
   * 生成完整性报告
   */
  generateReport(appPath) {
    const report = {
      timestamp: new Date().toISOString(),
      appPath: appPath,
      isAsar: appPath.includes('app.asar'),
      hash: null,
      verified: false
    };

    try {
      if (appPath.includes('app.asar')) {
        const asarPath = appPath.split('app.asar')[0] + 'app.asar';
        report.hash = this.calculateHash(asarPath);
        report.verified = this.expectedHash ? report.hash === this.expectedHash : true;
      } else {
        report.verified = true;
      }
    } catch (error) {
      report.error = error.message;
    }

    return report;
  }
}

module.exports = new AsarIntegrity();
