const { app } = require('electron')
app.whenReady().then(async () => {
  const os = require('os')
  const path = require('path')
  const fs = require('fs')
  process.env.APPDATA = path.join(os.tmpdir(), 'novel-studio-tl-test')
  fs.rmSync(process.env.APPDATA, { recursive: true, force: true })
  const services = require('../electron/services')
  let passed = 0, failed = 0
  const check = (c, m) => { if (c) { passed++; console.log('  PASS:', m) } else { failed++; console.log('  FAIL:', m) } }

  const novel = services.createNovel({ name: '年表排序测试' })
  // 乱序创建
  services.createTimelineEvent(novel.id, { title: '十年后', story_time: '10年后' })
  services.createTimelineEvent(novel.id, { title: '无时间', story_time: '' })
  services.createTimelineEvent(novel.id, { title: '第三年', story_time: '开元三年' })
  services.createTimelineEvent(novel.id, { title: '二十年后', story_time: '第20年' })
  services.createTimelineEvent(novel.id, { title: '第二年', story_time: '开元二年' })
  services.createTimelineEvent(novel.id, { title: '穿越当日', story_time: '穿越后第1天' })

  // 手动排序：初始按创建顺序
  let list = services.listTimeline(novel.id)
  check(list.length === 6 && list[0].title === '十年后', '初始按创建顺序')

  // 上移：把第三年移到第一
  const ids = list.map((e) => e.id)
  const i3 = ids.indexOf(list.find((e) => e.title === '第三年').id)
  ;[ids[i3], ids[0]] = [ids[0], ids[i3]]
  list = services.reorderTimeline(novel.id, ids)
  check(list[0].title === '第三年', '手动排序生效')

  // 按故事时间排序：数值升序（穿越当日1 < 开元二年2 < 开元三年3 < 十年后10 < 第20年20），无时间排最后
  list = services.sortTimelineByStoryTime(novel.id)
  const order = list.map((e) => e.title)
  check(order[0] === '穿越当日', `时间排序首位=穿越当日：${order.join(',')}`)
  check(order[1] === '第二年' && order[2] === '第三年', '中文数字年份按顺序')
  check(order[3] === '十年后' && order[4] === '二十年后', '数字年按数值排序')
  check(order[5] === '无时间', '无故事时间排最后')

  console.log(`\n========== 年表排序测试：${passed} 通过，${failed} 失败 ==========`)
  app.exit(failed > 0 ? 1 : 0)
})
