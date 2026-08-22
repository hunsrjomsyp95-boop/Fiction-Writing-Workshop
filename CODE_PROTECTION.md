# 代码保护方案

本项目提供了多层代码保护机制，防止代码被轻易反编译和篡改。

## 保护措施

### 1. JavaScript 代码混淆
- 使用 `javascript-obfuscator` 对核心代码进行混淆
- 控制流平坦化
- 死代码注入
- 字符串数组加密
- 变量名混淆

### 2. asar 完整性检测
- 启动时检测 asar 文件是否被篡改
- 使用 SHA-256 哈希算法
- 检测到篡改时显示警告

### 3. 关键代码分离
- 核心业务逻辑代码混淆
- UI 代码保持可读性（便于调试）

## 使用方法

### 开发环境
开发环境使用原始代码，便于调试：
```bash
npm run dev
```

### 生产环境（普通打包）
使用原始代码打包：
```bash
npm run dist
```

### 生产环境（受保护打包）
使用混淆后的代码打包：
```bash
npm run dist:protected
```

### 仅混淆代码
只混淆 electron 主进程代码：
```bash
npm run obfuscate
```

## 混淆的文件

以下核心文件会被混淆：
- `electron/ai.js` - AI 核心逻辑
- `electron/ai-providers.js` - AI 服务商配置
- `electron/ai-memory.js` - AI 记忆系统
- `electron/seed.js` - 内置提示词
- `electron/services.js` - 服务层
- `electron/db.js` - 数据库操作
- `electron/main.js` - 主进程入口
- `electron/services/ai-usage.js` - AI 用量统计
- `electron/services/prompts.js` - 提示词服务
- `electron/services/skills.js` - 知识库服务
- `electron/services/auth.js` - 认证服务
- `electron/services/settings.js` - 设置服务

## 混淆效果

混淆后的代码具有以下特点：
- 变量名被替换为无意义的字符
- 控制流被平坦化，难以追踪执行路径
- 插入大量死代码，增加阅读难度
- 字符串被加密，防止静态分析
- 代码结构被重组，难以理解逻辑

## 注意事项

1. **调试困难**：混淆后的代码难以调试，建议开发时使用原始代码
2. **性能影响**：混淆会略微增加代码体积和执行时间
3. **不完全安全**：混淆只能增加逆向难度，不能完全防止反编译
4. **备份原始代码**：混淆前请备份原始代码，混淆是不可逆的

## 进一步保护建议

如果需要更强的保护，可以考虑：

1. **使用 bytenode 编译为字节码**
   ```bash
   npm install bytenode
   bytenode --compile electron/main.js
   ```

2. **关键逻辑放服务端**
   - 将核心算法放在服务器
   - 客户端只做展示和交互

3. **使用 WebAssembly**
   - 将关键算法编译为 WASM
   - 更难反编译

4. **代码签名**
   - 对发布包进行数字签名
   - 防止篡改

## 文件结构

```
├── scripts/
│   └── obfuscate.js      # 混淆脚本
├── electron/
│   ├── integrity.js       # 完整性检测模块
│   └── ...                # 原始代码
├── electron-obfuscated/   # 混淆后的代码（生成）
├── main-protected.js      # 受保护的主入口
└── package.json
```

## 版本历史

- v1.3.6: 新增代码保护功能
  - JavaScript 代码混淆
  - asar 完整性检测
  - 受保护的打包流程