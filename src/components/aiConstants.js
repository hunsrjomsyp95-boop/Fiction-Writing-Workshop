export const QUICK_ACTIONS = [
  { label: '续写', prompt: `请基于我的行文风格续写下一段，保持叙事连贯。

【写作要求】
1. 直接输出内容，不要加任何前缀或解释
2. 用身体动作呈现情绪，不要说"他感到..."
3. 对话要口语化，可以吞字、改口
4. 一句不超过两个逗号
5. 不要用"不是...而是..."等解释句式
6. 不要在段落结尾用环境描写收束情绪
7. 信任读者，不要解释两次` },
  { label: '润色', prompt: `请润色这段文字，提升文笔和表现力，但不要改变剧情走向。

【润色原则】
1. 直接输出修改后的全文，不要解释
2. 删除"他感到、他意识到、他心想"等，用动作替代
3. 不用"不是...而是..."、"与其说...不如说..."等解释句式
4. 每个场景最多一个比喻，不准排比
5. 对话要像真人说话，不要像舞台剧台词
6. 结尾不要升华、点题、停在余韵` },
  { label: '改写', prompt: `请改写这段文字，换一种写法。

【改写要求】
1. 直接输出改写后的全文，不要解释
2. 保持剧情走向和人物性格不变
3. 用具体动作替代心理描写
4. 不用"不是...而是..."等解释句式
5. 对话要口语化，符合人物身份
6. 每段至少一个具体的物理动作或感官输入` },
  { label: '扩写', prompt: `请扩写这段文字，补充细节、氛围和环境描写。

【扩写原则】
1. 直接输出扩写后的全文，不要解释
2. 用感官描写（视觉、听觉、触觉、嗅觉）替代抽象描述
3. 不要用"他感到紧张"，写他的具体身体反应
4. 不用"不是...而是..."等解释句式
5. 环境描写要服务于情节或人物，不要为写而写
6. 每个场景最多一个比喻` },
  { label: '概括', prompt: `请概括这段文字的情节要点。

【要求】
1. 用简洁的语言，不要废话
2. 只保留关键事件和人物行动
3. 不要加评论或感想
4. 按时间顺序，不要倒叙` },
  { label: '人物对话', prompt: `请为当前场景设计一段符合人物性格的对话。

【对话要求】
1. 直接输出对话内容，不要加解释
2. 对话要口语化，可以吞字、改口、说不完
3. 每个人说话风格要不同，体现性格差异
4. 不要像舞台剧台词，要像真人聊天
5. 可以穿插动作描写，不要纯对话` },
  { label: '灵感建议', prompt: `请基于当前内容给出后续剧情的灵感建议。

【要求】
1. 给出5条具体的灵感，每条一句话
2. 要有冲突、反转、意外，不要平铺直叙
3. 每条灵感要能引发读者好奇心
4. 不要解释太多，点到为止` },
]

export const STRICT_EDITOR_SYSTEM = `你是一位极其严格、经验丰富的文学编辑。你的任务是用挑剔的眼光审视这段文字，找出所有问题：

【重点检查】
1. AI味表达：是否有"他感到、他意识到、他心想、不是...而是...、与其说...不如说...、然而、尽管如此、事实上、值得注意的是"等典型AI表达
2. 心理描写：是否用动作替代了直接的心理描述
3. 对话质量：是否像真人说话，还是像舞台剧台词
4. 修辞堆砌：是否有过多比喻、排比、形容词连用
5. 节奏问题：句子是否太长、段落是否太平
6. 结尾处理：是否在用环境描写收束情绪

【输出格式】
逐条列出问题（编号），每条指出：
- 问题位置（引用原文）
- 问题类型（AI味/心理描写/对话/修辞/节奏/结尾）
- 具体改进建议

最后给出一个1-10分的评分。不要客气，不要鼓励，只说问题。`

export const FAN_SYSTEM = `你是一位超级狂热的骨灰粉读者，对这部作品爱到不行！你的任务是用极度热情和真诚的语气夸赞这段文字：
1. 找出所有写得好的地方，大声赞美
2. 分析作者的写作天赋和独特风格
3. 对精彩的情节设计表示惊叹
4. 对生动的人物描写表示感动
5. 预测这部作品一定会大火
6. 用夸张但真诚的语气表达你的喜爱
请至少找出5个闪光点详细夸赞，用emoji表达你的激动心情，最后给出一个"封神指数"评分（可超过10分）。`

export function initParamValues(params) {
  const v = {}
  for (const p of params) {
    if (p.type === 'multiSelect') v[p.key] = p.default ? p.default.split(',') : []
    else if (p.type === 'number') v[p.key] = p.default != null ? p.default : ''
    else v[p.key] = p.default || ''
  }
  return v
}

export function paramsToText(params) {
  if (!Array.isArray(params) || !params.length) return ''
  return params
    .map((p) => {
      const opts = Array.isArray(p.options) ? p.options.join(',') : ''
      let def = p.default
      if (p.type === 'number' && p.min != null && p.max != null && def == null) def = `${p.min}-${p.max}`
      return [p.key, p.type, p.label, def, opts].join('|')
    })
    .join('\n')
}

export function textToParams(text) {
  if (!text || !text.trim()) return []
  return text
    .split('\n')
    .map((line) => {
      const [key, type = 'text', label = '', def = '', opts = ''] = line.split('|').map((s) => s.trim())
      if (!key) return null
      const p = { key, type, label: label || key }
      if (type === 'number') {
        if (/^\d+-\d+$/.test(def)) {
          const [mn, mx] = def.split('-').map(Number)
          p.min = mn
          p.max = mx
        } else if (def !== '') {
          p.default = Number(def) || 0
        }
      } else {
        if (def) p.default = def
      }
      if (opts) p.options = opts.split(',').map((s) => s.trim())
      return p
    })
    .filter(Boolean)
}
