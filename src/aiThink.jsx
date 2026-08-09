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
        prompt:
          '请作为资深小说编辑分析以下文本，给出具体可执行的改进建议：亮点、问题、节奏、描写、对话、爽点与结构优化。',
        system: '你是资深小说编辑，善于给出建设性、可落地的修改意见。',
      }
    case 'plot':
      return {
        prompt: '请基于当前文本设计后续剧情：给出 3-5 条具体的后续发展方案，每条包含剧情走向、冲突升级、章节钩子。',
        system: '你是小说剧情架构师，擅长设计扣人心弦、逻辑自洽的后续情节。',
      }
    case 'character': {
      const req = await askPrompt({
        title: '人物设计',
        label: '人物要求（可留空，AI 会根据正文分析）',
        placeholder: '如：主角的宿敌，剑术高超，性格偏执',
      })
      if (req === null) return null
      return {
        prompt: `请设计/完善一个小说人物：${req || '基于当前文本中已有的人物线索'}`,
        system:
          '你是角色设计师，生成有辨识度、有矛盾、有成长弧光的人物档案：姓名、定位、外貌、性格、动机、背景、能力、缺陷、弧光、在故事中的用途。',
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
        prompt: `请根据「${req}」起名：给出 10 个候选名，每个配一句含义说明与适用场景。`,
        system: '你是起名专家，擅长人物名、道具名、地点名、势力名、书名的创作，名字要有辨识度、好记、贴合风格。',
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
        prompt: `【文风样本】\n${sample}\n\n请先分析这段样本的文风要点，然后用该文风仿写当前的正文内容。`,
        system: '你是文风分析仿写专家：先提炼样本的句式、用词、描写、语气、节奏特点，再严格模仿该风格进行改写/仿写。',
      }
    }
    case 'beats':
      return {
        prompt:
          '请为当前章节设计情感节拍规划：开头悬念/铺垫、中段升级/冲突推进、情绪顶点、结尾钩子/状态卡。给出本章的情感曲线、爽点安排、转折点与读者心理预期。',
        system: '你是情感节奏设计师，擅长章节级情绪曲线与节拍设计，输出可直接执行的章节大纲。',
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
        prompt: `请把以下内容翻译成${lang}。要求：1. 保留原作的文风、语气与节奏；2. 人名、地名、专有名词保留拼音或音译并保持全文一致；3. 译文要自然流畅、有文学性，避免机器翻译腔；4. 直接输出译文，不要解释。\n\n【待翻译文本】\n`,
        system: '你是资深文学翻译家，擅长小说文体的多语种翻译，注重文风还原与专有名词的一致性。',
      }
    }
    case 'consistency':
      return {
        prompt:
          '请检查当前章节中各角色的表现是否与之前一致。重点关注：1. 性格特征是否前后矛盾；2. 说话方式/语气是否突变；3. 人物关系描述是否与设定冲突；4. 外貌/能力描写是否有出入；5. 行为动机是否合理。逐条列出发现的问题，如果没发现问题请说明角色表现一致。',
        system:
          '你是角色一致性审查专家。你会仔细比对当前章节中角色的表现与项目设定中的人物档案（性格、外貌、背景、关系等），找出所有不一致的地方。输出格式：角色名 → 问题描述 → 出处 → 建议修改。',
      }
    default:
      return null
  }
}

// 拼装项目设定作为 AI 引用上下文（世界观/人物/大纲/年表/伏笔/创作规则）
export async function buildProjectContext(novelId) {
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
  } catch (e) {
    return ''
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
