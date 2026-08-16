# 更新日志

## [1.2.6] - 2026-08-16

### 新增
- 世界地图视图标签栏：可创建多个地图视图（如"北方地图"、"南方地图"），每个视图独立保存地点和连线
- 章节排序功能：搜索框旁新增排序下拉菜单，支持手动排序和按名称排序
- 记住最后编辑的章节：重新打开软件时自动恢复上次编辑的章节
- 地图和关系网缩放功能：支持鼠标滚轮缩放、+/- 按钮缩放、重置视图

### 修复
- 修复章节编辑区标题不能更改的问题（onChange 未同步 current 状态）
- 修复章节选择区长标题突破容器边界（添加 overflow: hidden 和 min-width: 0）
- 修复章节元数据（状态、场景、摘要、笔记）修改后编辑区不更新
- 修复进入软件后需要重新点击章节才显示内容的问题
- 修复打包后开发模式页面卡在加载（better-sqlite3 架构不匹配）
- 修复世界地图创建地点后看不到的问题（view_id 字段缺失）

### 变更
- 世界地图只使用"地理"和"关键地点"分类创建节点，不再从时间线提取
- 删除章节排序中的"按时间排序"选项

## [1.2.5] - 2026-08-14

### 修复
- 修复人物卡片编辑不自动保存的问题（切换人物时丢失修改）
- 修复地图节点无法点击选中的问题（foreignObject 拦截点击事件）
- 修复 Ollama 本地模型接口不存在的问题（暂时移除）

## [1.2.2] - 2026-08-12

### 修复
- 修复恶性 bug：快速切换章节时内容互相污染，导致其他章节的内容被错误替换或清空
  - 根因：`selectChapter` 中使用 React 状态 `current` 在批量更新时为旧值，导致保存到错误章节
  - 修复：使用 `currentRef` 立即跟踪当前章节，并在切换时同步更新编辑器内容
- 数据库层 `updateChapter` 改为原子 UPDATE，避免并发保存的竞态条件
- 编辑器 `Ctrl+Shift+I` 可在打包版中打开开发者工具

## [1.2.1] - 2026-08-11

### 新增
- AI 流式输出：AI 回复现在会逐字显示，而非等待全部生成完毕后一次性展示
- 便签编辑功能：暂存区的便签保存后仍可点击编辑按钮修改内容
- 人物卡片拖拽：人物列表中的卡片支持拖动调整顺序
- 关系编辑功能：已创建的人物关系支持编辑类型、方向、标签和说明

### 变更
- 编辑器底部留白优化：输入到文档末尾时仍可滚动，保留 40% 视口高度的空白区域
- AI 消息可复制：AI 回复内容现在支持选中和复制文本

### 修复
- 修复 AI 输出时显示空白区域的问题
- 修复 IPC 流式处理句柄持有过期窗口引用导致 AI 流式输出和备份事件在窗口重建后静默失效

## [1.1.1] - 2026-08-11

### 新增
- 32 位系统支持：安装包同时包含 x64 和 ia32 架构，自动选择
- AI 对话历史持久化：对话记录保存到数据库，关闭程序后重新打开仍可查看
- AI 项目上下文缓存：避免重复查询数据库，减少 token 消耗

### 变更
- 移除弹窗点击空白处关闭的功能，所有弹窗只能通过关闭按钮退出
- AI 提取代理提示词优化：提取信息更完整，新增别名、关系、备注、伏笔回收等字段
- 关系网节点形状/颜色改为单个节点独立设置

### 修复
- 修复面板拖拽 mousedown 监听器导致弹窗意外关闭
- 修复数据库修复函数中的死代码
- 修复 Ollama 模型下载无超时保护

### 修复
- 移除弹窗点击空白处关闭的功能，所有弹窗只能通过关闭按钮退出
- 修复面板拖拽 mousedown 监听器导致弹窗意外关闭

## [1.1.0] - 2026-08-11

### 新增
- 关系网节点形状选择：支持圆形、三角形、方形三种节点形状
- 关系网节点颜色选择：支持按角色自动配色或选择 8 种固定颜色
- 关系网节点拖拽：鼠标拖拽可自由移动节点位置
- 关系网节点缩放：滚轮可调整节点大小
- SVG 世界地图安全渲染：使用 DOMPurify SVG 专用配置清理输出

### 修复
- 修复 SVG 世界地图生成失败（sanitizeHtml 过滤了 SVG 标签）
- 修复人物列表「创建关系」按钮文字显示为「物关系」
- 修复数据库修复函数中的死代码（避免打开损坏数据库时崩溃）
- 修复 Ollama 模型下载无超时保护（添加 30 分钟超时）
- 修复 AI 地图生成错误提示不详细

## [1.0.0] - 2026-08-11

### 正式版发布
- 经过多个版本迭代，小说创作工坊正式发布 1.0 版本

### 新增
- AI 服务商内置：20+ 个服务商、80+ 个模型（含小米 MiMo/Plan、DeepSeek V4、Qwen3、GPT-4.1、Claude、Gemini 等）
- Ollama 本地模型集成：自动检测安装、一键启动服务、一键下载模型、调用时自动启动
- AI 配置简化：选服务商 → 选模型 → 填 Key，三步完成
- AI 错误提示增强：连接失败显示具体原因
- 赞赏页面：支持微信/支付宝打赏
- 数据库完整性检查与自动修复
- 备份轮转：每个项目最多保留 30 个备份
- 自动更新：集成 electron-updater
- 全局错误处理与 React Error Boundary
- 无障碍优化：关键元素添加 role、aria-label 等属性
- Playwright GUI 自动化测试

### 变更
- Lucide SVG 图标系统：替换所有 Emoji 为统一风格的矢量图标
- CodeMirror 按需加载：编辑器改为动态 import，首屏减少 523KB
- 生产构建优化：开启 minify、关闭 sourcemap，JS 体积减少 42%
- 代码分割：视图组件 React.lazy 懒加载
- 性能优化：React.memo、useCallback/useMemo、DB 预编译语句缓存
- ESLint + Prettier：统一代码风格
- 设置页面不可点击空白处关闭，防止误操作

### 修复
- 修复导入数据库未执行迁移
- 修复 FTS5 全文索引不可靠
- 修复备份轮转双重 statSync 崩溃
- 修复 Ollama 本地模型无需 API Key
- 修复数据库损坏自动检测与重建
- 修复多项代码质量与 lint 问题

## [0.9.0] - 2026-08-10

### 新增
- 双向链接：编辑器支持 `[[名称]]` 语法高亮和点击跳转，自动查找人物/章节/设定并导航
- 增强阅读模式：全屏舒适排版，支持字体大小调节、首行缩进、上一章/下一章导航、章节进度显示
- AI 续写上下文：续写时自动携带前 1-3 章摘要作为上下文，勾选「附加项目设定」时也会附带上一章摘要
- 角色出场追踪：人物编辑面板新增「出场章节」区域，自动扫描所有章节统计角色出场次数
- 素材暂存区：右侧面板新增「暂存」标签页，快速记录灵感片段，支持插入到正文
- AI 严格编辑模式：以挑剔的资深编辑身份审阅文字，逐条列出问题并评分
- AI 夸夸骨灰粉模式：以狂热粉丝身份赞美文字，找出闪光点并给出"封神指数"
- 分屏编辑：章节列表点击 ⧉ 按钮可同时打开两个章节左右对比编辑
- 版本标签：给重要版本打标签（如"投稿版""终稿"），对比选择器中显示标签
- 大纲拖拽排序：大纲节点支持拖拽调整顺序，同级节点交换顺序，跨级节点移动父节点
- AI 自动摘要：摘要输入框旁新增「AI 摘要」按钮，一键用 AI 生成章节摘要
- AI 续写多候选：续写按钮右键触发 3 候选模式，并行生成 3 个版本供选择
- AI 角色一致性检查：新增思考动作，检测角色在不同章节的性格/说话/行为是否一致
- 代码质量优化：修复所有 ESLint 错误，清理未使用变量，修复 React Hook 依赖
- 新增 README.md 项目文档，包含完整的安装、使用、开发指南
- 关键函数添加 JSDoc 注释

### 变更
- `Editor.jsx`：新增 wiki-link ViewPlugin，`[[名称]]` 语法高亮为蓝色下划线，支持点击跳转
- `AIPanel.jsx`：续写函数自动获取前几章摘要，新增严格编辑/夸夸骨灰粉/3候选续写模式
- `ChaptersView.jsx`：新增阅读模式字体控制、章节导航、暂存面板、分屏编辑、AI 摘要按钮
- `Workspace.jsx`：新增 `jump-tab` 事件监听，支持跨标签页跳转
- `electron/ipc.js`：新增 `character:appearances`、`version:tag` 处理器
- `electron/preload.js`：桥接 `characterAppearances`、`setVersionTag` API
- `electron/db.js`：`chapter_versions` 表新增 `tag` 列（自动迁移）
- `electron/services/versions.js`：新增 `setVersionTag` 函数
- `CharactersView.jsx`：新增出场章节列表展示
- `OutlineView.jsx`：大纲节点支持拖拽排序
- `VersionPanel.jsx`：版本列表支持打标签、编辑标签
- `StagingPanel.jsx`：新建素材暂存区组件
- `aiThink.jsx`：新增「角色一致性」思考动作
- `index.css`：新增阅读模式、暂存面板、wiki-link 等样式

## [0.8.0] - 2026-08-09

### 新增
- Ollama 集成：自动检测安装状态、一键启动服务、一键下载模型、自动启动
- MiMo Plan 独立服务商：使用专用 API 地址

### 变更
- AI 错误提示优化：连接测试显示用户选择的模型名，而非 API 返回值
- 设置页面不可点击空白处关闭，防止误操作
- Ollama 本地模型不再强制要求 API Key

## [0.8.0] - 2026-08-09

### 新增
- AI 服务商内置：内置小米 MiMo、SiliconFlow、DeepSeek、OpenAI、通义千问、月之暗面、Ollama 本地共 8 个服务商
- AI 配置简化：选择服务商后自动填充 API 地址，下拉选择模型，无需手动填写 URL 和模型名
- AI 错误提示增强：连接失败时显示具体原因（Key 无效、余额不足、网络不通、超时等）

### 变更
- AI 设置页重写：服务商下拉 → 模型下拉 → 填 Key，三步完成配置
- 自定义模式保留：高级用户仍可手动填写 API 地址和模型名
- API 错误解析：解析服务商返回的 JSON 错误详情
- 内置服务商扩充至 20 个，模型 80+ 个（含小米 MiMo V2.5 Pro/Plan、DeepSeek V4 Flash/Pro、Qwen3、GPT-4.1、o3 等最新模型）

## [0.7.0] - 2026-08-09

### 新增
- 数据库修复机制：启动时自动检测完整性，损坏时自动备份并重建
- 备份轮转：每个项目最多保留 30 个备份，自动清理旧备份
- 自动更新：集成 electron-updater，启动后自动检查新版本
- 全局错误处理：添加 window.onerror 捕获未处理异常
- 无障碍优化：关键元素添加 role、aria-label、tabIndex 等属性
- ESLint + Prettier：统一代码风格，新增 lint/format 命令

### 变更
- 性能优化：React.memo 防止列表项无效重渲染，useCallback/useMemo 缓存
- CodeMirror 按需加载：编辑器改为动态 import，首屏减少 523KB
- DB 预编译语句缓存：高频 SQL 复用 prepared statement

### 修复
- 修复 replaceDb 未调用 migrate 导致导入旧版数据库缺列/表
- 修复 FTS5 全文索引不可靠，改用 rebuild 每次启动重建
- 修复 autoUpdater dev-mode 检查误判，改用 app.isPackaged
- 修复 Editor 并发加载 CodeMirror 重复请求，共享 Promise
- 修复备份轮转双重 statSync 文件删除时崩溃
- 修复 ChapterItem memo 因内联函数完全无效

## [0.6.0] - 2026-08-09

### 新增
- SVG 图标系统：引入 Lucide 图标库，替换所有 Emoji 和 Unicode 符号为统一风格的 SVG 矢量图标
- React Error Boundary：添加错误边界组件，防止组件渲染崩溃导致白屏
- HTML 清理工具：集成 DOMPurify，对 Markdown 渲染输出进行 XSS 安全过滤
- SQLite FTS5 全文搜索：章节内容搜索改用 FTS5 索引，提升大数据量下的搜索性能

### 变更
- 代码分割：Workspace 视图组件改为 React.lazy 懒加载，首屏加载体积减少 78%
- 生产构建优化：开启 minify、关闭 sourcemap，JS 体积减少 42%
- 代码清理：移除 39 个文件中不必要的 React 导入，删除死代码 Test.jsx
- 去重优化：合并 ipc.js 与 common.js 中重复的 sanitize 函数，清理冗余 require 调用
- CSS 优化：合并重复的 button.primary 和 input:focus 样式规则
- 图标统一：替换所有导航栏、工具栏、帮助页面中的 Emoji 为 Lucide SVG 图标
- 箭头符号统一：替换 ◀▶▲▼▾▸↑↓→ 等 Unicode 符号为对应的 Lucide 图标组件

### 修复
- 修复了 100 个漏洞

## [0.5.0] - 2026-08-07

### 新增
- AI 提取代理：独立面板粘贴任意小说文本，自动提取人物 / 世界观 / 物品道具 / 年表事件 / 伏笔五大类实体，逐条确认后批量创建到数据库
- 工作区侧栏新增「🔬 提取」标签页，独立于 AI 对话面板

### 变更
- `electron/ai.js`：新增 `aiExtractEntities` 函数，结构化输出五大类实体 JSON
- `electron/ipc.js`：注册 `ai:extract-entities` IPC 处理器
- `electron/preload.js`：桥接 `aiExtractEntities` API
- `src/components/ExtractAgentView.jsx`：新建提取代理面板组件，含文本输入 / 分类分页 / 逐条编辑 / 批量创建
- `src/components/Workspace.jsx`：侧栏新增「提取」标签页与快捷键绑定
- `src/components/Home.jsx`、`SettingsModal.jsx`：版本号更新
- `package.json`：版本升至 0.5.0

## [0.4.0] - 2026-08-07

### 新增
- 版本对比增强：并排 diff 视图（逐行对照双栏排版）+ 统一/并排视图切换
- 写作统计图表：统计面板新增 7 天 / 30 天 / 90 天周期切换按钮，图表数据动态截取
- 导出 PDF：支持将项目导出为 PDF 文件（HTML → printToPDF 渲染，保留标题与章节样式）
- AI 续写：光标感知续写（仅发送光标前文作为上下文，支持插入到光标位置）
- 自动敏感词检测：敏感词字典管理 + 自动扫描高亮（橙色标记，独立面板）

### 变更
- `VersionPanel.jsx`：新增 `SideBySideDiff` 并排对比组件与 `viewMode` 切换状态
- `StatsView.jsx`：新增 `chartDays` 状态与 7/30/90 天周期选择按钮组
- `DataMenu.jsx`：导出区新增「导出 PDF」按钮
- `AIPanel.jsx`：新增光标感知续写 `continueWrite` 函数与应用插入逻辑
- `SensitiveWordsPanel.jsx`：新建敏感词管理面板，自动扫描 + 高亮
- `Editor.jsx`：`buildDecorations` 支持 `kind:'sensitive'` 橙色标记样式
- `ChaptersView.jsx`：右侧面板新增「敏感词」标签页，传递 `cursorRef` 给 `AIPanel`
- `electron/ipc.js`：新增 `export:pdf` IPC 处理器，使用 `printToPDF` + 保存对话框
- `electron/preload.js`：桥接 `exportNovelAsPdf` API
- `src/index.css`：新增 `.sensitive-mark` 橙色高亮样式与 `.badge.orange` 徽标样式
- `package.json`：版本升至 0.4.0

## [0.3.1] - 2026-08-07

### 新增
- 删除确认弹窗：人物关系/自定义主题/错字词典条目等破坏性操作增加二次确认
- 自动保存状态指示：编辑器底栏实时显示「✓ 已保存 / ⟳ 保存中...」
- 窗口状态持久化：自动保存/恢复窗口位置与大小
- 系统深色模式自适应：新增「跟随系统」开关，自动在暗色/护眼主题间切换

### 变更
- `ChaptersView.jsx`：底栏新增保存状态徽标
- `electron/main.js`：监听 `resize` / `move` 事件持久化窗口 bounds
- `themes.jsx`：新增 `autoTheme` 状态与 `prefers-color-scheme` 媒体查询监听
- `SettingsModal.jsx`：主题设置页新增「跟随系统」开关按钮

## [0.3.0] - 2026-08-07

## [0.2.0] - 未记录