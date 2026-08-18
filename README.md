# 小说创作工坊 (Novel Studio)

一款基于 Electron + React 的桌面端小说写作工具，支持章节管理、AI 辅助写作、人物世界观设定、版本控制等功能。

## 功能特性

### 写作核心
- **章节管理**：创建、编辑、排序、批量操作，支持状态标记
- **CodeMirror 编辑器**：Markdown 编辑，支持查找替换、快捷键
- **自动保存**：防丢失，支持手动保存
- **版本快照**：保存历史版本，支持对比和恢复
- **一键排版**：中英文空格、标点、空行整理

### AI 辅助写作
- **多服务商支持**：18 个内置 AI 服务商（小米 MiMo、DeepSeek、OpenAI、Anthropic Claude、通义千问、智谱 GLM 等）
- **AI 续写/润色/改写/扩写**：流式生成，实时预览
- **AI 校对**：错字错词检测
- **实体提取**：从正文自动提取人物、世界观、物品、事件、伏笔
- **AI 设置分析**：世界观设定智能分类

### 结构化创作
- **大纲管理**：卷/章/剧情线规划
- **人物档案**：角色设定、外貌、性格、背景
- **人物关系**：关系网可视化
- **世界观设定**：多世界、历史、势力、文化
- **年表/时间线**：事件时序管理
- **伏笔管理**：伏笔追踪和回收
- **物品/道具/地点**：管理武器、重要地点
- **世界地图**：AI 生成世界地图

### 数据管理
- **自动备份**：定时备份，最多保留 30 份，自动轮转
- **导入导出**：支持 TXT/DOCX/PDF 格式
- **全文搜索**：跨章搜索和批量替换
- **资料库**：参考文章整理，支持网页爬取

### 其他功能
- **错字检查**：中文校稿
- **敏感词高亮**：投稿前检查
- **写作统计**：手打字数、连续天数
- **专注模式**：番茄钟和字数目标
- **主题定制**：自定义颜色、字体、窗口记忆
- **本地登录**：密码保护（scrypt 加密）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + Vite 6 |
| 编辑器 | CodeMirror 6 |
| 桌面框架 | Electron 37 |
| 数据库 | SQLite (better-sqlite3) |
| 自动更新 | electron-updater |
| 测试 | Vitest + Playwright |
| 构建 | electron-builder |

## 安装与使用

### 环境要求

- Node.js 22.x
- npm
- Windows（主要目标平台）
- 如遇 native module 编译问题，需安装 Visual Studio C++ Build Tools

### 安装步骤

```bash
# 克隆仓库
git clone <repository-url>
cd Fiction-Writing-Workshop

# 安装依赖
npm ci

# 如遇 better-sqlite3 编译问题
npm run rebuild

# 开发模式
npm run dev

# 构建
npm run build

# 打包 Windows 安装程序
npm run dist
```

### 测试

```bash
# 单元测试
npm run test:unit

# 代码检查
npm run lint

# E2E 测试
npm test

# GUI 测试
npm run test:gui
```

## 项目结构

```
├── electron/               # Electron 主进程
│   ├── main.js            # 应用入口、窗口管理、自动更新
│   ├── preload.js         # Context Bridge（170+ IPC 通道）
│   ├── ipc.js             # IPC 处理器
│   ├── db.js              # SQLite 数据库初始化
│   ├── ai.js              # AI 核心逻辑
│   ├── ai-providers.js    # 18 个 AI 服务商配置
│   ├── ai-memory.js       # AI 对话记忆
│   ├── services/          # 业务逻辑层（24 个模块）
│   └── ...
├── src/                    # React 前端
│   ├── components/        # UI 组件
│   ├── api-web.js         # Web 版 API 适配
│   └── ...
├── test/                   # 测试文件
├── e2e-gui/               # Playwright GUI 测试
└── package.json
```

## AI 服务商配置

应用内置 18 个 AI 服务商，使用 OpenAI 兼容 API 格式：

| 服务商 | 说明 |
|--------|------|
| 小米 MiMo | 默认服务商 |
| DeepSeek | 国产大模型 |
| OpenAI | GPT 系列 |
| Anthropic Claude | Claude 系列 |
| 通义千问 | 阿里云 |
| 智谱 GLM | 清华系 |
| 百度文心 | 百度 |
| 讯飞星火 | 科大讯飞 |
| 月之暗面 Kimi | Moonshot |
| 零一万物 Yi | 01.AI |
| 阶跃星辰 Step | StepFun |
| MiniMax | MiniMax |
| 豆包 | 字节跳动 |
| Google Gemini | Google |
| Groq | Groq |
| Mistral | Mistral |
| SiliconFlow | 硅基流动 |
| 自定义 | 用户自定义 API |

在「设置 → AI 设置」中选择服务商并填写 API Key。

## 安全特性

- **Context Isolation**：渲染进程隔离
- **Sandbox**：启用进程沙箱
- **API Key 加密存储**：使用操作系统密钥链（Windows DPAPI / macOS Keychain / Linux Secret Service）
- **HTML 清理**：DOMPurify 防 XSS
- **密码加密**：scrypt + 随机 salt

## 数据存储

- **Windows**：`%APPDATA%/novel-studio/`
- **数据库**：`novel-studio.db`（SQLite）
- **备份**：用户自定义目录，最多 30 份自动轮转

## 许可证

[MIT License](LICENSE)

## 联系方式

- 邮箱：2982871730@qq.com
