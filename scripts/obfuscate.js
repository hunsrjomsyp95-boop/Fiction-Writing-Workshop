#!/usr/bin/env node
/**
 * 代码混淆脚本
 * 用于混淆 electron 主进程代码，保护核心逻辑
 */

const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// 需要混淆的核心文件
const CORE_FILES = [
  'ai.js',
  'ai-providers.js',
  'ai-memory.js',
  'seed.js',
  'services.js',
  'db.js',
  'main.js'
];

// 需要混淆的 services 目录文件
const SERVICE_FILES = [
  'services/ai-usage.js',
  'services/prompts.js',
  'services/skills.js',
  'services/auth.js',
  'services/settings.js'
];

// 混淆选项
const OBFUSCATION_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: false,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayCallsTransformThreshold: 0.75,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

// 混淆单个文件
function obfuscateFile(inputPath, outputPath) {
  try {
    const code = fs.readFileSync(inputPath, 'utf-8');
    const obfuscatedCode = JavaScriptObfuscator.obfuscate(code, OBFUSCATION_OPTIONS).getObfuscatedCode();
    
    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, obfuscatedCode);
    console.log(`✓ 混淆完成: ${inputPath} -> ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`✗ 混淆失败: ${inputPath}`, error.message);
    return false;
  }
}

// 主函数
function main() {
  const electronDir = path.join(__dirname, '..', 'electron');
  const outputDir = path.join(__dirname, '..', 'electron-obfuscated');
  
  console.log('开始混淆 electron 主进程代码...\n');
  
  let successCount = 0;
  let failCount = 0;
  
  // 混淆核心文件
  for (const file of CORE_FILES) {
    const inputPath = path.join(electronDir, file);
    const outputPath = path.join(outputDir, file);
    
    if (fs.existsSync(inputPath)) {
      if (obfuscateFile(inputPath, outputPath)) {
        successCount++;
      } else {
        failCount++;
      }
    } else {
      console.log(`⚠ 文件不存在: ${inputPath}`);
    }
  }
  
  // 混淆 services 文件
  for (const file of SERVICE_FILES) {
    const inputPath = path.join(electronDir, file);
    const outputPath = path.join(outputDir, file);
    
    if (fs.existsSync(inputPath)) {
      if (obfuscateFile(inputPath, outputPath)) {
        successCount++;
      } else {
        failCount++;
      }
    } else {
      console.log(`⚠ 文件不存在: ${inputPath}`);
    }
  }
  
  console.log(`\n混淆完成: ${successCount} 成功, ${failCount} 失败`);
  
  if (failCount > 0) {
    process.exit(1);
  }
}

main();
