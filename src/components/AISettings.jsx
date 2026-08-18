import { useState, useEffect } from 'react'
import { useToast } from '../ToastContext.jsx'

const AI_PROVIDERS = [
  { id: 'xiaomi', name: '小米 MiMo', baseUrl: 'https://api.xiaomimimo.com/v1', models: [{ id: 'mimo', name: 'MiMo' }, { id: 'mimo-v2.5-pro', name: 'MiMo V2.5 Pro' }, { id: 'mimo-v2.5', name: 'MiMo V2.5' }, { id: 'mimo-v2', name: 'MiMo V2' }, { id: 'mimo-flash', name: 'MiMo Flash' }] },
  { id: 'xiaomi-plan', name: '小米 MiMo Plan（包月）', baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1', models: [{ id: 'mimo', name: 'MiMo' }, { id: 'mimo-v2.5-pro', name: 'MiMo V2.5 Pro' }, { id: 'mimo-v2.5', name: 'MiMo V2.5' }, { id: 'mimo-v2', name: 'MiMo V2' }, { id: 'mimo-flash', name: 'MiMo Flash' }, { id: 'mimo-plan', name: 'MiMo Plan' }] },
  { id: 'siliconflow', name: 'SiliconFlow 硅基流动', baseUrl: 'https://api.siliconflow.cn/v1', models: [{ id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3' }, { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1' }, { id: 'Qwen/Qwen3-235B-A22B', name: 'Qwen3 235B' }, { id: 'meta-llama/Meta-Llama-3.3-70B-Instruct', name: 'Llama 3.3 70B' }] },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', models: [{ id: 'deepseek-chat', name: 'DeepSeek Chat' }, { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner' }, { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash' }, { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro' }] },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', models: [{ id: 'gpt-4.1', name: 'GPT-4.1' }, { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' }, { id: 'gpt-4o', name: 'GPT-4o' }, { id: 'o3', name: 'o3' }, { id: 'o4-mini', name: 'o4 Mini' }] },
  { id: 'anthropic', name: 'Anthropic Claude', baseUrl: 'https://api.anthropic.com/v1', headerKey: 'x-api-key', models: [{ id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' }, { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' }, { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' }, { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' }] },
  { id: 'qwen', name: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', models: [{ id: 'qwen-max', name: '千问 Max' }, { id: 'qwen-plus', name: '千问 Plus' }, { id: 'qwen-turbo', name: '千问 Turbo' }] },
  { id: 'zhipu', name: '智谱 GLM', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', models: [{ id: 'glm-4-plus', name: 'GLM-4 Plus' }, { id: 'glm-4-flash', name: 'GLM-4 Flash' }, { id: 'glm-4-long', name: 'GLM-4 Long' }] },
  { id: 'baidu', name: '百度文心', baseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop', models: [{ id: 'ernie-4.0-turbo-8k', name: '文心 4.0 Turbo' }, { id: 'ernie-3.5-8k', name: '文心 3.5' }, { id: 'ernie-speed-8k', name: '文心 Speed' }] },
  { id: 'spark', name: '讯飞星火', baseUrl: 'https://spark-api-open.xf-yun.com/v1', models: [{ id: 'generalv3.5', name: '星火 3.5' }, { id: 'generalv3', name: '星火 3.0' }, { id: 'general', name: '星火 2.0' }] },
  { id: 'moonshot', name: '月之暗面 Kimi', baseUrl: 'https://api.moonshot.cn/v1', models: [{ id: 'moonshot-v1-128k', name: 'Kimi 128K' }, { id: 'moonshot-v1-32k', name: 'Kimi 32K' }, { id: 'moonshot-v1-8k', name: 'Kimi 8K' }] },
  { id: 'yi', name: '零一万物 Yi', baseUrl: 'https://api.lingyiwanwu.com/v1', models: [{ id: 'yi-large', name: 'Yi Large' }, { id: 'yi-medium', name: 'Yi Medium' }, { id: 'yi-speed', name: 'Yi Speed' }] },
  { id: 'stepfun', name: '阶跃星辰 Step', baseUrl: 'https://api.stepfun.com/v1', models: [{ id: 'step-2-16k', name: 'Step 2 16K' }, { id: 'step-1-128k', name: 'Step 1 128K' }, { id: 'step-1-8k', name: 'Step 1 8K' }] },
  { id: 'minimax', name: 'MiniMax', baseUrl: 'https://api.minimax.chat/v1', models: [{ id: 'abab6.5s-chat', name: 'abab 6.5s' }, { id: 'abab6.5-chat', name: 'abab 6.5' }, { id: 'abab5.5-chat', name: 'abab 5.5' }] },
  { id: 'doubao', name: '豆包 (字节)', baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', models: [{ id: 'doubao-1.5-pro-256k', name: '豆包 1.5 Pro' }, { id: 'doubao-1.5-lite-32k', name: '豆包 1.5 Lite' }, { id: 'doubao-pro-256k', name: '豆包 Pro' }] },
  { id: 'google', name: 'Google Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', models: [{ id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' }, { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' }, { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' }] },
  { id: 'groq', name: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', models: [{ id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' }, { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B' }, { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' }] },
  { id: 'mistral', name: 'Mistral', baseUrl: 'https://api.mistral.ai/v1', models: [{ id: 'mistral-large-latest', name: 'Mistral Large' }, { id: 'mistral-medium-latest', name: 'Mistral Medium' }, { id: 'mistral-small-latest', name: 'Mistral Small' }] },
  { id: 'custom', name: '自定义', baseUrl: '', models: [] },
]

export default function AISettings() {
  const toast = useToast()
  const [aiCfg, setAiCfg] = useState({ provider: 'xiaomi', baseUrl: '', apiKey: '', model: 'mimo', temperature: 0.7 })
  const [searchCfg, setSearchCfg] = useState({ provider: 'google', apiKey: '', engineId: '' })
  const [aiTesting, setAiTesting] = useState(false)

  useEffect(() => {
    window.api.aiGetConfig().then(setAiCfg)
    window.api.searchConfigGet().then(setSearchCfg)
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
      toast(`连接失败：${e.message || '未知错误'}`, 'error', 5000)
    } finally {
      setAiTesting(false)
    }
  }

  const provider = AI_PROVIDERS.find((p) => p.id === aiCfg.provider)

  return (
    <>
      <div className='form-field'>
        <label>AI 服务商</label>
        <select
          value={aiCfg.provider}
          onChange={(e) => {
            const pid = e.target.value
            const prov = AI_PROVIDERS.find((p) => p.id === pid)
            setAiCfg({ ...aiCfg, provider: pid, model: prov?.models[0]?.id || '', baseUrl: prov?.baseUrl || '' })
          }}
        >
          {AI_PROVIDERS.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {aiCfg.provider !== 'custom' && (
        <div className='form-field'>
          <label>模型</label>
          <select value={aiCfg.model} onChange={(e) => setAiCfg({ ...aiCfg, model: e.target.value })}>
            {(provider?.models || []).map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      )}

      {aiCfg.provider === 'custom' && (
        <>
          <div className='form-field'>
            <label>API 地址 (Base URL)</label>
            <input value={aiCfg.baseUrl} onChange={(e) => setAiCfg({ ...aiCfg, baseUrl: e.target.value })} placeholder='https://api.example.com/v1' />
            <div className='hint'>填基础地址即可，不要带 /chat/completions</div>
          </div>
          <div className='form-field'>
            <label>模型名称</label>
            <input value={aiCfg.model} onChange={(e) => setAiCfg({ ...aiCfg, model: e.target.value })} placeholder='gpt-4o-mini' />
          </div>
        </>
      )}

      {!provider?.noApiKey && (
        <div className='form-field'>
          <label>API Key</label>
          <input type='password' value={aiCfg.apiKey} onChange={(e) => setAiCfg({ ...aiCfg, apiKey: e.target.value })} placeholder='sk-...' />
          <div className='hint'>仅保存在本机，不会上传到除所选服务商外的任何地方。</div>
        </div>
      )}

      <div className='form-field'>
        <label>温度：{aiCfg.temperature}</label>
        <input type='range' min='0' max='2' step='0.1' value={aiCfg.temperature} onChange={(e) => setAiCfg({ ...aiCfg, temperature: Number(e.target.value) })} />
        <div className='hint'>0 = 精确，1 = 平衡，2 = 创造</div>
      </div>

      <div className='panel' style={{ padding: 10, marginTop: 8, fontSize: 12 }}>
        <div><span className='dim'>服务商：</span>{provider?.name}</div>
        <div><span className='dim'>模型：</span>{aiCfg.model || '未选择'}</div>
        <div><span className='dim'>API：</span>{provider?.baseUrl || aiCfg.baseUrl || '未配置'}</div>
      </div>

      <div style={{ margin: '12px 0 4px' }}>
        <b style={{ fontSize: 13 }}>联网搜索（Google Custom Search）</b>
      </div>
      <div className='hint' style={{ marginBottom: 4 }}>
        访问 <a href='https://programmablesearchengine.google.com/' target='_blank' rel='noreferrer'>Google Programmable Search</a> 创建搜索引擎获取 cx，再到 <a href='https://console.cloud.google.com/apis/credentials' target='_blank' rel='noreferrer'>Google Cloud</a> 获取 API Key。免费版每日 100 次。
      </div>
      <div className='form-grid'>
        <div className='form-field'>
          <label>Google API Key</label>
          <input type='password' value={searchCfg.apiKey} onChange={(e) => setSearchCfg({ ...searchCfg, apiKey: e.target.value })} placeholder='AIzaSy...' />
        </div>
        <div className='form-field'>
          <label>搜索引擎 ID (cx)</label>
          <input value={searchCfg.engineId} onChange={(e) => setSearchCfg({ ...searchCfg, engineId: e.target.value })} placeholder='e1f2b3c4d5e6f7g8h' />
        </div>
      </div>

      <div className='row right' style={{ marginTop: 8 }}>
        <button onClick={testAi} disabled={aiTesting}>{aiTesting ? '测试连..' : '测试连接'}</button>
        <button className='primary' onClick={saveAi}>保存配置</button>
      </div>
    </>
  )
}
