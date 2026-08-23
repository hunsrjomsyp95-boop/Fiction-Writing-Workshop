# Bug 修复手册（完整版）

> 合并自 `看我：bug修复记录.txt` 和 `bug修复手册-整理版.md`，包含症状、根因、排查过程、修复方案和关键教训。

---

## 一、React 状态管理类

### 1. 章节内容互相污染（v1.2.2）
**症状**: 快速切换章节时，其他章节内容被错误替换或清空  
**复现**: 快速连续点击不同章节

**排查过程**:
1. 先怀疑数据库层 → 排查后发现每章独立存储，schema 没问题
2. 怀疑 Editor 的 hasFocus 守卫 → 移除后发现不是根因
3. 添加调试日志 → 发现 selectChapter 中 doSave 保存到了错误的章节
4. 写 Playwright 自动化测试复现 → 确认根因

**根因**（两层问题）:
1. React 状态 `current` 是批量更新的 — 快速连续调用 selectChapter 时，current 还是更早的值，导致 doSave(current, contentRef.current) 中 current 指向错误章节
2. 编辑器 hasFocus 守卫阻止内容更新 — Editor.jsx 的 useEffect([value]) 有 `if (viewRef.current.hasFocus) return`，切换章节时编辑器仍有焦点，新内容不写入编辑器

**修复**（ChaptersView.jsx）:
- selectChapter 中用 `currentRef.current` 替代 `current`（ref 立即更新）
- 切换时直接 `view.dispatch()` 同步更新编辑器内容
- 清除旧的 `saveTimer`，避免定时器在错误章节触发保存
- 调用 `view.contentDOM.blur()` 确保编辑器失焦

**配套改进**: 写了 Playwright 测试 (e2e-gui/chapter-bug.spec.js)

---

### 2. 章节编辑区状态不同步 + 列表溢出（2026-08-14）
**症状**:
1. 编辑区顶部的章节名称输入框无法更改
2. 章节名称太长会突破选择区框架
3. 修改状态/场景/摘要/笔记后，编辑区显示不更新

**排查过程**:
- 检查 ChaptersView.jsx 的 input 绑定 → 发现 onChange 只更新 chapters 数组，没更新 current
- 检查 CSS 样式 → 发现 .tree-item 缺少 min-width: 0
- 检查其他元数据字段 → 发现状态/场景/摘要/笔记修改后都没有同步 current

**根因**: React 受控组件状态不一致。input 的 value 绑定的是 current.title，但 onChange/onBlur 只更新了 chapters 数组，没有更新 current 状态。

**修复**（ChaptersView.jsx + index.css）:
```js
// 1. 标题 onChange 同步 current
onChange={(e) => {
  const newTitle = e.target.value
  setChapters((l) => l.map((c) => (c.id === current.id ? { ...c, title: newTitle } : c)))
  setCurrent((c) => (c && c.id === current.id ? { ...c, title: newTitle } : c))
}}

// 2. 标题 onBlur 同步 current
onBlur={async (e) => {
  if (!current) return
  const u = await window.api.updateChapter(current.id, { title: e.target.value || '未命名' })
  setChapters((l) => l.map((c) => (c.id === u.id ? u : c)))
  setCurrent(u)
}}

// 3. 状态/场景/摘要/笔记修改后同步 current
onChange={async (e) => {
  const u = await window.api.updateChapter(current.id, { status: e.target.value })
  setChapters((l) => l.map((c) => (c.id === u.id ? u : c)))
  setCurrent(u)
}}

// 4. AI 生成摘要后同步 chapters
setCurrent((c) => ({ ...c, summary }))
setChapters((l) => l.map((c) => (c.id === current.id ? { ...c, summary } : c)))
```

```css
/* 5. CSS 溢出限制 */
.tree-item { overflow: hidden; min-width: 0; }
.sidebar { overflow: hidden; min-width: 0; }
.list-header { overflow: hidden; }

/* 6. 按钮防压缩 */
<button style={{ flexShrink: 0 }}>...</button>
```

---

### 3. React Hooks 违规导致白屏
**症状**: 统计页面白屏  
**根因**: StatsView.jsx 中 `useState(30)` 放在 `if (!stats) return` 之后，违反 Hooks 调用顺序规则

**修复**: 将 `useState(30)` 移到组件顶部（第 14 行）

---

### 4. 选区润色替换位置错误（v1.3.5）
**症状**: 选中文字润色后，替换位置错误或替换全文  
**根因**: handlePolish 调用 onAction 后立即调用 onClose 清空了 selection 状态，异步 AI 请求完成后用 `selection?.from ?? 0` 拿到的是 0

**修复**（ChaptersView.jsx）:
```js
// 旧：直接用 selection（已被清空）
v.dispatch({ changes: { from: selection?.from ?? 0, to: selection?.to ?? 0, insert: polished } })

// 新：操作前保存选区
const sel = selection
// ... 异步操作后用 sel.from / sel.to
v.dispatch({ changes: { from: sel.from, to: sel.to, insert: polished } })
```

---

## 二、数据库并发类

### 5. updateChapter 并发写入竞态（v1.2.2）
**症状**: 多个章节内容被互相覆盖  
**根因**: 先读后写模式，两个快速连续调用读取到过期数据，后一次写入覆盖前一次

**修复**（electron/services/chapters.js、electron/services/characters.js）:
```js
// 旧：先读后写（有竞态风险）
const cur = getChapter(id)
const next = { ...cur, ...patch }
UPDATE chapters SET 全部字段 WHERE id=?

// 新：原子 UPDATE（只更新传入的字段）
const sets = cols.filter(c => patch[c] !== undefined).map(c => `${c}=?`)
UPDATE chapters SET 变化的字段 WHERE id=?
```

---

### 6. 全局替换后编辑器内容不刷新（v1.3.2）
**症状**: 提示"已替换 X 处"，但编辑器显示旧内容  
**根因**: 数据库更新后内存中的对象不会自动同步

**排查过程**:
1. 检查 electron/services/search.js → 数据库更新逻辑正确
2. 检查 SearchModal.jsx → 只调用了 toast，没有触发刷新
3. 检查 Workspace.jsx → SearchModal 只传了 onJump，没有 onReplace 回调
4. 检查 ChaptersView.jsx → 从 ch.content 读取，但 ch 对象是旧的

**修复**（3 个文件）:
```js
// SearchModal.jsx — 新增 onReplace 回调
if (onReplace) onReplace()

// Workspace.jsx — 新增 reloadChapter 函数
const reloadChapter = () => {
  window.dispatchEvent(new CustomEvent('reload-chapter'))
}
<SearchModal ... onReplace={reloadChapter} />

// ChaptersView.jsx — 监听事件重新加载
useEffect(() => {
  const h = async () => {
    const cur = currentRef.current
    if (!cur) return
    const fresh = await window.api.getChapter(cur.id)
    if (fresh) selectChapterRef.current(fresh)
  }
  window.addEventListener('reload-chapter', h)
  return () => window.removeEventListener('reload-chapter', h)
}, [])
```

---

## 三、Electron 打包类

### 7. 打包后开发模式页面卡在加载（2026-08-14）
**症状**: `npm run dev` 后页面一直显示"加载中"  
**排查**: Home.jsx → novels 状态一直是 null → 控制台发现 better-sqlite3 报错：`is not a valid Win32 application`  
**根因**: 打包 ia32 版本后，`better-sqlite3` 被重编译为 32 位，x64 Electron 无法加载  
**修复**: `npx electron-rebuild -f -w better-sqlite3`

---

### 8. 打包版启动报错 Cannot find module 'undici'（v1.3.3）
**症状**: 打包后启动报错  
**根因**: `undici` 是 Node.js 内置模块，Electron 打包后不可直接 require  
**修复**: 改用 `node-fetch` 和 `https-proxy-agent`

---

### 9. 打包卡住不动（反复出现）
**症状**: electron-builder 卡在 packaging 步骤  
**根因**: 残留 node 进程占用资源，或 Electron 二进制下载超时  
**修复**:
```powershell
Stop-Process -Name "node" -Force
# 然后重试打包
```

---

### 10. 构建错误 EBUSY: resource busy or locked
**症状**: 打包时报错 `EBUSY: resource busy or locked`  
**根因**: Windows Defender 或杀毒软件锁定文件  
**修复**: 使用不同输出目录
```powershell
npx electron-builder --win --dir --config.directories.output=C:\Temp\ns-build
```

---

### 11. 安装程序"被旧程序占用"（v1.2.1）
**症状**: 安装新版时提示旧程序正在运行  
**根因**: `installer.nsh` 进程检测逻辑不正确  
**修复**: 恢复原始 `installer.nsh`（含 taskkill 逻辑），移除 `customCheckAppRunning` 宏

---

### 12. 安装程序覆盖安装失败
**症状**: 安装时提示 "Failed to uninstall old application files"  
**根因**: 旧版本文件被锁定  
**修复**: 在 electron-builder.yml 中添加 NSIS 配置
```yaml
nsis:
  deleteAppDataOnUninstall: false
  runAfterFinish: true
  warningsAsErrors: false
```

---

### 13. dist 构建卡住（v1.2.1）
**症状**: `npm run dist` 卡在 packaging 步骤  
**根因**: node_modules 中有重复依赖或损坏的包  
**修复**: 删除 node_modules，重新 npm install，然后 `npm dedupe` 去重

---

### 14. 打包后启动报错 SyntaxError（v1.3.5）
**症状**: 打包后启动报错 SyntaxError: Unexpected token '{'  
**根因**: Electron 解压到临时目录后运行，旧缓存导致冲突  
**修复**: 删除 `C:\Users\XTHT\AppData\Local\Temp` 下的临时目录后重试

---

### 15. 自动更新不生效（v1.3.5）
**症状**: 安装版启动后不弹出更新提示  
**根因**: artifactName 包含 `${arch}`，导致实际文件名和 latest.yml 不一致  
**修复**: 移除自定义 artifactName，使用默认命名

---

### 16. 打包版本号自动递增（v1.3.5 → v1.3.6）
**症状**: 打包时版本号自动从 1.3.5 变成 1.3.6  
**根因**: electron-builder 检测到 GitHub Release 已存在 v1.3.5，自动递增  
**修复**: 发布前先删除旧 Release 和 tag
```powershell
gh release delete v1.3.5 --yes
git tag -d v1.3.5
git push origin :refs/tags/v1.3.5
```

---

### 17. electron-builder 命令找不到
**症状**: 直接运行 `electron-builder --win` 报 CommandNotFoundException  
**修复**: 使用 `npx electron-builder --win` 调用

---

## 四、UI/CSS 类

### 18. 地图节点无法点击选中（v1.2.5）
**症状**: 地图节点点击无反应  
**根因**:
1. SVG 内 `foreignObject` 拦截点击事件，没有冒泡到外层 g 元素
2. SVG 的 onClick（清空选中）在节点点击后触发，覆盖了选中状态
3. onMouseDown 的 `e.preventDefault()` 阻止了后续 onClick 触发

**修复**（WorldMap.jsx）:
- `foreignObject` 加 `style={{ pointerEvents: 'none' }}` 让点击穿透
- 用 `dragMoved` ref 追踪是否移动超过 3px，区分拖拽和点击
- 节点用 `onContextMenu`（右键）选中，左键拖动
- 节点点击时 `e.stopPropagation()` 阻止冒泡

---

### 19. 光标颜色不显示/丢失（反复出现）
**症状**: 暗色主题下光标不可见，切换主题后丢失  
**修复**:
```js
// themes.jsx 动态设置
document.documentElement.style.setProperty('--cursor-color', ...)
// index.css 兜底
.cm-cursor { border-left-color: var(--cursor-color, var(--accent)) !important }
```

---

### 20. 竖排色差问题（v0.5.0）
**症状**: 文字上下方有颜色更深的一列  
**根因**: `background` 简写重置了所有 `background-*` 属性  
**修复**: 
- 去掉多余的 `background: transparent`
- `EditorView.theme` 改用 `backgroundColor`（不用 `background` 简写）
- `.cm-gutters` 改回 `backgroundColor: 'var(--bg)'`

---

### 21. 写作模式编辑器背景变透明
**症状**: 写作模式下编辑器背景透明，文字下方出现主界面  
**修复**:
```css
.editor-wrap { background: color-mix(in srgb, var(--bg) 88%, transparent) }
.editor-wrap .cm-editor { background: transparent !important }
.editor-wrap .cm-scroller { background: transparent }
.editor-wrap .cm-content { background: transparent; padding: 12px 8px }
```

---

### 22. 编辑器无法向下滚动（v1.3.0）
**症状**: 导入文档后编辑器只能在上面编辑  
**根因**: `.editor-wrap` 和 `.cm-scroller` 都设了 `overflow: auto`，嵌套滚动冲突  
**修复**:
- 移除 `.editor-wrap` 的 `overflow: auto`
- 切换内容后调用 `requestMeasure()` 刷新布局

---

### 23. 编辑器底部留白不足
**症状**: 输入到文档末尾后无法继续滚动  
**修复**: `.cm-scroller { padding-bottom: 40vh; }`

---

### 24. 列表溢出
**症状**: 章节名称太长突破选择区框架  
**根因**: flex 子元素默认 `min-width: auto` 阻止收缩  
**修复**: `.tree-item { overflow: hidden; min-width: 0; }`

---

### 25. 点击编辑区关闭面板
**症状**: 点击编辑区会关闭左侧面板  
**根因**: `document.addEventListener('mousedown', ...)` 检测点击外部区域  
**修复**: 删除 ChaptersView.jsx、AIServiceView.jsx、OutlineView.jsx 中的 mousedown 事件监听器

---

### 26. AI 消息无法复制
**症状**: AI 回复的文本无法选中和复制  
**根因**: body 设置了 `user-select: none`  
**修复**: `.ai-msg { user-select: text; cursor: text; }`

---

## 五、AI 功能类

### 27. AI 流式输出报错 getReader is not a function（v1.3.5）
**症状**: AI 写作功能报错  
**根因**: `node-fetch v2` 的 `res.body` 是 Node.js Readable 流，不支持 Web Streams API  
**修复**:
```js
// 旧：Web Streams API
const reader = res.body.getReader()
for (;;) {
  const { done, value } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })
}

// 新：Node.js 异步迭代器
for await (const chunk of stream) {
  buffer += chunk.toString()
}
```

---

### 28. AI 实体提取长文本超时（v1.3.1）
**症状**: 大量文本提取时显示"提取失败：This operation was aborted"  
**根因**: 默认超时 180 秒不够  
**修复**: 文本超过 25,000 字时自动按段落拆分，每段独立调用，每段 300 秒超时，合并结果按名称去重

---

### 29. AI 输出卡顿
**症状**: AI 回复等待很久后才一次性显示  
**根因**: 使用非流式 API（`stream: false`）  
**修复**: 实现 `chatStream` 函数，使用 SSE 逐字显示

**后端改动**:
- electron/ai.js — 添加 chatStream 函数
- electron/ipc.js — 添加流式 IPC 处理器
- electron/preload.js — 暴露 window.aiStream API
- electron/main.js — 传递 win 对象给 registerAll

**前端改动**:
- AIPanel.jsx、AIServiceView.jsx — 使用流式 API
- index.css — 添加打字光标动画

---

### 30. Ollama 本地模型接口不存在（v1.2.5）
**症状**: 选择 Ollama 本地模型后报"接口不存在"  
**根因**: 旧版 Ollama 没有 `/v1/chat/completions` 接口  
**处理**: v1.2.5 暂时移除 Ollama 功能，后续版本重新适配

---

## 六、人物/角色类

### 31. 人物卡片编辑不自动保存（v1.2.5 / v1.3.0）
**症状**: 编辑人物后切换，修改丢失  
**修复**（CharactersView.jsx）:
- 新增 `saveTimer` ref 和 `doSave`/`scheduleSave` 函数
- `updateFormField` 中调用 `scheduleSave(next)` 实现 1.2 秒 debounce 自动保存
- create 新建人物前先保存当前编辑中的表单
- openEdit 切换人物时清除旧定时器再保存
- "关闭"/"取消"按钮也会先保存再关闭面板

```js
const scheduleSave = useCallback((data) => {
  if (saveTimer.current) clearTimeout(saveTimer.current)
  saveTimer.current = setTimeout(() => doSave(data), 1200)
}, [doSave])
```

---

### 32. 关系网反向标签不显示（v1.3.4）
**症状**: 双向关系两条线都显示正向标签  
**根因**: computeLayout 函数构建边数据时漏掉了 `type_b` 字段  
**修复**:
```js
// 旧：只传递 type 和 dir
const edges = rels.map((r) => ({ a: r.char_a_id, b: r.char_b_id, type: r.type, dir: r.direction }))

// 新：加上 type_b
const edges = rels.map((r) => ({ a: r.char_a_id, b: r.char_b_id, type: r.type, type_b: r.type_b, dir: r.direction }))
```

---

### 33. 双向关系优化（v1.3.4）
**需求**: 双向关系需要分别标注两个方向的标签  
**实现**:
- 创建/编辑关系表单：双向时显示两个输入框
- RelationGraph：A→B 线箭头指向 B，B→A 线箭头指向 A
- 数据库 relations 表新增 type_b 字段

---

## 七、文件导入类

### 34. GBK 编码文件导入乱码（v1.3.0）
**症状**: 导入 GBK 编码的 txt 文件显示乱码  
**根因**: 硬编码 `fs.readFileSync(path, 'utf-8')`  
**修复**: 安装 `chardet` + `iconv-lite`，自动检测编码后读取

```js
function readTextFile(filePath) {
  const buf = fs.readFileSync(filePath)
  const detected = chardet.detect(buf)
  const candidates = detected ? [detected] : []
  if (!candidates.includes('UTF-8')) candidates.push('UTF-8')
  if (!candidates.includes('GB18030')) candidates.push('GB18030')
  for (const enc of candidates) {
    const norm = enc.toLowerCase().replace(/[^a-z0-9]/g, '')
    try {
      if (norm === 'utf8' || norm === 'ascii') {
        const text = buf.toString('utf-8')
        if (!text.includes('\ufffd')) return text
      } else if (iconv.encodingExists(norm)) {
        return iconv.decode(buf, norm)
      }
    } catch {}
  }
  return buf.toString('utf-8')
}
```

---

### 35. 文件导入对话框不显示文件（v1.3.0）
**症状**: 导入对话框看不到 txt/docx 文件  
**根因**: `openFile` 和 `openDirectory` 同时存在时 Windows 不显示文件  
**修复**: 分离为两个按钮（导入文件 / 导入文件夹）

---

## 八、ESLint 批量处理

### 36. ESLint no-constant-condition 错误（3 处）
**问题**: `while (true)` 循环被 ESLint 报错  
**修复**: 添加 `// eslint-disable-next-line no-constant-condition`
- electron/typo.js:10
- src/components/SensitiveWordsPanel.jsx:38
- src/components/TypoCheckPanel.jsx:53

---

### 37. ESLint no-unused-vars 警告（约 40 处）
**修复方式**:
- 删除未使用导入（ChevronLeft、useDialog、countChars 等）
- 删除未使用变量（dumpFile、sql、selectedCount 等）
- 添加下划线前缀（readOnly → _readOnly）
- 注释掉未完成代码（标记为 TODO）

---

### 38. React Hook exhaustive-deps 警告（约 20 处）
**修复方式**: 保留函数在外部 + `eslint-disable-next-line react-hooks/exhaustive-deps` 注释

**涉及文件**: Dialog.jsx、AIServiceView.jsx、ChaptersView.jsx、Editor.jsx、ForeshadowView.jsx、MaterialsView.jsx、OutlineView.jsx、TimelineView.jsx、VersionPanel.jsx、ItemsSub.jsx、RulesSub.jsx、WorldsSub.jsx、SettingsAnalyzer.jsx

---

### 39. 重构后 no-undef 错误（约 30 处）
**问题**: 将 load 函数移入 useEffect 内部后，其他地方调用 load() 报未定义  
**修复**: 将函数移回外部，改用 eslint-disable 注释

---

## 九、其他

### 40. preload.js 换行符语法错误
**症状**: 应用启动后渲染进程空白  
**根因**: `\n` 被写成字面量两个字符，导致 JS 语法错误，整个 preload 脚本解析失败  
**修复**: 将字面量 `\n` 替换为实际换行

---

### 41. 便签无法修改
**症状**: 暂存区便签保存后不能编辑  
**根因**: StagingPanel.jsx 没有编辑功能  
**修复**: 添加 editingId 状态和编辑按钮

---

### 42. 运行 shell 命令缓慢
**根因**: PowerShell 5.1 启动开销大（加载 .NET CLR、扫描 83 个模块）  
**修复**:
1. 安装 PowerShell 7：`winget install --id Microsoft.PowerShell`
2. 创建 opencode.json 切换默认 shell：`{ "shell": "pwsh" }`

---

## 十、功能实现记录

### 章节右键菜单（v1.3.0）
- ChapterItem 新增 onContextMenu prop
- ChaptersView 新增 ctxMenu 状态（位置 + 目标章节）
- 右键菜单自动检测视口边界，点击其他区域自动关闭

### Skill 导入功能（v1.3.1）
- electron/services/skills.js — Skill 数据库服务
- src/components/SkillsPanel.jsx — Skill 管理 UI
- ai.js — 自动附加激活的 skill 内容到系统提示词

### AI 代理配置（v1.3.3）
- AISettings.jsx — 新增代理地址输入框
- ai.js — 使用 https-proxy-agent 创建代理 agent
- 支持 HTTP 和 SOCKS5 代理

### GitHub Releases 自动更新
- electron/main.js 集成 electron-updater
- 启动 30 秒后自动检查 GitHub Releases
- 发现新版本弹窗提示下载，下载完成后退出时自动安装

**发布流程**:
1. 改版本号（package.json）
2. 提交代码并打 tag：`git add -A; git commit -m "v1.x.x"; git tag v1.x.x; git push; git push origin v1.x.x`
3. 打包并发布：`$env:GH_TOKEN="token"; npm run build; npx electron-builder --win --x64 --publish always`

### AI 提取实体合并（v1.3.4）
- findByName 函数统一按 name/alias/title 匹配
- mergeText 函数处理文本合并（去重、拼接）
- 非文本字段只在旧值是默认值时覆盖

### AI 自动更新进度条（v1.3.4）
- main.js 发送 update:event 事件到渲染进程
- preload.js 暴露 updateListener.onUpdate API
- Workspace.jsx 监听事件并显示顶部进度条

---

## 关键教训速查表

| 场景 | 正确做法 |
|------|---------|
| 需要立即读取最新状态 | 用 `useRef` 而非 React state |
| 避免闭包拿到旧值 | 用函数式 `setState(prev => ...)` |
| 异步操作前保存状态 | 用变量保存，不依赖闭包中的 state |
| 数据库并发写入 | 用原子 UPDATE，不要先读后写 |
| 数据库更新后刷新 UI | 主动触发重新加载 |
| 区分拖拽和点击 | 用 ref 追踪 moved 标志，阈值 > 3px |
| SVG 内 HTML 元素点击穿透 | `foreignObject` 加 `pointerEvents: 'none'` |
| CSS background 简写问题 | 用 `backgroundColor` 更安全 |
| CodeMirror 滚动 | 外层不要设 `overflow: auto`，用 `requestMeasure()` |
| Electron 打包后原生模块 | 打包后需 `electron-rebuild` 恢复 |
| Electron 打包后内置模块 | 用 npm 包替代（如 `node-fetch`） |
| node-fetch v2 流读取 | 用 `for await...of` 异步迭代器 |
| 自动保存 | debounce 避免频繁写入，切换前先保存 |
| React Hooks | 必须无条件按顺序调用 |
| 版本号管理 | 用 `import.meta.env.VITE_APP_VERSION` 动态读取 |
| 打包不同架构后 | 必须 `electron-rebuild` 恢复开发环境 |
| Electron showOpenDialog | openFile 和 openDirectory 不能混用 |
| 大文本 AI 处理 | 分段处理，避免单次超时 |
| 发布前 | 先删除旧 Release 和 tag，避免版本号冲突 |
| 节点位置持久化 | 保存到数据库，不要只存在内存中 |
| 画布动态适配 | 动态计算 viewBox适配所有节点位置 |
| 拖拽性能优化 | 用 requestAnimationFrame 节流，避免过度渲染 |
| 滚轮事件冒泡 | 节点滚轮事件加 stopPropagation() 阻止冒泡 |
| 自动更新镜像 | GitHub provider 不支持镜像，需用 generic + 自建 OSS |
| 国内更新问题 | GitHub 访问不稳定，用户需开代理或手动下载 |

---

## 十一、画布/节点类（v1.3.7）

### 43. 关系网节点位置不持久化（v1.3.7）
**症状**: 拖拽节点后切换页面，再回来位置重置  
**根因**: `posOverrides` 只存在内存中的 useState，组件卸载就丢失  
**排查**: 检查 characters 表发现没有 graph_x/graph_y 字段  
**修复**（3个文件）:
```js
// 1. db.js - 添加字段
ensureCol('characters', 'graph_x', 'REAL DEFAULT 0')
ensureCol('characters', 'graph_y', 'REAL DEFAULT 0')

// 2. characters.js - updateCharacter 支持新字段
const cols = [..., 'graph_x', 'graph_y']

// 3. RelationGraph.jsx - 拖拽结束保存位置
const handleMouseUp = useCallback(() => {
  if (dragRef.current) {
    const pos = nodesPos[dragRef.current.id]
    if (pos) {
      window.api.updateCharacter(dragRef.current.id, { graph_x: pos.x, graph_y: pos.y })
    }
  }
}, [nodesPos])
```

---

### 44. 地图节点位置不持久化（v1.3.7）
**症状**: 拖拽节点后重新加载，位置恢复原样  
**根因**: `forceLayout` 每次都会重新计算位置，覆盖用户拖拽的位置  
**修复**（WorldMap.jsx）:
- 拖拽结束时调用 `window.api.updateMapNode` 保存位置到数据库
- `forceLayout` 中判断节点有保存位置时直接使用，不重新计算

---

### 45. 画布操作区域限制（v1.3.7）
**症状**: 画布看着很大，但可操作区域很小  
**根因**: 固定 viewBox `0 0 1000 620`，拖拽限制在 `Math.max(30, Math.min(W-30, ...))`  
**修复**（RelationGraph.jsx + WorldMap.jsx）:
```js
// 1. 移除拖拽边界限制
const newX = dragging.nodeStartX + dx  // 不再 Math.max/Math.min
const newY = dragging.nodeStartY + dy

// 2. 动态计算 viewBox适配所有节点
const getViewBox = () => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const nd of layout.nodes) {
    minX = Math.min(minX, nd.x)
    // ...
  }
  const padding = 100
  return `${minX - padding} ${minY - padding} ${Math.max(W, maxX - minX + padding*2)} ${Math.max(H, maxY - minY + padding*2)}`
}
```

---

### 46. 拖拽节点卡顿（v1.3.7）
**症状**: 快速移动节点时卡顿  
**根因**: 每次鼠标移动都触发状态更新和重渲染  
**修复**（RelationGraph.jsx + WorldMap.jsx）:
```js
// 使用 requestAnimationFrame 节流
const rafRef = useRef(null)
const handleMouseMove = useCallback((e) => {
  if (rafRef.current) cancelAnimationFrame(rafRef.current)
  rafRef.current = requestAnimationFrame(() => {
    // 更新节点位置
  })
}, [])

// 使用 ref 存储拖拽状态，减少状态更新
const dragRef = useRef(null)
```

---

### 47. 缩放画面时节点大小改变（v1.3.7）
**症状**: 选中节点后滚轮缩放画面，节点大小也跟着变  
**根因**: 节点的 onWheel 事件冒泡到画布容器，画布也响应滚轮  
**修复**（RelationGraph.jsx）:
```js
const handleWheel = (e, nd) => {
  e.preventDefault()
  e.stopPropagation() // 阻止冒泡到画布
  // 调整节点大小
}
```

---

### 48. 更新进度条弹一下就消失（v1.3.7）
**症状**: 版本更新进度条显示后很快消失，不知道是否更新成功  
**根因**: 前端只在 `status === 'downloading'` 时显示进度条，下载完成后状态变成 `downloaded`，进度条消失但没有提示  
**修复**（Workspace.jsx）:
```js
// 1. 监听 downloaded 状态，显示 toast 提示
useEffect(() => {
  if (!window.updateListener) return
  return window.updateListener.onUpdate((data) => {
    setUpdateStatus(data)
    if (data.status === 'downloaded') {
      toast('更新已下载完成，将自动安装', 'success')
    }
  })
}, [])

// 2. 添加 downloaded 状态的 UI 显示
{updateStatus && updateStatus.status === 'downloaded' && (
  <div style={{ background: '#22c55e', color: '#fff', padding: '4px 16px', fontSize: 12 }}>
    更新已下载完成，重启后自动安装
  </div>
)}
```

---

### 49. 自动更新失败 net::ERR_CONNECTION_TIMED_OUT（v1.3.7）
**症状**: 自动更新检查失败，提示连接超时  
**根因**: 国内访问 GitHub 不稳定，被墙或超时  
**处理**: 
- 自动更新功能本身正常，但需要稳定的网络环境
- 国内用户需要开代理/VPN 才能稳定更新
- 或者用户可以从 GitHub Release 页面手动下载安装包

---

### 50. 自动更新镜像加速无效（v1.3.7）
**症状**: 配置了 ghfast.top 镜像，但下载速度没有变化  
**根因**: `electron-updater` 的 GitHub provider 不支持通过 `host` 配置使用镜像，它会直接访问 GitHub API  
**处理**: 
- 放弃镜像方案，保持直接访问 GitHub
- 如果需要镜像加速，需要使用 `generic` provider 并自建 OSS 托管更新文件
