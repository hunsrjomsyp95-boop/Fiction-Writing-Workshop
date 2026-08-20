import { useState } from 'react'
import ThemeSettings from './ThemeSettings.jsx'
import EditorSettings from './EditorSettings.jsx'
import AISettings from './AISettings.jsx'
import SkillsPanel from './SkillsPanel.jsx'
import AboutTab from './AboutTab.jsx'
import SponsorTab from './SponsorTab.jsx'

export default function SettingsModal({ onClose }) {
  const [tab, setTab] = useState('theme')

  return (
    <div className='modal-mask'>
      <div className='modal' style={{ width: 640 }} onClick={(e) => e.stopPropagation()}>
        <div className='modal-head'>
          设置
          <div className='tabs' style={{ background: 'none', border: 'none', padding: 0, marginLeft: 12 }}>
            <div className={`tab ${tab === 'theme' ? 'active' : ''}`} onClick={() => setTab('theme')}>
              主题
            </div>
            <div className={`tab ${tab === 'editor' ? 'active' : ''}`} onClick={() => setTab('editor')}>
              编辑器
            </div>
            <div className={`tab ${tab === 'ai' ? 'active' : ''}`} onClick={() => setTab('ai')}>
              AI 设置
            </div>
            <div className={`tab ${tab === 'skills' ? 'active' : ''}`} onClick={() => setTab('skills')}>
              Skill
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
          {tab === 'theme' && <ThemeSettings />}
          {tab === 'editor' && <EditorSettings />}
          {tab === 'ai' && <AISettings />}
          {tab === 'skills' && <SkillsPanel />}
          {tab === 'about' && <AboutTab />}
          {tab === 'sponsor' && <SponsorTab />}
        </div>
      </div>
    </div>
  )
}
