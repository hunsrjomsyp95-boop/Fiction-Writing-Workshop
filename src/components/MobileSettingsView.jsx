import { useState, useEffect } from 'react'
import { Settings, Moon, Sun, Palette, Key, Save, RefreshCw } from 'lucide-react'

export default function MobileSettingsView({ novel, toast }) {
  const [aiConfig, setAiConfig] = useState({
    provider: 'xiaomi',
    apiKey: '',
    model: '',
    baseUrl: ''
  })
  const [theme, setTheme] = useState('dark')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const cfg = await window.api.aiGetConfig()
      setAiConfig(cfg)
      const savedTheme = await window.api.getSetting('theme', 'dark')
      setTheme(savedTheme)
    } catch (e) {
      console.error('加载设置失败:', e)
    }
  }

  const saveAIConfig = async () => {
    setSaving(true)
    try {
      await window.api.aiSaveConfig(aiConfig)
      toast('AI配置已保存', 'success')
    } catch (e) {
      toast('保存失败: ' + e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const testAI = async () => {
    try {
      const result = await window.api.aiTest()
      toast(result.message || '测试成功', 'success')
    } catch (e) {
      toast('测试失败: ' + e.message, 'error')
    }
  }

  const changeTheme = async (newTheme) => {
    setTheme(newTheme)
    await window.api.setSetting('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    toast('主题已切换', 'success')
  }

  const providers = [
    { id: 'xiaomi', name: '小米MiMo' },
    { id: 'deepseek', name: 'DeepSeek' },
    { id: 'openai', name: 'OpenAI' },
    { id: 'anthropic', name: 'Anthropic Claude' },
    { id: 'qwen', name: '通义千问' },
    { id: 'zhipu', name: '智谱 GLM' },
    { id: 'custom', name: '自定义' },
  ]

  return (
    <div className="mobile-settings">
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
        <Settings size={20} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        设置
      </h2>

      {/* 主题设置 */}
      <div className="mobile-settings-section">
        <h3><Palette size={16} /> 主题</h3>
        <div className="mobile-theme-options">
          <button 
            className={`mobile-theme-btn ${theme === 'dark' ? 'active' : ''}`}
            onClick={() => changeTheme('dark')}
          >
            <Moon size={18} />
            <span>暗色</span>
          </button>
          <button 
            className={`mobile-theme-btn ${theme === 'light' ? 'active' : ''}`}
            onClick={() => changeTheme('light')}
          >
            <Sun size={18} />
            <span>亮色</span>
          </button>
        </div>
      </div>

      {/* AI配置 */}
      <div className="mobile-settings-section">
        <h3><Key size={16} /> AI 配置</h3>
        
        <div className="mobile-form-group">
          <label>服务商</label>
          <select 
            className="mobile-select"
            value={aiConfig.provider}
            onChange={e => setAiConfig({...aiConfig, provider: e.target.value})}
          >
            {providers.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="mobile-form-group">
          <label>API Key</label>
          <input
            type="password"
            className="mobile-input"
            value={aiConfig.apiKey || ''}
            onChange={e => setAiConfig({...aiConfig, apiKey: e.target.value})}
            placeholder="输入 API Key"
          />
        </div>

        <div className="mobile-form-group">
          <label>模型</label>
          <input
            className="mobile-input"
            value={aiConfig.model || ''}
            onChange={e => setAiConfig({...aiConfig, model: e.target.value})}
            placeholder="如：gpt-4、deepseek-chat"
          />
        </div>

        {aiConfig.provider === 'custom' && (
          <div className="mobile-form-group">
            <label>API 地址</label>
            <input
              className="mobile-input"
              value={aiConfig.baseUrl || ''}
              onChange={e => setAiConfig({...aiConfig, baseUrl: e.target.value})}
              placeholder="https://api.example.com"
            />
          </div>
        )}

        <div className="mobile-btn-group">
          <button className="mobile-btn" onClick={saveAIConfig} disabled={saving}>
            <Save size={16} /> {saving ? '保存中...' : '保存配置'}
          </button>
          <button className="mobile-btn secondary" onClick={testAI}>
            <RefreshCw size={16} /> 测试连接
          </button>
        </div>
      </div>

      {/* 关于 */}
      <div className="mobile-settings-section">
        <h3>关于</h3>
        <p className="mobile-text-dim">小说创作工坊 v1.2.6</p>
        <p className="mobile-text-dim">网页版 - 数据存储在浏览器本地</p>
      </div>
    </div>
  )
}