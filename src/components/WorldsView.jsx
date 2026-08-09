import { useState } from 'react'
import WorldsSub from './worlds/WorldsSub.jsx'
import ItemsSub from './worlds/ItemsSub.jsx'
import SettingsAnalyzer from './worlds/SettingsAnalyzer.jsx'
import WorldMap from './worlds/WorldMap.jsx'
import RulesSub from './worlds/RulesSub.jsx'

export default function WorldsView({ novel }) {
  const [sub, setSub] = useState('worlds')

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <div className='tabs'>
        <div className={`tab ${sub === 'worlds' ? 'active' : ''}`} onClick={() => setSub('worlds')}>
          世界设定
        </div>
        <div className={`tab ${sub === 'items' ? 'active' : ''}`} onClick={() => setSub('items')}>
          物品 / 道具 / 地点
        </div>
        <div className={`tab ${sub === 'map' ? 'active' : ''}`} onClick={() => setSub('map')}>
          世界地图
        </div>
        <div className={`tab ${sub === 'rules' ? 'active' : ''}`} onClick={() => setSub('rules')}>
          创作规则
        </div>
        <div className={`tab ${sub === 'analyze' ? 'active' : ''}`} onClick={() => setSub('analyze')}>
          AI 分析分类
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {sub === 'worlds' ? (
          <WorldsSub novel={novel} />
        ) : sub === 'items' ? (
          <ItemsSub novel={novel} />
        ) : sub === 'map' ? (
          <WorldMap novel={novel} />
        ) : sub === 'rules' ? (
          <RulesSub novel={novel} />
        ) : (
          <SettingsAnalyzer novel={novel} />
        )}
      </div>
    </div>
  )
}
