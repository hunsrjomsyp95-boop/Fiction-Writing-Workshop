# 小说创作工坊 (Novel Studio)

一款专为小说创作者设计的桌面写作工具，提供章节管理、AI辅助创作、版本对比、大纲人物世界观管理、资料库、错字更正等全方位功能。

## 功能特性

### 核心功能
- **章节管理**：创建、编辑、排序章节，支持章节状态管理（草稿、已完成等）
- **AI辅助创作**：集成多种AI服务商（小米MiMo、DeepSeek、OpenAI等），支持续写、改写、扩写等
- **版本对比**：自动保存版本历史，支持并排diff视图，轻松对比修改内容
- **大纲管理**：树状大纲结构，支持拖拽排序，快速导航
- **人物管理**：详细的人物档案，包括外貌、性格、背景、关系等
- **世界观设定**：多世界支持，设定分类管理，规则验证
- **资料库**：参考资料管理，支持分类、标签、AI自动分类
- **时间线**：事件时间线管理，支持排序和筛选
- **伏笔管理**：伏笔追踪，状态管理（计划、已埋、已呼、已回等）
- **物品道具**：物品管理，支持关联人物和位置

### 写作辅助
- **错字更正**：内置词典+AI智能检测，一键修复
- **敏感词检测**：自动扫描敏感词，高亮标记
- **写作统计**：字数统计、写作时间、效率分析
- **专注模式**：番茄钟、字数目标、全屏写作
- **快捷键**：丰富的快捷键支持，提升写作效率

### 数据管理
- **自动保存**：实时保存，防止数据丢失
- **自动备份**：定时备份，支持自定义备份目录
- **数据导出**：支持导出为TXT、DOCX、PDF格式
- **数据导入**：支持导入TXT、DOCX文件

### 界面定制
- **主题切换**：内置多种主题（暗色、亮色、护眼等）
- **自定义主题**：支持自定义颜色方案
- **字体调整**：可调整字体大小和颜色
- **窗口状态**：自动保存窗口位置和大小

## 技术栈

- **前端**：React 18 + Vite + CodeMirror 6
- **后端**：Electron + Node.js
- **数据库**：SQLite (better-sqlite3)
- **AI集成**：支持多种AI服务商API
- **构建**：electron-builder
- **测试**：Vitest + Playwright

## 安装与运行

### 开发环境

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd novel-studio
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```
   这将同时启动Vite开发服务器和Electron应用。

### 构建打包

1. **构建生产版本**
   ```bash
   npm run build
   ```

2. **打包为可执行文件**
   ```bash
   npm run dist
   ```
   将在`release2`目录生成Windows安装包。

## 项目结构

```
novel-studio/
├── electron/              # Electron主进程
│   ├── main.js           # 应用入口
│   ├── preload.js        # 预加载脚本
│   ├── db.js             # 数据库操作
│   ├── ai.js             # AI服务集成
│   ├── ipc.js            # IPC通信处理
│   └── services/         # 业务逻辑服务
├── src/                   # React前端
│   ├── components/       # React组件
│   ├── App.jsx           # 主应用组件
│   ├── main.jsx          # 前端入口
│   └── index.css         # 全局样式
├── test/                  # 测试文件
├── dist/                  # 构建输出
├── release2/             # 打包输出
├── package.json          # 项目配置
├── vite.config.js        # Vite配置
└── electron-builder.yml  # Electron Builder配置
```

## 使用指南

### 创建小说

1. 启动应用后，点击"新建小说"
2. 输入小说名称和描述
3. 开始创作第一个章节

### 使用AI辅助

1. 在设置中配置AI服务商和API密钥
2. 在编辑器中选中文本，使用AI工具栏
3. 支持续写、改写、扩写、翻译等功能

### 管理大纲

1. 在"大纲"标签页创建节点
2. 支持拖拽排序和层级结构
3. 可关联到具体章节

### 版本管理

1. 每次保存自动生成版本
2. 在"版本"标签页查看历史
3. 支持并排对比和恢复

## 配置说明

### AI配置

在设置中配置AI服务商：
- **小米MiMo**：默认服务商，支持多种模型
- **DeepSeek**：高性能推理模型
- **OpenAI**：GPT系列模型
- **本地Ollama**：支持本地部署的模型

### 备份配置

- **自动备份**：设置备份间隔（分钟）
- **备份目录**：选择备份存储位置
- **备份保留**：每个项目最多保留30个备份

## 开发指南

### 添加新功能

1. 在`electron/services/`添加业务逻辑
2. 在`electron/ipc.js`注册IPC处理器
3. 在`electron/preload.js`暴露API
4. 在`src/components/`创建React组件

### 数据库迁移

在`electron/db.js`的`migrate`函数中添加新的表或列。

### 测试

- **单元测试**：`npm run test:unit`
- **端到端测试**：`npm run test:e2e`
- **GUI测试**：`npm run test:gui`

## 常见问题

### Q: 如何修改AI服务商？
A: 在设置中切换服务商，系统会自动填充API地址，只需填写API密钥。

### Q: 数据存储在哪里？
A: 数据存储在用户目录的`novel-studio`文件夹中，具体路径：
- Windows: `%APPDATA%/novel-studio/`
- macOS: `~/Library/Application Support/novel-studio/`
- Linux: `~/.config/novel-studio/`

### Q: 如何导出小说？
A: 在资料菜单中选择导出格式（TXT、DOCX、PDF），选择保存位置即可。

## 更新日志

详见 [CHANGELOG.md](./CHANGELOG.md)

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 联系方式

2982871730@qq.com