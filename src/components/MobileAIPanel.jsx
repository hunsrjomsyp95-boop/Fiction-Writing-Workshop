import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, RefreshCw, Trash2 } from 'lucide-react'

export default function MobileAIPanel({ novel, toast }) {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [config, setConfig] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadConfig()
    loadHistory()
  }, [novel.id])

  const loadConfig = async () => {
    try {
      const cfg = await window.api.aiGetConfig()
      setConfig(cfg)
    } catch (e) {
      console.error('加载AI配置失败:', e)
    }
  }

  const loadHistory = async () => {
    try {
      const history = await window.api.aiGetHistory(novel.id)
      setMessages(history || [])
    } catch (e) {
      console.error('加载历史失败:', e)
    }
  }

  const clearHistory = async () => {
    try {
      await window.api.aiClearHistory(novel.id)
      setMessages([])
      toast('历史已清空', 'success')
    } catch (e) {
      toast('清空失败', 'error')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendPrompt = async () => {
    if (!prompt.trim() || loading) return
    
    const userMessage = prompt.trim()
    setPrompt('')
    setLoading(true)

    // 添加用户消息
    const newMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    await window.api.aiAddHistory(novel.id, 'user', userMessage)

    try {
      // 获取小说上下文
      const chapters = await window.api.listChapters(novel.id)
      const characters = await window.api.listCharacters(novel.id)
      const context = `小说名称：${novel.name}\n章节数：${chapters.length}\n人物数：${characters.length}`
      
      const result = await window.api.aiAssistant(userMessage, context)
      const aiResponse = result.response || '抱歉，无法生成回复'
      
      // 添加AI回复
      setMessages([...newMessages, { role: 'assistant', content: aiResponse }])
      await window.api.aiAddHistory(novel.id, 'assistant', aiResponse)
    } catch (e) {
      toast('AI请求失败: ' + e.message, 'error')
      setMessages(newMessages)
    } finally {
      setLoading(false)
    }
  }

  const quickPrompts = [
    { label: '续写', prompt: '请帮我续写这个故事，保持风格一致' },
    { label: '润色', prompt: '请帮我润色以下文字，提升表达质量' },
    { label: '总结', prompt: '请帮我总结一下当前的故事大纲' },
    { label: '人物建议', prompt: '请给我一些人物发展的建议' },
  ]

  if (!config?.apiKey) {
    return (
      <div className="mobile-empty">
        <div className="mobile-empty-icon"><Sparkles size={48} /></div>
        <div className="mobile-empty-title">AI 助手</div>
        <div className="mobile-empty-desc">请先在设置中配置 AI 服务的 API Key</div>
      </div>
    )
  }

  return (
    <div className="mobile-ai-panel">
      <div className="mobile-ai-header">
        <h2><Sparkles size={18} /> AI 助手</h2>
        <button className="mobile-btn-icon" onClick={clearHistory} title="清空历史">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="mobile-ai-messages">
        {messages.length === 0 && (
          <div className="mobile-ai-welcome">
            <p>你好！我是AI写作助手，可以帮你：</p>
            <div className="mobile-quick-prompts">
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  className="mobile-quick-prompt-btn"
                  onClick={() => setPrompt(qp.prompt)}
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`mobile-ai-message ${msg.role}`}>
            <div className="mobile-ai-message-content">
              {msg.content}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="mobile-ai-message assistant">
            <div className="mobile-ai-message-content loading">
              <RefreshCw size={16} className="spinning" /> 思考中...
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="mobile-ai-input">
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendPrompt()
            }
          }}
          placeholder="输入你的问题..."
          rows={1}
        />
        <button 
          className="mobile-ai-send-btn"
          onClick={sendPrompt}
          disabled={loading || !prompt.trim()}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}