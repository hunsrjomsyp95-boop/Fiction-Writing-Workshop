import { useState } from 'react'
import { useToast } from '../../ToastContext.jsx'

export default function WorldMap({ novel }) {
  const toast = useToast()
  const [svg, setSvg] = useState('')
  const [busy, setBusy] = useState(false)

  const generate = async () => {
    setBusy(true)
    try {
      const [worlds, items, timeline] = await Promise.all([
        window.api.listWorlds(novel.id),
        window.api.listItems(novel.id),
        window.api.listTimeline(novel.id),
      ])
      const places = []
      for (const w of worlds) {
        if (w.category === '地理' || w.name.includes('大陆') || w.name.includes('') || w.name.includes('山脉')) {
          places.push(`${w.name}|${w.category === '地理' ? '自然' : '其他'}|${w.content ? w.content.slice(0, 60) : ''}`)
        }
      }
      for (const it of items) {
        if (it.category === '关键地点') places.push(`${it.name}|${it.category}|${it.location || ''}`)
      }
      const locs = [...new Set(timeline.map((t) => t.location).filter(Boolean))]
      for (const l of locs) places.push(`${l}|其他|`)
      if (!places.length) {
        toast('还没有地点数据。请在「世界设定」写地理设定，或在「物品」里添加关键地点。', 'error')
        return
      }
      const text = places.join('\n')
      const svgCode = await window.api.aiGenerateMap(text)
      if (!svgCode.startsWith('<svg')) {
        toast('AI 未生成有效的 SVG', 'error')
        return
      }
      setSvg(svgCode)
      toast('世界地图已生成', 'success')
    } catch (e) {
      toast('生成失败：' + e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: 12 }}>
      <div className='row' style={{ marginBottom: 10 }}>
        <button className='primary' onClick={generate} disabled={busy}>
          {busy ? '生成版..' : 'AI 生成世界地图'}
        </button>
        <span className='hint'>根据世界设定中的地理条目、关键地点和年表地点生成 SVG 世界地图。</span>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          overflow: 'auto',
        }}
      >
        {svg ? (
          <div style={{ width: 800, margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <div className='empty-state'>
            <div className='hint'>
              点击按钮，AI 会根据你的地点设定生成一张奇幻世界地图。
              <br />
              建议先在「世界设定」写清楚地理、大陆、门派，或在「物品」中标记关键地点。
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
