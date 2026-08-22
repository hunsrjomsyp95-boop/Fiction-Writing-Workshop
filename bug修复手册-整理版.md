# Bug 修复手册（整理版）

## 一、React 状态管理类

### 1. 章节内容互相污染（v1.2.2）
**症状**: 快速切换章节时，其他章节内容被错误替换或清空  
**根因**: 
- React 状态 `current` 是批量更新的，快速连续调用时 `current` 指向错误章节
- 编辑器 `hasFocus` 守卫阻止内容更新，新内容不写入编辑器

**修复**:
- 用 `currentRef.current` 替代 `current`（ref 立即更新）
- 切换时直接 `view.dispatch()` 同步更新编辑器内容
- 清除旧的 `saveTimer`，调用 `view.contentDOM.blur()` 确保失焦

---

### 2. 章节编辑区状态不同步（2026-08-14）
**症状**: 章节名称输入框无法更改，修改状态/场景/摘要后编辑区不更新  
**根因**: `onChange`/`onBlur` 只更新 `chapters` 数组，没有同步更新 `current` 状态

**修复**:
```js
// onChange 和 onBlur 中同步 current
setCurrent((c) => (c && c.id === current.id ? { ...c, title: newTitle } : c))
// AI 生成摘要后也要同步
setChapters((l) => l.map((c) => (c.id === current.id ? { ...c, summary } : c)))
```

---

### 3. React Hooks 违规导致白屏
**症状**: 统计页面白屏  
**根因**: `useState` 放在条件返回之后，违反 Hooks 调用顺序规则

**修复**: 将所有 `useState` 移到组件顶部

---

### 4. 选区润色替换位置错误（v1.3.5）
**症状**: 选中文字润色后，替换位置错误或替换全文  
**根因**: `handlePolish` 调用 `onAction` 后立即 `onClose` 清空了 `selection` 状态

**修复**: 操作前用变量保存选区
```js
const sel = selection
// ... 异步操作后用 sel.from / sel.to
```

---

## 二、数据库并发类

### 5. updateChapter 并发写入竞态（v1.2.2）
**症状**: 多个章节内容被互相覆盖  
**根因**: 先读后写模式，两个快速连续调用读取到过期数据

**修复**: 改为原子 UPDATE（只更新传入的字段）
```js
// 旧：先读后写（有竞态风险）
const cur = getChapter(id)
const next = { ...cur, ...patch }
UPDATE chapters SET 全部字段 WHERE id=?

// 新：原子 UPDATE
const sets = cols.filter(c => patch[c] !== undefined).map(c => `${c}=?`)
UPDATE chapters SET 变化的字段 WHERE id=?
```

---

### 6. 全局替换后编辑器内容不刷新（v1.3.2）
**症状**: 替换成功但编辑器显示旧内容  
**根因**: 数据库更新后内存中的对象不会自动同步

**修复**: 替换完成后通过事件通知编辑器重新加载
```js
// SearchModal 替换成功后触发
if (onReplace) onReplace()

// ChaptersView 监听事件重新加载
window.addEventListener('reload-chapter', h)
```

---

## 三、Electron 打包类

### 7. 打包后开发模式页面卡在加载（2026-08-14）
**症状**: `npm run dev` 后页面一直显示"加载中"  
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
**症状**: 打包时 release 目录文件被锁定  
**根因**: Windows Defender 或杀毒软件锁定文件

**修复**: 使用不同输出目录
```powershell
npx electron-builder --win --dir --config.directories.output=C:\Temp\ns-build
```

---

### 11. 安装程序"被旧程序占用"（v1.2.1）
**症状**: 安装新版时提示旧程序正在运行  
**根因**: `installer.nsh` 进程检测逻辑不正确

**修复**: 恢复原始 `installer.nsh`（含 taskkill 逻辑）

---

## 四、UI/CSS 类

### 12. 地图节点无法点击选中（v1.2.5）
**症状**: 地图节点点击无反应  
**根因**: SVG 内 `foreignObject` 拦截点击事件，`onClick` 清空选中状态

**修复**:
- `foreignObject` 加 `pointerEvents: 'none'` 让点击穿透
- 用 `dragMoved` ref 区分拖拽和点击（阈值 > 3px）
- 节点用 `e.stopPropagation()` 阻止冒泡

---

### 13. 光标颜色不显示/丢失（反复出现）
**症状**: 暗色主题下光标不可见，切换主题后丢失  
**根因**: CSS 变量未正确设置

**修复**:
```js
// themes.jsx 动态设置
document.documentElement.style.setProperty('--cursor-color', ...)
// index.css 兜底
.cm-cursor { border-left-color: var(--cursor-color, var(--accent)) !important }
```

---

### 14. 竖排色差问题（v0.5.0）
**症状**: 文字上下方有颜色更深的一列  
**根因**: `background` 简写重置了所有 `background-*` 属性

**修复**: 
- 去掉多余的 `background: transparent`
- `EditorView.theme` 改用 `backgroundColor`（不用 `background` 简写）

**教训**: CSS `background` 简写会重置所有背景属性，CodeMirror 主题中用 `backgroundColor` 更安全

---

### 15. 编辑器无法向下滚动（v1.3.0）
**症状**: 导入文档后编辑器只能在上面编辑  
**根因**: `.editor-wrap` 和 `.cm-scroller` 都设了 `overflow: auto`，嵌套滚动冲突

**修复**:
- 移除 `.editor-wrap` 的 `overflow: auto`
- 切换内容后调用 `requestMeasure()` 刷新布局

---

### 16. 列表溢出
**症状**: 章节名称太长突破选择区框架  
**根因**: flex 子元素默认 `min-width: auto` 阻止收缩

**修复**: `.tree-item { overflow: hidden; min-width: 0; }`

---

### 17. 点击编辑区关闭面板
**症状**: 点击编辑区会关闭左侧面板  
**根因**: `document.addEventListener('mousedown', ...)` 检测点击外部区域

**修复**: 删除 mousedown 事件监听器

---

## 五、AI 功能类

### 18. AI 流式输出报错 getReader is not a function（v1.3.5）
**症状**: AI 写作功能报错  
**根因**: `node-fetch v2` 的 `res.body` 是 Node.js Readable 流，不支持 Web Streams API

**修复**: 改用 Node.js 异步迭代器
```js
// 旧：Web Streams API
const reader = res.body.getReader()

// 新：Node.js 异步迭代器
for await (const chunk of stream) {
  buffer += chunk.toString()
}
```

---

### 19. AI 实体提取长文本超时（v1.3.1）
**症状**: 大量文本提取时显示"提取失败"  
**根因**: 默认超时 180 秒不够

**修复**: 文本超过 25,000 字时自动按段落拆分，每段独立调用，每段 300 秒超时

---

### 20. AI 输出卡顿
**症状**: AI 回复等待很久后才一次性显示  
**根因**: 使用非流式 API（`stream: false`）

**修复**: 实现流式输出 `chatStream`，使用 SSE 逐字显示

---

## 六、人物/角色类

### 21. 人物卡片编辑不自动保存（v1.2.5 / v1.3.0）
**症状**: 编辑人物后切换，修改丢失  
**根因**: 切换时没有保存当前编辑

**修复**:
- 新增 `saveTimer` ref 和 `scheduleSave` 函数（1.2 秒 debounce）
- 切换/新建/关闭前先保存当前表单

---

### 22. 关系网反向标签不显示（v1.3.4）
**症状**: 双向关系两条线都显示正向标签  
**根因**: 构建边数据时漏掉了 `type_b` 字段

**修复**: edges 映射中加上 `type_b: r.type_b`

---

## 七、文件导入类

### 23. GBK 编码文件导入乱码（v1.3.0）
**症状**: 导入 GBK 编码的 txt 文件显示乱码  
**根因**: 硬编码 `fs.readFileSync(path, 'utf-8')`

**修复**: 安装 `chardet` + `iconv-lite`，自动检测编码后读取

---

### 24. 文件导入对话框不显示文件（v1.3.0）
**症状**: 导入对话框看不到 txt/docx 文件  
**根因**: `openFile` 和 `openDirectory` 同时存在时 Windows 不显示文件

**修复**: 分离为两个按钮（导入文件 / 导入文件夹）

---

## 八、其他

### 25. preload.js 换行符语法错误
**症状**: 应用启动后渲染进程空白  
**根因**: `\n` 被写成字面量两个字符，导致 JS 语法错误

**修复**: 将字面量 `\n` 替换为实际换行

---

### 26. 便签无法修改
**症状**: 暂存区便签保存后不能编辑  
**根因**: `StagingPanel.jsx` 没有编辑功能

**修复**: 添加 `editingId` 状态和编辑按钮

---

### 27. ESLint 错误批量处理
- `no-constant-condition`: 添加 `// eslint-disable-next-line`
- `no-unused-vars`: 删除未使用导入/变量，或加下划线前缀
- `exhaustive-deps`: 保留函数在外部 + `eslint-disable` 注释

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
