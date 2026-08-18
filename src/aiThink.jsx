// 共享的 AI 思考逻辑：AIPanel 与 AIServiceView 复用
// import { useDialog } from './Dialog.jsx'
import { Lightbulb, ArrowRight, User, PenTool, Feather, Music, ArrowLeftRight, ShieldCheck } from 'lucide-react'

export const THINK_ACTIONS = [
  { key: 'advice', label: '给出建议', icon: Lightbulb },
  { key: 'plot', label: '后续剧情', icon: ArrowRight },
  { key: 'character', label: '人物设计', icon: User },
  { key: 'naming', label: '起名', icon: PenTool },
  { key: 'style', label: '文笔仿写', icon: Feather },
  { key: 'beats', label: '情感节拍', icon: Music },
  { key: 'translate', label: '翻译', icon: ArrowLeftRight },
  { key: 'consistency', label: '角色一致性', icon: ShieldCheck },
]

// 构建一次思考请求：收集参数并返回 { prompt, system, withCtx }；用户取消返回 null
export async function buildThinkRequest(key, askPrompt) {
  switch (key) {
    case 'advice':
      return {
        prompt: `请作为资深小说编辑分析以下文本，给出具体可执行的改进建议。

【分析维度】
1. AI味检查：是否有"他感到、他意识到、不是...而是...、与其说...不如说...、然而、尽管如此"等典型AI表达
2. 动作vs心理：是否用具体动作替代了直接心理描写
3. 对话质量：是否像真人说话
4. 节奏控制：长短句交替、紧张舒缓转换
5. 细节描写：是否有具体的感官输入
6. 结尾处理：是否在用环境收束情绪

请逐条列出问题，每条给出具体位置和改进建议。`,
        system: `你是资深小说编辑，专门识别和修改AI味文本。

你的核心原则：
1. 用动作呈现情绪，而非直接描述
2. 对话要口语化，像真人聊天
3. 信任读者，不要解释两次
4. 每个场景最多一个比喻
5. 结尾不要升华、点题

请给出建设性、可落地的修改意见。`,
      }
    case 'plot':
      return {
        prompt: `请基于当前文本设计后续剧情。

【要求】
1. 给出3-5条具体的后续发展方案
2. 每条包含：剧情走向、冲突升级点、章节钩子
3. 要有意外和反转，不要平铺直叙
4. 每条方案要能引发读者好奇心
5. 不要解释太多，点到为止`,
        system: '你是小说剧情架构师，擅长设计扣人心弦、逻辑自洽的后续情节。重点：要有冲突、反转、意外，不要套路化。',
      }
    case 'character': {
      const req = await askPrompt({
        title: '人物设计',
        label: '人物要求（可留空，AI 会根据正文分析）',
        placeholder: '如：主角的宿敌，剑术高超，性格偏执',
      })
      if (req === null) return null
      return {
        prompt: `请设计/完善一个小说人物：${req || '基于当前文本中已有的人物线索'}

【输出要求】
1. 姓名、定位、外貌、性格
2. 动机、背景、能力、缺陷
3. 成长弧光（成长/堕落）
4. 在故事中的用途
5. 至少一个标志性动作或口头禅（体现性格）
6. 至少一个矛盾点（让人物立体）`,
        system: `你是角色设计师，生成有辨识度、有矛盾、有成长弧光的人物档案。

核心原则：
1. 用具体细节展现性格，而非标签
2. 每个人物要有至少一个矛盾点
3. 对话风格要体现人物个性
4. 不要脸谱化，要立体`,
      }
    }
    case 'naming': {
      const req = await askPrompt({
        title: '起名',
        label: '起名类型与要求',
        placeholder: '如：仙侠主角名，意境清冷 / 神秘地点名 / 神兵利器名',
      })
      if (req === null) return null
      return {
        prompt: `请根据「${req}」起名：给出10个候选名，每个配一句含义说明与适用场景。

【要求】
1. 名字要有辨识度、好记
2. 贴合风格和设定
3. 避免俗套和撞名
4. 含义要简洁有力`,
        system: '你是起名专家，擅长人物名、道具名、地点名、势力名、书名的创作。',
        withCtx: false,
      }
    }
    case 'style': {
      const sample = await askPrompt({
        title: '文笔仿写',
        label: '粘贴要学习的文风样本',
        placeholder: '粘贴一段你喜欢的文字风格...',
      })
      if (sample === null || !sample.trim()) return null
      return {
        prompt: `【文风样本】
${sample}

请先分析这段样本的文风要点，然后用该文风仿写当前的正文内容。

【分析要点】
1. 句式特点（长短句比例、断句习惯）
2. 用词偏好（书面/口语/古风/网络）
3. 描写手法（动作/心理/环境的比例）
4. 节奏模式（紧张舒缓的转换方式）
5. 独特元素（比喻、口头禅、标点习惯）

【仿写要求】
1. 直接输出仿写内容，不要解释
2. 严格模仿样本的句式和用词
3. 保持原文的剧情走向
4. 避免AI味：不用"他感到、他意识到、不是...而是..."等表达`,
        system: `你是文风分析仿写专家。

核心原则：
1. 先提炼样本的句式、用词、描写、语气、节奏特点
2. 再严格模仿该风格进行改写/仿写
3. 避免AI味：不用"他感到、他意识到、不是...而是...、与其说...不如说..."等表达
4. 用动作呈现情绪，用口语化对话`,
      }
    }
    case 'beats':
      return {
        prompt: `请为当前章节设计情感节拍规划。

【输出内容】
1. 开头：悬念/铺垫（如何抓住读者）
2. 中段：升级/冲突推进（如何制造紧张）
3. 情绪顶点（最紧张/感动/愤怒的瞬间）
4. 结尾：钩子/状态卡（如何让读者想看下一章）

【要求】
- 给出具体的情感曲线
- 标注爽点和转折点
- 说明读者心理预期
- 输出可直接执行的章节大纲`,
        system: '你是情感节奏设计师，擅长章节级情绪曲线与节拍设计。重点：张弛有度，有起有伏。',
      }
    case 'translate': {
      const lang = await askPrompt({
        title: '翻译',
        label: '目标语言',
        value: '英语',
        placeholder: '英语 / 日语 / 韩语 / 法语 / 西班牙语...',
      })
      if (lang === null || !lang.trim()) return null
      return {
        prompt: `请把以下内容翻译成${lang}。

【要求】
1. 保留原作的文风、语气与节奏
2. 人名、地名、专有名词保留拼音或音译并保持全文一致
3. 译文要自然流畅、有文学性，避免机器翻译腔
4. 直接输出译文，不要解释`,
        system: '你是资深文学翻译家，擅长小说文体的多语种翻译，注重文风还原与专有名词的一致性。',
      }
    }
    case 'consistency':
      return {
        prompt: `请检查当前章节中各角色的表现是否与之前一致。

【检查重点】
1. 性格特征是否前后矛盾
2. 说话方式/语气是否突变
3. 人物关系描述是否与设定冲突
4. 外貌/能力描写是否有出入
5. 行为动机是否合理

【输出格式】
角色名 → 问题描述 → 出处 → 建议修改

如果没发现问题，请说明角色表现一致。`,
        system: '你是角色一致性审查专家。仔细比对当前章节中角色的表现与项目设定中的人物档案，找出所有不一致的地方。',
      }
    default:
      return null
  }
}

// 拼装项目设定作为 AI 引用上下文（世界观/人物/大纲/年表/伏笔/创作规则）
// 使用缓存避免重复查询
export async function buildProjectContext(novelId) {
  try {
    const cached = await window.api.aiGetContext(novelId)
    return cached || ''
  } catch (e) {
    // 回退到直接查询
    try {
      const [worlds, chars, outlines, timeline, fsh, rules] = await Promise.all([
        window.api.listWorlds(novelId),
        window.api.listCharacters(novelId),
        window.api.listOutlines(novelId),
        window.api.listTimeline(novelId),
        window.api.listForeshadowings(novelId),
        window.api.listWorldRules(novelId),
      ])
      const parts = []
      if (worlds.length)
        parts.push(
          `【世界观】${worlds
            .map((w) => `${w.name}：${(w.content || '').slice(0, 120)}`)
            .join('\n')
            .slice(0, 10000)}`
        )
      if (chars.length)
        parts.push(
          `【人物】${chars
            .map((c) => `${c.name}（${c.role}）：${(c.personality || c.background || '').slice(0, 100)}`)
            .join('\n')
            .slice(0, 6000)}`
        )
      if (outlines.length)
        parts.push(
          `【大纲】${outlines
            .map((o) => `${o.title}：${(o.content || '').slice(0, 100)}`)
            .join('\n')
            .slice(0, 6000)}`
        )
      if (timeline.length)
        parts.push(
          `【故事年表】${timeline
            .map((t) => `${t.story_time || '?'} ${t.title}`)
            .join('；')
            .slice(0, 2000)}`
        )
      if (fsh.length)
        parts.push(
          `【伏笔状态】${fsh
            .map((f) => `${f.title}(${f.status})`)
            .join('、')
            .slice(0, 2000)}`
        )
      if (rules.length)
        parts.push(
          `【真实与幻想规则】${rules
            .map(
              (r) =>
                `${r.era}/${r.type === '史实' ? '◈ 史实' : '◇ 架空'}：${r.item}${r.content ? ' - ' + r.content.slice(0, 80) : ''}`
            )
            .join('\n')
            .slice(0, 5000)}`
        )
      return parts.join('\n\n')
    } catch {
      return ''
    }
  }
}

// 供组件内直接用：useThinkRun 返回 run(key) 函数
export function useThinkRun({ ask, askPrompt }) {
  return async (key) => {
    const req = await buildThinkRequest(key, askPrompt)
    if (!req) return
    await ask(req.prompt, req.system, { withCtx: req.withCtx !== false })
  }
}
