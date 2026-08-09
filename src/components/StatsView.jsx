import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../ToastContext.jsx'
import { useDialog } from '../Dialog.jsx'

export default function StatsView({ novel }) {
  const toast = useToast()
  const { confirm } = useDialog()
  const [stats, setStats] = useState(null)
  const [usage, setUsage] = useState(null)
  const [typing, setTyping] = useState(null)
  const [goal, setGoal] = useState('2000')
  const [targetWords, setTargetWords] = useState(novel.target_words || '')
  const [progress, setProgress] = useState(null)
  const [chartDays, setChartDays] = useState(30)

  const load = useCallback(async () => {
    const s = await window.api.getStats(novel.id)
    setStats(s)
    setUsage(await window.api.getAiUsage())
    setTyping(await window.api.getTypingStats(novel.id))
    const n = await window.api.getNovel(novel.id)
    setTargetWords(n.target_words || '')
    const t = Number(n.target_words) || 0
    setProgress({
      words: s.totalWords,
      target: t,
      pct: t > 0 ? Math.min(100, Math.round((s.totalWords / t) * 100)) : 0,
    })
  }, [novel.id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    window.api.getSetting('daily_goal', '2000').then(setGoal)
  }, [])

  const saveGoal = async () => {
    await window.api.setSetting('daily_goal', String(Number(goal) || 0))
    toast('每日目标已保存', 'success')
  }

  const saveTarget = async () => {
    await window.api.updateNovel(novel.id, { target_words: Number(targetWords) || 0 })
    load()
    toast('目标字数已保存', 'success')
  }

  if (!stats) return <div className='loading'>统计（..</div>

  const cards = [
    { label: '累计字数', value: stats.totalWords, badge: 'accent' },
    { label: '章节', value: `${stats.doneChapters}/${stats.totalChapters} 已完成`, badge: 'green' },
    { label: '人物', value: stats.characters, badge: '' },
    { label: '伏笔', value: stats.foreshadowings, badge: 'yellow' },
    { label: '世界观', value: stats.worldCount, badge: 'cyan' },
    { label: '资料', value: stats.materialCount, badge: '' },
    { label: '关系', value: stats.relations, badge: 'accent' },
    { label: '物品/地点', value: stats.items, badge: '' },
    { label: '年表事件', value: stats.timeline, badge: '' },
  ]

  const allChartData = stats.wordLog.map((d) => ({ day: d.day.slice(5), fullDay: d.day, words: d.words }))
  const chartData = allChartData.slice(-chartDays)
  const maxWords = Math.max(...chartData.map((d) => d.words), 1)
  const today = new Date().toISOString().slice(0, 10)
  const todayWords = (stats.wordLog.find((d) => d.day === today) || {}).words || 0
  const goalNum = Number(goal) || 0

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
      <div className='row wrap' style={{ marginBottom: 14, gap: 8 }}>
        <h2 style={{ fontSize: 18 }}>写作统计</h2>
        <div className='grow' />
        <span className='muted'>今日已写</span>
        <b style={{ color: goalNum && todayWords >= goalNum ? 'var(--green)' : 'var(--yellow)' }}>{todayWords}</b>
        <span className='muted'>/ 目标</span>
        <input type='number' style={{ width: 90 }} value={goal} onChange={(e) => setGoal(e.target.value)} />
        <button className='small' onClick={saveGoal}>
          设目标
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 10,
          marginBottom: 16,
        }}
      >
        {cards.map((c) => (
          <div key={c.label} className='card' style={{ textAlign: 'center' }}>
            <div className='dim' style={{ fontSize: 12 }}>
              {c.label}
            </div>
            <div className='row center' style={{ marginTop: 6, fontSize: 18, fontWeight: 700 }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {goalNum > 0 && (
        <div className='panel' style={{ padding: 14, marginBottom: 16 }}>
          <div className='row' style={{ marginBottom: 8 }}>
            <b>今日目标进度</b>
            <div className='grow' />
            <span className='hint'>{Math.round((todayWords / goalNum) * 100)}%</span>
          </div>
          <div style={{ height: 10, background: 'var(--bg-3)', borderRadius: 5, overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, (todayWords / goalNum) * 100)}%`,
                height: '100%',
                background: todayWords >= goalNum ? 'var(--green)' : 'var(--accent)',
              }}
            />
          </div>
        </div>
      )}

      {/* 全书目标字数进度 */}
      <div className='panel' style={{ padding: 14, marginBottom: 16 }}>
        <div className='row wrap' style={{ marginBottom: 8, gap: 8 }}>
          <b>全书目标字数</b>
          <input
            type='number'
            style={{ width: 120 }}
            value={targetWords}
            onChange={(e) => setTargetWords(e.target.value)}
            placeholder=',100000'
          />
          <button className='small' onClick={saveTarget}>
            保存
          </button>
          <div className='grow' />
          {progress && progress.target > 0 ? (
            <span className={`badge ${progress.pct >= 100 ? 'green' : 'yellow'}`}>
              {progress.words} / {progress.target} 在· {progress.pct}%
            </span>
          ) : (
            <span className='hint'>设置全书目标字数，追踪写作进度</span>
          )}
        </div>
        {progress && progress.target > 0 && (
          <div style={{ height: 12, background: 'var(--bg-3)', borderRadius: 6, overflow: 'hidden' }}>
            <div
              style={{
                width: `${progress.pct}%`,
                height: '100%',
                background: progress.pct >= 100 ? 'var(--green)' : 'var(--accent)',
              }}
            />
          </div>
        )}
      </div>

      {/* 高级统计：角物关系/伏笔/世界分布 */}
      <div className='panel' style={{ padding: 14, marginBottom: 16 }}>
        <div className='row' style={{ marginBottom: 10 }}>
          <b>角色与关系</b>
        </div>
        <div className='row wrap' style={{ gap: 16 }}>
          <div>
            <div className='dim' style={{ fontSize: 12, marginBottom: 6 }}>
              角色定位
            </div>
            <div className='row wrap' style={{ gap: 6 }}>
              {stats.charactersByRole?.map((r) => (
                <span key={r.role} className='badge'>
                  {r.role} ×{r.c}
                </span>
              ))}
              {(!stats.charactersByRole || !stats.charactersByRole.length) && <span className='hint'>暂无角色</span>}
            </div>
          </div>
          <div>
            <div className='dim' style={{ fontSize: 12, marginBottom: 6 }}>
              关系方向
            </div>
            <div className='row wrap' style={{ gap: 6 }}>
              {stats.relationsByDirection?.map((r) => (
                <span key={r.direction} className='badge accent'>
                  {r.direction} ×{r.c}
                </span>
              ))}
              {(!stats.relationsByDirection || !stats.relationsByDirection.length) && (
                <span className='hint'>暂无关系</span>
              )}
            </div>
          </div>
        </div>
        <div className='row' style={{ margin: '10px 0 6px' }}>
          <b style={{ fontSize: 13 }}>关系类型分布</b>
        </div>
        <div className='row wrap' style={{ gap: 6 }}>
          {stats.relationsByType?.map((r) => (
            <span key={r.type} className='badge cyan'>
              {r.type} ×{r.c}
            </span>
          ))}
          {(!stats.relationsByType || !stats.relationsByType.length) && <span className='hint'>暂无</span>}
        </div>
      </div>

      <div className='panel' style={{ padding: 14, marginBottom: 16 }}>
        <div className='row' style={{ marginBottom: 10 }}>
          <b>伏笔与世界观</b>
        </div>
        <div className='row wrap' style={{ gap: 6, marginBottom: 8 }}>
          {stats.foreshadowByStatus?.map((r) => (
            <span key={r.status} className='badge yellow'>
              {r.status} ×{r.c}
            </span>
          ))}
          {(!stats.foreshadowByStatus || !stats.foreshadowByStatus.length) && <span className='hint'>暂无伏笔</span>}
        </div>
        <div className='row wrap' style={{ gap: 6 }}>
          {stats.worldNames?.map((r) => (
            <span key={r.world_name} className='badge cyan'>
              {r.world_name} · {r.c} 条设定
            </span>
          ))}
        </div>
      </div>

      <div className='panel' style={{ padding: 14, marginBottom: 16 }}>
        <div className='row wrap' style={{ marginBottom: 10, gap: 8 }}>
          <b>手打码字统计</b>
          <div className='grow' />
          <span className='badge green' title='本次打开软件后手打输入的字数'>
            本次手打 {typing?.session || 0} 字
          </span>
          <span className='badge yellow' title='今日手打输入的字数'>
            今日手打 {typing?.today || 0} 字
          </span>
        </div>
        {!typing || typing.hourly.length === 0 ? (
          <div className='hint'>手打输入时这里会按小时记录（粘贴 / AI 生成 / 撤销不计入）。</div>
        ) : (
          <>
            <div className='row' style={{ marginBottom: 8 }}>
              <b style={{ fontSize: 13 }}>每小时打字数量（今日）</b>
            </div>
            <HourlyBar hourly={typing.hourly} />
          </>
        )}
      </div>

      <div className='panel' style={{ padding: 14, marginBottom: 16 }}>
        <div className='row wrap' style={{ marginBottom: 10, gap: 6 }}>
          <b>每日字数趋势</b>
          <button className={`small ${chartDays === 7 ? 'primary' : ''}`} onClick={() => setChartDays(7)}>
            7天
          </button>
          <button className={`small ${chartDays === 30 ? 'primary' : ''}`} onClick={() => setChartDays(30)}>
            30天
          </button>
          <button className={`small ${chartDays === 90 ? 'primary' : ''}`} onClick={() => setChartDays(90)}>
            90天
          </button>
          <div className='grow' />
          <span className='hint'>{chartData.length} 天有记录</span>
        </div>
        {chartData.length === 0 ? (
          <div className='hint'>写作后这里会显示字数趋势。每章保存时自动记录。</div>
        ) : (
          <LineChart data={chartData} maxWords={maxWords} />
        )}
      </div>

      <div className='panel' style={{ padding: 14, marginBottom: 16 }}>
        <div className='row' style={{ marginBottom: 10 }}>
          <b>各章节字数</b>
          <div className='grow' />
          <span className='hint'>累计 {stats.totalWords} 字</span>
        </div>
        {stats.byChapter.length === 0 ? (
          <div className='hint'>暂无章节，</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {stats.byChapter.map((c) => (
              <div key={c.title + c.word_count} className='row'>
                <span
                  className='dim'
                  style={{ width: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {c.title}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 16,
                    background: 'var(--bg-3)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: `${Math.max(2, (c.word_count / Math.max(stats.totalWords, 1)) * 100)}%`,
                      height: '100%',
                      background: c.status === '已完成' ? 'var(--green)' : 'var(--accent)',
                      opacity: 0.8,
                    }}
                  />
                </div>
                <span className='muted' style={{ width: 70, textAlign: 'right' }}>
                  {c.word_count} 字
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='panel' style={{ padding: 14 }}>
        <div className='row' style={{ marginBottom: 10 }}>
          <b>AI 用量统计</b>
          <div className='grow' />
          <button
            className='small danger'
            onClick={async () => {
              if (await confirm({ title: '清空记录', message: '清空 AI 用量记录？', danger: true })) {
                await window.api.clearAiUsage()
                setUsage(await window.api.getAiUsage())
                toast('已清空', 'success')
              }
            }}
          >
            清空记录
          </button>
        </div>
        {!usage || usage.calls === 0 ? (
          <div className='hint'>使用 AI 功能后这里会记录 token 消耗与调用次数。</div>
        ) : (
          <>
            <div className='row wrap' style={{ gap: 8, marginBottom: 10 }}>
              <span className='badge accent'>调用 {usage.calls} 次</span>
              <span className='badge green'>输入 {usage.prompt} tokens</span>
              <span className='badge yellow'>输出 {usage.completion} tokens</span>
              <span className='badge'>合计 {usage.prompt + usage.completion} tokens</span>
            </div>
            {usage.byDay.length > 0 && (
              <>
                <div className='row' style={{ margin: '6px 0' }}>
                  <b style={{ fontSize: 13 }}>按天</b>
                </div>
                <LineChart
                  data={usage.byDay
                    .slice()
                    .reverse()
                    .map((d) => ({ day: d.day.slice(5), words: d.prompt + d.completion }))}
                  maxWords={Math.max(...usage.byDay.map((d) => d.prompt + d.completion), 1)}
                />
              </>
            )}
            {usage.byModel.length > 0 && (
              <>
                <div className='row' style={{ margin: '10px 0 6px' }}>
                  <b style={{ fontSize: 13 }}>按模型</b>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {usage.byModel.map((m) => (
                    <div key={m.model} className='row'>
                      <span className='badge cyan grow' style={{ justifyContent: 'flex-start' }}>
                        {m.model || '未知'}
                      </span>
                      <span className='hint'>
                        {m.calls} 次· {m.prompt + m.completion} tokens
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function LineChart({ data, maxWords }) {
  const W = 660,
    H = 180,
    P = 24
  if (data.length < 2) {
    return <div className='hint'>至少需要两天的记录才能绘制趋势。</div>
  }
  const n = data.length
  const x = (i) => P + (i * (W - P * 2)) / Math.max(n - 1, 1)
  const y = (v) => H - P - (v / maxWords) * (H - P * 2)
  const pts = data.map((d, i) => `${x(i)},${y(d.words)}`).join(' ')
  const area = `${P},${H - P} ${pts} ${x(n - 1)},${H - P}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
      <defs>
        <linearGradient id='areaG' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stopColor='#7c7cf0' stopOpacity='0.4' />
          <stop offset='100%' stopColor='#7c7cf0' stopOpacity='0.02' />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <line
          key={r}
          x1={P}
          x2={W - P}
          y1={y(maxWords * r)}
          y2={y(maxWords * r)}
          stroke='#3b3b52'
          strokeDasharray='4 4'
        />
      ))}
      <polygon points={area} fill='url(#areaG)' />
      <polyline points={pts} fill='none' stroke='#7c7cf0' strokeWidth='2' />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.words)} r='3' fill='#7c7cf0' />
          {(i === 0 || i === n - 1) && (
            <>
              <text x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : 'end'} fill='#a0a0b8' fontSize='11'>
                {d.day}
              </text>
              <text x={x(i)} y={y(d.words) - 8} textAnchor='middle' fill='#e6e6ef' fontSize='11'>
                {d.words}
              </text>
            </>
          )}
        </g>
      ))}
    </svg>
  )
}

function HourlyBar({ hourly }) {
  const max = Math.max(...hourly.map((h) => h.words), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
      {hourly.map((h) => (
        <div
          key={h.hour}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            height: '100%',
            justifyContent: 'flex-end',
          }}
          title={`${h.hour}:00 - ${h.words} 字`}
        >
          <span className='hint' style={{ fontSize: 10 }}>
            {h.words}
          </span>
          <div
            style={{
              width: '100%',
              maxWidth: 34,
              height: `${Math.max(4, (h.words / max) * 70)}%`,
              background: 'var(--accent)',
              borderRadius: '4px 4px 0 0',
              opacity: 0.85,
            }}
          />
          <span className='hint' style={{ fontSize: 10 }}>
            {h.hour}:00
          </span>
        </div>
      ))}
    </div>
  )
}
