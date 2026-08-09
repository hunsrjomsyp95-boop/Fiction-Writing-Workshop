import { useState, useEffect } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'
import { useTheme, TEXT_COLORS, CURSOR_COLORS, themeToJson, parseThemeJson } from '../themes.jsx'

const AI_PROVIDERS = [
  {
    id: 'xiaomi',
    name: '小米 MiMo',
    baseUrl: 'https://api.xiaomimimo.com/v1',
    models: [
      { id: 'mimo', name: 'MiMo', description: '小米默认模型' },
      { id: 'mimo-v2.5-pro', name: 'MiMo V2.5 Pro', description: '最新旗舰模型' },
      { id: 'mimo-v2.5', name: 'MiMo V2.5', description: '高性能模型' },
      { id: 'mimo-v2', name: 'MiMo V2', description: '标准模型' },
      { id: 'mimo-flash', name: 'MiMo Flash', description: '快速轻量' },
    ],
  },
  {
    id: 'xiaomi-plan',
    name: '小米 MiMo Plan（包月）',
    baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1',
    models: [
      { id: 'mimo', name: 'MiMo', description: '小米默认模型' },
      { id: 'mimo-v2.5-pro', name: 'MiMo V2.5 Pro', description: '最新旗舰模型' },
      { id: 'mimo-v2.5', name: 'MiMo V2.5', description: '高性能模型' },
      { id: 'mimo-v2', name: 'MiMo V2', description: '标准模型' },
      { id: 'mimo-flash', name: 'MiMo Flash', description: '快速轻量' },
      { id: 'mimo-plan', name: 'MiMo Plan', description: '规划推理模型' },
    ],
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow 硅基流动',
    baseUrl: 'https://api.siliconflow.cn/v1',
    models: [
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', description: '高性能通用' },
      { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1', description: '深度推理' },
      { id: 'deepseek-ai/DeepSeek-V3.1', name: 'DeepSeek V3.1', description: '最新通用' },
      { id: 'Qwen/Qwen3-235B-A22B', name: 'Qwen3 235B', description: '通义千问最新旗舰' },
      { id: 'Qwen/Qwen3-30B-A3B', name: 'Qwen3 30B', description: '通义千问轻量' },
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B', description: '通义千问大模型' },
      { id: 'Qwen/Qwen2.5-32B-Instruct', name: 'Qwen 2.5 32B', description: '通义千问中模型' },
      { id: 'meta-llama/Meta-Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B', description: 'Meta 最新开源' },
      { id: 'meta-llama/Meta-Llama-3.1-70B-Instruct', name: 'Llama 3.1 70B', description: 'Meta 大模型' },
      { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B', description: 'Meta 轻量模型' },
      { id: 'google/gemma-2-27b-it', name: 'Gemma 2 27B', description: 'Google 开源模型' },
      { id: 'internlm/internlm2_5-7b-chat', name: 'InternLM 2.5 7B', description: '书生浦语' },
      { id: 'Pro/deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3 (Pro)', description: 'Pro 加速版' },
      { id: 'Pro/deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1 (Pro)', description: 'Pro 加速版' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', description: 'V3 通用对话' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', description: 'R1 深度推理' },
      { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', description: '最新快速模型' },
      { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', description: '最新旗舰模型' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4.1', name: 'GPT-4.1', description: '最新旗舰' },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', description: '最新高性价比' },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', description: '超轻量' },
      { id: 'gpt-4o', name: 'GPT-4o', description: '多模态旗舰' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '多模态轻量' },
      { id: 'o3', name: 'o3', description: '最强推理' },
      { id: 'o3-mini', name: 'o3 Mini', description: '推理模型' },
      { id: 'o4-mini', name: 'o4 Mini', description: '新一代推理' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', description: '最新均衡模型' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: '快速轻量' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: '上代旗舰' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: '最强推理' },
    ],
    headerKey: 'x-api-key',
  },
  {
    id: 'qwen',
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: [
      { id: 'qwen-max', name: '千问 Max', description: '最强模型' },
      { id: 'qwen-plus', name: '千问 Plus', description: '高性能' },
      { id: 'qwen-turbo', name: '千问 Turbo', description: '快速' },
      { id: 'qwen-long', name: '千问 Long', description: '超长上下文' },
    ],
  },
  {
    id: 'zhipu',
    name: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      { id: 'glm-4-plus', name: 'GLM-4 Plus', description: '最强模型' },
      { id: 'glm-4-flash', name: 'GLM-4 Flash', description: '免费快速' },
      { id: 'glm-4-long', name: 'GLM-4 Long', description: '超长上下文' },
      { id: 'glm-4-air', name: 'GLM-4 Air', description: '轻量高效' },
    ],
  },
  {
    id: 'baidu',
    name: '百度文心',
    baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop',
    models: [
      { id: 'ernie-4.0-turbo-8k', name: '文心 4.0 Turbo', description: '最强模型' },
      { id: 'ernie-3.5-8k', name: '文心 3.5', description: '均衡模型' },
      { id: 'ernie-speed-8k', name: '文心 Speed', description: '快速免费' },
    ],
  },
  {
    id: 'spark',
    name: '讯飞星火',
    baseUrl: 'https://spark-api-open.xf-yun.com/v1',
    models: [
      { id: 'generalv3.5', name: '星火 3.5', description: '通用模型' },
      { id: 'generalv3', name: '星火 3.0', description: '标准模型' },
      { id: 'general', name: '星火 2.0', description: '轻量模型' },
    ],
  },
  {
    id: 'moonshot',
    name: '月之暗面 Kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    models: [
      { id: 'moonshot-v1-128k', name: 'Kimi 128K', description: '超长上下文' },
      { id: 'moonshot-v1-32k', name: 'Kimi 32K', description: '长上下文' },
      { id: 'moonshot-v1-8k', name: 'Kimi 8K', description: '标准' },
    ],
  },
  {
    id: 'yi',
    name: '零一万物 Yi',
    baseUrl: 'https://api.lingyiwanwu.com/v1',
    models: [
      { id: 'yi-large', name: 'Yi Large', description: '最强模型' },
      { id: 'yi-medium', name: 'Yi Medium', description: '均衡模型' },
      { id: 'yi-speed', name: 'Yi Speed', description: '快速模型' },
      { id: 'yi-large-turbo', name: 'Yi Large Turbo', description: '高性能快' },
    ],
  },
  {
    id: 'stepfun',
    name: '阶跃星辰 Step',
    baseUrl: 'https://api.stepfun.com/v1',
    models: [
      { id: 'step-2-16k', name: 'Step 2 16K', description: '最新模型' },
      { id: 'step-1-128k', name: 'Step 1 128K', description: '长上下文' },
      { id: 'step-1-8k', name: 'Step 1 8K', description: '标准模型' },
    ],
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    baseUrl: 'https://api.minimax.chat/v1',
    models: [
      { id: 'abab6.5s-chat', name: 'abab 6.5s', description: '最新模型' },
      { id: 'abab6.5-chat', name: 'abab 6.5', description: '均衡模型' },
      { id: 'abab5.5-chat', name: 'abab 5.5', description: '标准模型' },
    ],
  },
  {
    id: 'doubao',
    name: '豆包 (字节)',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: [
      { id: 'doubao-1.5-pro-256k', name: '豆包 1.5 Pro', description: '最强模型' },
      { id: 'doubao-1.5-lite-32k', name: '豆包 1.5 Lite', description: '轻量快速' },
      { id: 'doubao-pro-256k', name: '豆包 Pro', description: '长上下文' },
    ],
  },
  {
    id: 'google',
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: '最新快速' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: '最新旗舰' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: '上代快速' },
    ],
  },
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: '超快推理' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', description: '极速响应' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: '混合专家' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', description: 'Google 轻量' },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    models: [
      { id: 'mistral-large-latest', name: 'Mistral Large', description: '最强模型' },
      { id: 'mistral-medium-latest', name: 'Mistral Medium', description: '均衡模型' },
      { id: 'mistral-small-latest', name: 'Mistral Small', description: '轻量快速' },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama 本地',
    baseUrl: 'http://localhost:11434/v1',
    noApiKey: true,
    models: [
      { id: 'qwen2.5:14b', name: 'Qwen 2.5 14B', description: '中文优化' },
      { id: 'qwen2.5:7b', name: 'Qwen 2.5 7B', description: '轻量中文' },
      { id: 'llama3.1:8b', name: 'Llama 3.1 8B', description: '通用模型' },
      { id: 'llama3.1:70b', name: 'Llama 3.1 70B', description: '大模型' },
      { id: 'deepseek-r1:7b', name: 'DeepSeek R1 7B', description: '本地推理' },
      { id: 'deepseek-r1:14b', name: 'DeepSeek R1 14B', description: '推理增强' },
      { id: 'mistral:7b', name: 'Mistral 7B', description: '欧洲模型' },
      { id: 'phi3:mini', name: 'Phi-3 Mini', description: '微软轻量' },
      { id: 'gemma2:9b', name: 'Gemma 2 9B', description: 'Google 轻量' },
    ],
  },
  {
    id: 'custom',
    name: '自定义',
    baseUrl: '',
    models: [],
  },
]

const SWATCH_KEYS = [
  ['bg', '背景'],
  ['bg2', '面板'],
  ['border', '边框'],
  ['accent', '强调'],
  ['text', '文字'],
  ['green', '成功'],
  ['yellow', '警告'],
  ['red', '错误'],
]

export default function SettingsModal({ onClose }) {
  const toast = useToast()
  const { confirm } = useDialog()
  const [tab, setTab] = useState('theme')
  const { themeId, textColor, fontSize, cursorColor, custom, all, current, set, autoTheme } = useTheme()
  const [importText, setImportText] = useState('')
  const [customName, setCustomName] = useState('')
  const [customColors, setCustomColors] = useState(null)
  const [customOpen, setCustomOpen] = useState(false)
  // AI 配置
  const [aiCfg, setAiCfg] = useState({ provider: 'xiaomi', baseUrl: '', apiKey: '', model: 'mimo', temperature: 0.7 })
  const [aiTesting, setAiTesting] = useState(false)
  const [searchCfg, setSearchCfg] = useState({ provider: 'google', apiKey: '', engineId: '' })
  // Ollama 状态
  const [ollamaStatus, setOllamaStatus] = useState({ installed: false, running: false })
  const [ollamaModels, setOllamaModels] = useState([])
  const [ollamaPulling, setOllamaPulling] = useState(false)

  useEffect(() => {
    window.api.aiGetConfig().then(setAiCfg)
    window.api.searchConfigGet().then(setSearchCfg)
    // 检测 Ollama 状态
    window.api.ollamaStatus().then((s) => {
      setOllamaStatus(s)
      if (s.running) window.api.ollamaModels().then(setOllamaModels)
    })
  }, [])

  const saveAi = async () => {
    await window.api.aiSaveConfig(aiCfg)
    await window.api.searchConfigSave(searchCfg)
    toast('AI 配置已保存', 'success')
  }

  const testAi = async () => {
    setAiTesting(true)
    try {
      const res = await window.api.aiTest()
      toast(`连接成功：${res.model}`, 'success')
    } catch (e) {
      const msg = e.message || '未知错误'
      toast(`连接失败：${msg}`, 'error', 5000)
    } finally {
      setAiTesting(false)
    }
  }

  const importTheme = async () => {
    if (!importText.trim()) {
      toast('请粘贴主题JSON', 'error')
      return
    }
    try {
      const theme = parseThemeJson(importText)
      const id = `custom-${Date.now()}`
      await set({ custom: [...custom, { ...theme, id }], themeId: id })
      setImportText('')
      toast(`已导入并应用「${theme.name}」`, 'success')
    } catch (e) {
      toast('导入失败：' + e.message, 'error')
    }
  }

  const exportTheme = async () => {
    try {
      await navigator.clipboard.writeText(themeToJson(current()))
      toast('主题 JSON 已复制到剪贴板', 'success')
    } catch (e) {
      toast('复制失败', 'error')
    }
  }

  const removeCustom = async (id) => {
    if (!(await confirm({ title: '删除自定义主题', message: '确定删除该自定义主题？', danger: true }))) return
    await set({ custom: custom.filter((t) => t.id !== id), themeId: 'default' })
    toast('已删除自定义主题', 'success')
  }

  return (
    <div className='modal-mask'>
      <div className='modal' style={{ width: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className='modal-head'>
          设置
          <div className='tabs' style={{ background: 'none', border: 'none', padding: 0, marginLeft: 12 }}>
            <div className={`tab ${tab === 'theme' ? 'active' : ''}`} onClick={() => setTab('theme')}>
              主题
            </div>
            <div className={`tab ${tab === 'ai' ? 'active' : ''}`} onClick={() => setTab('ai')}>
              AI 设置
            </div>
            <div className={`tab ${tab === 'about' ? 'active' : ''}`} onClick={() => setTab('about')}>
              关于
            </div>
            <div className={`tab ${tab === 'sponsor' ? 'active' : ''}`} onClick={() => setTab('sponsor')}>
              赞赏
            </div>
          </div>
          <div className='spacer' />
          <button className='ghost small' onClick={onClose}>
            关闭
          </button>
        </div>
        <div className='modal-body' style={{ maxHeight: '70vh' }}>
          {tab === 'theme' ? (
            <>
              {/* 主题色卡 */}
              <div className='row' style={{ margin: '4px 0' }}>
                <b style={{ fontSize: 13 }}>主题</b>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                {all().map((t) => (
                  <div
                    key={t.id}
                    style={{
                      cursor: 'pointer',
                      padding: 8,
                      border: themeId === t.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                      borderRadius: 8,
                      background: 'var(--bg-2)',
                    }}
                    onClick={async () => {
                      await set({ themeId: t.id })
                      toast(`已切换到「${t.name}」`, 'success')
                    }}
                  >
                    <div style={{ display: 'flex', gap: 3, marginBottom: 6 }}>
                      {['bg', 'bg2', 'bg3', 'accent'].map((k) => (
                        <div
                          key={k}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 4,
                            background: t.colors[k],
                            border: '1px solid rgba(0,0,0,0.2)',
                          }}
                        />
                      ))}
                    </div>
                    <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.name}
                    </div>
                    {t.id.startsWith('custom-') && (
                      <button
                        className='ghost small danger'
                        style={{ marginTop: 4 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          removeCustom(t.id)
                        }}
                      >
                        删除
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* 文字颜色 */}
              <div className='row' style={{ margin: '12px 0 6px' }}>
                <b style={{ fontSize: 13 }}>文字颜色</b>
              </div>
              <div className='row wrap' style={{ gap: 8 }}>
                {TEXT_COLORS.map((tc) => (
                  <button
                    key={tc.id || 'follow'}
                    className={`small ${textColor === tc.id ? 'primary' : ''}`}
                    onClick={async () => {
                      await set({ textColor: tc.id })
                      toast(`文字颜色：${tc.label}`, 'success')
                    }}
                  >
                    {tc.colors ? <span style={{ color: tc.colors.text, fontWeight: 700 }}>A</span> : '跟随'} {tc.label}
                  </button>
                ))}
              </div>

              {/* 字号 */}
              <div className='row' style={{ margin: '12px 0 6px' }}>
                <b style={{ fontSize: 13 }}>字号：{fontSize}px</b>
              </div>
              <div className='row' style={{ gap: 8 }}>
                <input
                  type='range'
                  min='12'
                  max='20'
                  step='1'
                  value={fontSize}
                  onChange={async (e) => await set({ fontSize: Number(e.target.value) })}
                  style={{ flex: 1 }}
                />
                <span className='hint'>12 - 20 px</span>
              </div>

              {/* 光标颜色 */}
              <div className='row' style={{ margin: '12px 0 6px' }}>
                <b style={{ fontSize: 13 }}>输入光标颜色</b>
              </div>
              <div className='row wrap' style={{ gap: 8 }}>
                {CURSOR_COLORS.map((cc) => (
                  <button
                    key={cc.id || 'follow'}
                    className={`small ${cursorColor === cc.id ? 'primary' : ''}`}
                    onClick={async () => {
                      await set({ cursorColor: cc.id })
                      toast(`光标颜色：${cc.label}`, 'success')
                    }}
                  >
                    {cc.color ? <span style={{ color: cc.color, fontWeight: 700 }}>|</span> : '跟随'} {cc.label}
                  </button>
                ))}
              </div>

              {/* 跟随系统主题 */}
              <div className='row' style={{ margin: '12px 0 6px' }}>
                <b style={{ fontSize: 13 }}>自动跟随系统深色/浅色模式</b>
              </div>
              <button
                className={`small ${autoTheme ? 'primary' : ''}`}
                onClick={async () => {
                  const next = !autoTheme
                  await set({ autoTheme: next })
                  toast(next ? '已开启跟随系统主题' : '已关闭跟随系统主题', 'success')
                }}
              >
                {autoTheme ? '已开启' : '已关闭'}
              </button>

              {/* 导入 / 导出 */}
              <div className='row' style={{ margin: '12px 0 6px' }}>
                <b style={{ fontSize: 13 }}>导入 / 导出主题模板</b>
              </div>
              <div className='hint' style={{ marginBottom: 6 }}>
                从网上获取他人发布的主题模板（JSON）粘贴导入。格式：
                <pre style={{ background: 'var(--bg-3)', padding: 8, borderRadius: 6, fontSize: 11, marginTop: 4 }}>
                  {'{"name":"我的主题","colors":{"bg":"#1e1e2e","text":"#e6e6ef","accent":"#7c7cf0",...}}'}
                </pre>
              </div>
              <textarea
                rows={3}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder='粘贴主题 JSON...'
              />
              <div className='row' style={{ marginTop: 8 }}>
                <button className='small primary' onClick={importTheme}>
                  导入并应用
                </button>
                <button className='small' onClick={exportTheme}>
                  复制当前主题
                </button>
                <button className='small' onClick={() => setCustomOpen((o) => !o)}>
                  除自定义主题
                </button>
              </div>

              {/* 自定义主题创建器 */}
              {customOpen && (
                <div
                  className='panel'
                  style={{ padding: 12, marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  <div className='row'>
                    <input
                      className='grow'
                      placeholder='主题名称'
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                    <input
                      style={{ width: 140 }}
                      placeholder='背景 #1e1e2e'
                      value={customColors?.bg || ''}
                      onChange={(e) => setCustomColors({ ...(customColors || {}), bg: e.target.value })}
                    />
                  </div>
                  <div className='row wrap' style={{ gap: 6 }}>
                    {SWATCH_KEYS.map(([k, label]) => (
                      <label key={k} className='row' style={{ gap: 4 }}>
                        <span className='hint'>{label}</span>
                        <input
                          type='color'
                          value={customColors?.[k] || current().colors[k]}
                          style={{ width: 34, height: 26, padding: 0 }}
                          onChange={(e) => setCustomColors({ ...(customColors || {}), [k]: e.target.value })}
                        />
                      </label>
                    ))}
                  </div>
                  <div className='row right'>
                    <button
                      className='small primary'
                      onClick={async () => {
                        if (!customName.trim()) {
                          toast('请输入主题名称', 'error')
                          return
                        }
                        const colors = { ...current().colors, ...(customColors || {}) }
                        const id = `custom-${Date.now()}`
                        await set({ custom: [...custom, { id, name: customName.trim(), colors }], themeId: id })
                        setCustomName('')
                        setCustomColors(null)
                        setCustomOpen(false)
                        toast('自定义主题已创建并应用', 'success')
                      }}
                    >
                      创建并应用
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : tab === 'ai' ? (
            <>
              {/* 服务商选择 */}
              <div className='form-field'>
                <label>AI 服务商</label>
                <select
                  value={aiCfg.provider}
                  onChange={(e) => {
                    const pid = e.target.value
                    const prov = AI_PROVIDERS.find((p) => p.id === pid)
                    setAiCfg({
                      ...aiCfg,
                      provider: pid,
                      model: prov?.models[0]?.id || '',
                      baseUrl: prov?.baseUrl || '',
                    })
                  }}
                >
                  {AI_PROVIDERS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 模型选择 */}
              {aiCfg.provider !== 'custom' && (
                <div className='form-field'>
                  <label>模型</label>
                  <select
                    value={aiCfg.model}
                    onChange={(e) => setAiCfg({ ...aiCfg, model: e.target.value })}
                  >
                    {(AI_PROVIDERS.find((p) => p.id === aiCfg.provider)?.models || []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} - {m.description}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 自定义模式：手动填写 URL 和模型 */}
              {aiCfg.provider === 'custom' && (
                <>
                  <div className='form-field'>
                    <label>API 地址 (Base URL)</label>
                    <input
                      value={aiCfg.baseUrl}
                      onChange={(e) => setAiCfg({ ...aiCfg, baseUrl: e.target.value })}
                      placeholder='https://api.example.com/v1'
                    />
                    <div className='hint'>
                      填基础地址即可，不要带 /chat/completions
                    </div>
                  </div>
                  <div className='form-field'>
                    <label>模型名称</label>
                    <input
                      value={aiCfg.model}
                      onChange={(e) => setAiCfg({ ...aiCfg, model: e.target.value })}
                      placeholder='gpt-4o-mini'
                    />
                  </div>
                </>
              )}

              {/* API Key */}
              {!AI_PROVIDERS.find((p) => p.id === aiCfg.provider)?.noApiKey && (
                <div className='form-field'>
                  <label>API Key</label>
                  <input
                    type='password'
                    value={aiCfg.apiKey}
                    onChange={(e) => setAiCfg({ ...aiCfg, apiKey: e.target.value })}
                    placeholder='sk-...'
                  />
                  <div className='hint'>
                    仅保存在本机，不会上传到除所选服务商外的任何地方。
                  </div>
                </div>
              )}

              {/* Ollama 本地管理 */}
              {aiCfg.provider === 'ollama' && (
                <div className='panel' style={{ padding: 12, marginTop: 8 }}>
                  <b style={{ fontSize: 13 }}>Ollama 本地模型</b>

                  {/* 状态显示 */}
                  <div style={{ margin: '8px 0', fontSize: 13 }}>
                    <div className='row' style={{ gap: 8 }}>
                      <span className={`badge ${ollamaStatus.installed ? 'green' : 'red'}`}>
                        {ollamaStatus.installed ? '✓ 已安装' : '✕ 未安装'}
                      </span>
                      <span className={`badge ${ollamaStatus.running ? 'green' : 'yellow'}`}>
                        {ollamaStatus.running ? '✓ 运行中' : '○ 未运行'}
                      </span>
                    </div>
                  </div>

                  {/* 未安装 → 提示安装 */}
                  {!ollamaStatus.installed && (
                    <div style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-1)' }}>
                      <p>请先下载安装 Ollama：</p>
                      <a href='https://ollama.com/download' target='_blank' rel='noreferrer'
                        style={{ fontSize: 14, fontWeight: 600 }}>
                        → ollama.com/download
                      </a>
                      <p style={{ marginTop: 4, color: 'var(--text-2)' }}>安装后回到这里，会自动检测到。</p>
                    </div>
                  )}

                  {/* 已安装但未运行 → 启动按钮 */}
                  {ollamaStatus.installed && !ollamaStatus.running && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        className='primary small'
                        onClick={async () => {
                          toast('正在启动 Ollama...', 'info')
                          const res = await window.api.ollamaStart()
                          if (res.ok) {
                            setOllamaStatus({ installed: true, running: true })
                            setOllamaModels(res.models || [])
                            toast('Ollama 已启动', 'success')
                          } else {
                            toast('启动失败，请手动运行 ollama serve', 'error')
                          }
                        }}
                      >
                        一键启动 Ollama
                      </button>
                    </div>
                  )}

                  {/* 运行中 → 显示模型管理 */}
                  {ollamaStatus.running && (
                    <>
                      <div style={{ margin: '8px 0', fontSize: 13 }}>
                        <b>已下载的模型：</b>
                        {ollamaModels.length === 0 ? (
                          <div className='hint' style={{ margin: '4px 0' }}>暂无模型，请下载一个：</div>
                        ) : (
                          <div style={{ margin: '4px 0', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {ollamaModels.map((m) => (
                              <span key={m.id} className='badge green'>{m.id}</span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 一键下载模型 */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                        {[
                          { id: 'qwen2.5:7b', name: 'Qwen 2.5 7B' },
                          { id: 'llama3.1:8b', name: 'Llama 3.1 8B' },
                          { id: 'deepseek-r1:7b', name: 'DeepSeek R1 7B' },
                        ].map((m) => (
                          <button
                            key={m.id}
                            className='small'
                            disabled={ollamaPulling || ollamaModels.some((om) => om.id === m.id || om.id === m.id + ':latest')}
                            onClick={async () => {
                              setOllamaPulling(true)
                              toast(`正在下载 ${m.name}，请稍候...`, 'info', 10000)
                              try {
                                const res = await window.api.ollamaPull(m.id)
                                setOllamaModels(res.models || [])
                                toast(`${m.name} 下载完成`, 'success')
                              } catch (e) {
                                toast(`下载失败：${e.message}`, 'error')
                              } finally {
                                setOllamaPulling(false)
                              }
                            }}
                          >
                            {ollamaModels.some((om) => om.id === m.id || om.id === m.id + ':latest') ? '✓ ' : '+ '}
                            {m.name}
                          </button>
                        ))}
                      </div>

                      <div className='hint' style={{ marginTop: 6 }}>
                        本地运行，数据不上传，无需 API Key。需要至少 8GB 内存。
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 温度 */}
              <div className='form-field'>
                <label>温度：{aiCfg.temperature}</label>
                <input
                  type='range'
                  min='0'
                  max='2'
                  step='0.1'
                  value={aiCfg.temperature}
                  onChange={(e) => setAiCfg({ ...aiCfg, temperature: Number(e.target.value) })}
                />
                <div className='hint'>0 = 精确，1 = 平衡，2 = 创造</div>
              </div>

              {/* 当前配置摘要 */}
              <div className='panel' style={{ padding: 10, marginTop: 8, fontSize: 12 }}>
                <div><span className='dim'>服务商：</span>{AI_PROVIDERS.find((p) => p.id === aiCfg.provider)?.name}</div>
                <div><span className='dim'>模型：</span>{aiCfg.model || '未选择'}</div>
                <div><span className='dim'>API：</span>{AI_PROVIDERS.find((p) => p.id === aiCfg.provider)?.baseUrl || aiCfg.baseUrl || '未配置'}</div>
              </div>

              <div style={{ margin: '12px 0 4px' }}>
                <b style={{ fontSize: 13 }}>联网搜索（Google Custom Search）</b>
              </div>
              <div className='hint' style={{ marginBottom: 4 }}>
                访问
                <a href='https://programmablesearchengine.google.com/' target='_blank' rel='noreferrer'>
                  Google Programmable Search
                </a>{' '}
                创建搜索引擎获取 cx，再到{' '}
                <a href='https://console.cloud.google.com/apis/credentials' target='_blank' rel='noreferrer'>
                  Google Cloud
                </a>{' '}
                获取 API Key。免费版每日 100 次。
              </div>
              <div className='form-grid'>
                <div className='form-field'>
                  <label>Google API Key</label>
                  <input
                    type='password'
                    value={searchCfg.apiKey}
                    onChange={(e) => setSearchCfg({ ...searchCfg, apiKey: e.target.value })}
                    placeholder='AIzaSy...'
                  />
                </div>
                <div className='form-field'>
                  <label>搜索引擎 ID (cx)</label>
                  <input
                    value={searchCfg.engineId}
                    onChange={(e) => setSearchCfg({ ...searchCfg, engineId: e.target.value })}
                    placeholder='e1f2b3c4d5e6f7g8h'
                  />
                </div>
              </div>

              <div className='row right' style={{ marginTop: 8 }}>
                <button onClick={testAi} disabled={aiTesting}>
                  {aiTesting ? '测试连..' : '测试连接'}
                </button>
                <button className='primary' onClick={saveAi}>
                  保存配置
                </button>
              </div>
            </>
          ) : tab === 'about' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
              <div style={{ marginBottom: 8 }}>
                <ChevronLeft size={40} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>小说创作工坊</h2>
              <div className='badge accent' style={{ marginTop: 6 }}>
                版本 1.0.0
              </div>
              <div className='row' style={{ marginTop: 16 }}>
                <span className='dim'>作者：</span>
                <b>哔哩哔哩耄耋教你写小说</b>
              </div>
              <div
                className='panel'
                style={{ marginTop: 14, padding: '12px 18px', background: 'var(--bg-3)', textAlign: 'center' }}
              >
                <div style={{ color: 'var(--green)', fontWeight: 600 }}>软件免费</div>
                <div className='hint' style={{ marginTop: 4 }}>
                  如果是购买的那就是被骗了
                </div>
              </div>
              <div className='hint' style={{ marginTop: 16, textAlign: 'center' }}>
                本地运行的小说写作工具· 数据保存在本机
              </div>
              <div className='hint' style={{ marginTop: 12, textAlign: 'center' }}>
                发现漏洞请联系：<a href='mailto:2982871730@qq.com'>2982871730@qq.com</a>
              </div>
            </div>
          ) : tab === 'sponsor' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>☕</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>支持作者</h2>
              <div className='hint' style={{ marginBottom: 20, textAlign: 'center', lineHeight: 1.8 }}>
                如果这个软件对您的创作有帮助，<br />
                可以选择请我喝杯咖啡 ☕
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={new URL('../assets/donate-wechat.jpg', import.meta.url).href}
                    alt='微信赞赏码'
                    style={{ width: 180, height: 180, borderRadius: 12, border: '2px solid var(--border)' }}
                  />
                  <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600 }}>微信</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={new URL('../assets/donate-alipay.jpg', import.meta.url).href}
                    alt='支付宝赞赏码'
                    style={{ width: 180, height: 180, borderRadius: 12, border: '2px solid var(--border)' }}
                  />
                  <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600 }}>支付宝</div>
                </div>
              </div>
              <div className='hint' style={{ marginTop: 20, textAlign: 'center' }}>
                您的支持是我持续更新的动力 ❤️<br />
                <span style={{ fontSize: 12, opacity: 0.7 }}>开发不易，感谢支持</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
