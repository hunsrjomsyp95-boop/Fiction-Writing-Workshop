# AI 助手操作指南

> 本文件是给 AI 助手的提示词，指导开发、打包和问题排查。

---

## 一、代码修改规范

### React 状态管理
```
1. 需要立即读取最新状态 → 用 useRef，不要用 state
2. 异步操作前 → 必须用变量保存当前状态，不依赖闭包
3. 受控组件的 value 绑定状态后 → 所有修改操作必须同步更新该状态
4. React Hooks → 必须无条件按顺序调用，不能放在条件/循环之后
5. 自动保存 → 用 debounce（1.2秒），切换/新建前先保存
```

### 数据库操作
```
1. 并发写入 → 用原子 UPDATE（只更新传入字段），不要先读后写
2. 数据库更新后 → 主动触发 UI 重新加载，内存对象不会自动同步
```

### CSS 样式
```
1. background 简写会重置所有 background-* 属性 → 用 backgroundColor 更安全
2. flex 子元素需要 min-width: 0 才能正确收缩
3. CodeMirror 滚动 → 外层不要设 overflow: auto，用 requestMeasure() 刷新布局
4. SVG 内 HTML 元素点击穿透 → foreignObject 加 pointerEvents: 'none'
```

### Electron 相关
```
1. 打包后不能直接 require Node.js 内置模块（undici等）→ 用 npm 包替代
2. node-fetch v2 的流读取 → 用 for await...of，不用 getReader()
3. showOpenDialog 中 openFile 和 openDirectory 不能混用
```

---

## 二、修改代码后的检查清单

### 修改 React 组件后
- [ ] 检查 useState/useEffect 是否放在组件顶部
- [ ] 检查 onChange/onBlur 是否同步更新了所有相关状态
- [ ] 检查异步操作前是否用变量保存了状态
- [ ] 检查 useEffect 依赖数组是否完整

### 修改数据库操作后
- [ ] 检查是否用了原子 UPDATE
- [ ] 检查更新后是否触发了 UI 刷新

### 修改 CSS 后
- [ ] 检查是否用了 background 简写（应该用 backgroundColor）
- [ ] 检查 flex 子元素是否有 min-width: 0
- [ ] 检查滚动容器是否冲突

### 修改 Electron 主进程后
- [ ] 检查是否引入了 Node.js 内置模块（应该用 npm 包）
- [ ] 检查流式 API 是否适配 node-fetch v2

---

## 三、打包流程

### 打包前检查
```
1. package.json 版本号已更新
2. CHANGELOG.md 已添加新版本记录
3. HelpModal.jsx 的 CHANGES 数组已添加新版本
4. Home.jsx 底部版本号使用 import.meta.env.VITE_APP_VERSION
```

### 正式版打包步骤
```bash
# 1. 确保 better-sqlite3 是 x64 版本
npx electron-rebuild -f -w better-sqlite3

# 2. 打包 x64 正式版
npm run fast:build

# 3. 打包 ia32 正式版
npm run fast:build:ia32

# 4. 恢复开发环境
npx electron-rebuild -f -w better-sqlite3
```

### 测试版打包
```bash
npm run fast:build:skip
npm run fast:build:ia32:skip
```

### 输出目录
- x64: `D:\2\release-x64\`
- ia32: `D:\2\release-ia32\`

---

## 四、常见问题排查

### 打包相关

| 症状 | 原因 | 解决方案 |
|------|------|---------|
| EBUSY: resource busy or locked | 文件被占用 | 杀掉残留进程后重试 |
| 打包后页面卡在加载 | better-sqlite3 架构不对 | `npx electron-rebuild -f -w better-sqlite3` |
| Cannot find module 'undici' | Electron 打包后不能用内置模块 | 改用 node-fetch |
| 打包卡住不动 | 残留 node 进程 | `Stop-Process -Name "node" -Force` |
| 版本号显示不正确 | 硬编码版本号 | 用 import.meta.env.VITE_APP_VERSION |
| 自动更新不生效 | artifactName 包含 ${arch} | 移除自定义 artifactName |
| 版本号自动递增 | 旧 Release 存在 | 发布前先删除旧 Release 和 tag |

### 代码相关

| 症状 | 原因 | 解决方案 |
|------|------|---------|
| 快速切换时内容污染 | React 状态批量更新 | 用 useRef 立即更新 |
| 编辑器不刷新 | 数据库更新后没触发 UI | 主动 dispatch 或监听事件 |
| 点击无反应 | foreignObject 拦截事件 | 加 pointerEvents: 'none' |
| 光标颜色丢失 | CSS 变量未设置 | 动态设置 --cursor-color |
| 编辑器无法滚动 | 嵌套滚动冲突 | 移除外层 overflow: auto |
| 白屏 | Hooks 违规 | useState 移到组件顶部 |
| 选区替换位置错误 | 异步操作前没保存状态 | 用变量保存 selection |
| 人物编辑丢失 | 切换时没保存 | debounce 自动保存 |
| GBK 文件乱码 | 硬编码 utf-8 | chardet + iconv-lite 自动检测 |
| AI 流式报错 | node-fetch v2 不支持 getReader | 用 for await...of |

---

## 五、发布流程

```bash
# 1. 改版本号
# 编辑 package.json

# 2. 提交代码并打 tag
git add -A
git commit -m "v1.x.x"
git tag v1.x.x
git push
git push origin v1.x.x

# 3. 打包并发布
$env:GH_TOKEN="token"
npm run build
npx electron-builder --win --x64 --publish always
```

---

## 六、开发环境恢复

打包不同架构版本后，必须恢复开发环境：
```bash
npx electron-rebuild -f -w better-sqlite3
```

---

## 七、文件位置参考

- Bug 修复手册：`D:\2\bug修复手册-完整版.md`
- 打包流程指南：`D:\2\打包流程指南.md`
- 版本号注入：`D:\2\vite.config.js`
- 更新日志：`D:\2\src\components\HelpModal.jsx`
- 主页版本号：`D:\2\src\components\Home.jsx`
- 关于页版本号：`D:\2\src\components\AboutTab.jsx`
