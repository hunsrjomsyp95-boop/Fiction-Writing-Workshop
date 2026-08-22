#!/usr/bin/env node
/**
 * 快速打包脚本
 * 优化打包速度，避免重复操作
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const arch = args[0] || 'x64';
const skipObfuscate = args.includes('--skip-obfuscate');

console.log(`🚀 开始打包 ${arch} 版本...\n`);

// 1. 混淆代码（默认执行，除非 --skip-obfuscate）
if (!skipObfuscate) {
  console.log('📦 步骤 1/3: 混淆代码...');
  try {
    execSync('node scripts/obfuscate.js', { stdio: 'inherit' });
    console.log('✅ 代码混淆完成\n');
  } catch (e) {
    console.error('❌ 代码混淆失败');
    process.exit(1);
  }
} else {
  console.log('⏭️  跳过代码混淆（仅限开发测试）\n');
}

// 2. 构建前端
console.log('📦 步骤 2/3: 构建前端...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ 前端构建完成\n');
} catch (e) {
  console.error('❌ 前端构建失败');
  process.exit(1);
}

// 3. 打包 electron
console.log(`📦 步骤 3/3: 打包 electron (${arch})...`);
const outputDir = arch === 'ia32' ? 'release-ia32' : 'release-x64';

try {
  const configArg = arch === 'ia32' ? '-c electron-builder-ia32-only.yml' : `-c.directories.output=${outputDir}`;
  execSync(`npx electron-builder --win --${arch} ${configArg}`, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('✅ 打包完成\n');
} catch (e) {
  console.error('❌ 打包失败:', e.message);
  process.exit(1);
}

// 显示结果
console.log('📦 打包结果:');
try {
  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.exe'));
  files.forEach(f => {
    const stat = fs.statSync(path.join(outputDir, f));
    const sizeMB = (stat.size / 1024 / 1024).toFixed(1);
    console.log(`  - ${f} (${sizeMB} MB)`);
  });
} catch (e) {
  console.log('  无法读取输出目录');
}

console.log('\n🎉 打包完成！');
