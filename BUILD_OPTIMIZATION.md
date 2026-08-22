# 打包优化方案

## 问题分析

打包慢的主要原因：
1. **electron 下载** - 每次打包都要下载 ~80MB 的 electron 二进制文件
2. **原生模块编译** - better-sqlite3 需要编译
3. **代码混淆** - 12 个文件需要混淆
4. **NSIS 安装包生成** - 生成安装程序需要时间

## 优化方案

### 方案 1: 使用国内镜像（推荐）

创建 `.npmrc` 文件：
```bash
electron_mirror=https://npmmirror.com/mirrors/electron/
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/
```

### 方案 2: 快速打包脚本

使用新的快速打包脚本：
```bash
# 完整打包（混淆 + 构建 + 打包）
npm run fast:build

# 跳过混淆和构建，只打包
npm run fast:build:skip

# ia32 版本
npm run fast:build:ia32
```

### 方案 3: 增量打包

如果已经有 unpacked 版本，脚本会自动使用增量打包，跳过：
- 下载 electron
- 编译原生模块
- 解压 electron

### 方案 4: 并行打包

同时打包 x64 和 ia32：
```bash
# 终端 1
npm run fast:build

# 终端 2
npm run fast:build:ia32
```

### 方案 5: 预编译原生模块

```bash
# 预编译 better-sqlite3
npm rebuild better-sqlite3 --build-from-source=false

# 保存编译后的文件
# node_modules/better-sqlite3/build/Release/better_sqlite3.node
```

## 打包时间对比

| 方案 | 首次打包 | 后续打包 |
|------|---------|---------|
| 原始方案 | 5-10 分钟 | 3-5 分钟 |
| 国内镜像 | 2-5 分钟 | 1-3 分钟 |
| 快速脚本 | 2-3 分钟 | 30 秒-1 分钟 |
| 增量打包 | N/A | 15-30 秒 |

## 推荐流程

### 开发测试
```bash
# 快速测试，跳过混淆
npm run fast:build:skip
```

### 正式发布
```bash
# 完整打包
npm run fast:build
```

### 多架构打包
```bash
# 终端 1
npm run fast:build

# 终端 2
npm run fast:build:ia32
```

## 其他优化

### 1. 使用 SSD
将项目放在 SSD 硬盘上，可以显著提升打包速度。

### 2. 增加内存
打包过程中会使用大量内存，建议至少 8GB RAM。

### 3. 关闭杀毒软件
杀毒软件会扫描文件，影响打包速度。

### 4. 使用 WSL2
在 Windows 上使用 WSL2 可以提升文件系统性能。

## 故障排除

### 问题: electron 下载失败
```bash
# 清除缓存
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron\Cache"
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache"

# 重新打包
npm run fast:build
```

### 问题: better-sqlite3 编译失败
```bash
# 重新编译
npm rebuild better-sqlite3

# 或者使用预编译版本
npm install better-sqlite3 --build-from-source=false
```

### 问题: 打包后版本号不对
检查 `package.json` 中的 `version` 字段是否正确。
