// 内置 AI 服务商配置

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
    id: 'custom',
    name: '自定义',
    baseUrl: '',
    models: [],
  },
]

function getProviderById(id) {
  return AI_PROVIDERS.find((p) => p.id === id) || AI_PROVIDERS[0]
}

function getModelsByProvider(id) {
  const p = getProviderById(id)
  return p.models || []
}

module.exports = { AI_PROVIDERS, getProviderById, getModelsByProvider }
