import{c as l,g as p}from"./index-CRoiV1HH.js";import{U as u}from"./user-CLbhGQyi.js";/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=[["path",{d:"M8 3 4 7l4 4",key:"9rb6wj"}],["path",{d:"M4 7h16",key:"6tx8e3"}],["path",{d:"m16 21 4-4-4-4",key:"siv7j2"}],["path",{d:"M20 17H4",key:"h6l3hr"}]],m=l("arrow-left-right",y);/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]],w=l("arrow-right",d);/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $=[["path",{d:"M14.086 18.412A2 2 0 0112.67 19H5v-7.672a2 2 0 01.586-1.414L11.75 3.75a6 6 0 118.49 8.49z",key:"1nq9jb"}],["path",{d:"M16 8 2 22",key:"vp34q"}],["path",{d:"M17.488 15H9",key:"16yirz"}]],k=l("feather",$);/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=[["path",{d:"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",key:"1gvzjb"}],["path",{d:"M9 18h6",key:"x1upvd"}],["path",{d:"M10 22h4",key:"ceow96"}]],f=l("lightbulb",b);/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g=[["path",{d:"M9 18V5l12-2v13",key:"1jmyc2"}],["circle",{cx:"6",cy:"18",r:"3",key:"fqmcym"}],["circle",{cx:"18",cy:"16",r:"3",key:"1hluhg"}]],_=l("music",g);/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],M=l("shield-check",j),q=[{key:"advice",label:"给出建议",icon:f},{key:"plot",label:"后续剧情",icon:w},{key:"character",label:"人物设计",icon:u},{key:"naming",label:"起名",icon:p},{key:"style",label:"文笔仿写",icon:k},{key:"beats",label:"情感节拍",icon:_},{key:"translate",label:"翻译",icon:m},{key:"consistency",label:"角色一致性",icon:M}];async function A(n,i){switch(n){case"advice":return{prompt:`请作为资深小说编辑分析以下文本，给出具体可执行的改进建议。

分析的核心标准：这段文字是否有人类写作的"意图感"？每一句话是否有"为什么写在这里"的理由？

【分析维度】
1. AI味检查：是否有"他感到、他意识到、不是...而是...、与其说...不如说...、然而、尽管如此"等典型AI表达
2. 动作vs心理：是否用具体动作替代了直接心理描写
3. 对话质量：是否像真人说话。对话是否太"文明"？有没有用沉默、省略、打断？语气是否从头到尾一个调？
4. 节奏控制：长短句交替、紧张舒缓转换。有没有连续3个以上长度相近的句子？
5. 细节描写：是否有具体的感官输入
6. 结尾处理：是否在用环境收束情绪
7. 叙事问题：是否什么都解释了？是否跳过了无聊的部分？视角是否跟着角色走？
8. 情绪问题：情绪是否太单一？是否太"合理"？是否一直拉满？
9. 角色问题：角色是否太"一致"？内心独白是否太"得体"？叙述者是否太中性？

请逐条列出问题，每条给出具体位置和改进建议。`,system:`你是资深小说编辑，专门识别和修改AI味文本。你的审查基于21部中文网文经典、约50万字深度阅读的人类写作特征分析。

你的核心原则：
1. 用动作呈现情绪，而非直接描述
2. 对话要口语化，像真人聊天。对话不是信息交换，是试探边界
3. 信任读者，不要解释两次
4. 每个场景最多一个比喻
5. 结尾不要升华、点题
6. 句子长短交替，制造呼吸感
7. 情绪要混合，不要单一
8. 叙述者可以有态度，可以吐槽
9. 允许跑题和闲笔
10. 跳过无聊的部分，展开有趣的部分

请给出建设性、可落地的修改意见。`};case"plot":return{prompt:`请基于当前文本设计后续剧情。

【要求】
1. 给出3-5条具体的后续发展方案
2. 每条包含：剧情走向、冲突升级点、章节钩子
3. 要有意外和反转，不要平铺直叙
4. 每条方案要能引发读者好奇心
5. 不要解释太多，点到为止`,system:"你是小说剧情架构师，擅长设计扣人心弦、逻辑自洽的后续情节。重点：要有冲突、反转、意外，不要套路化。"};case"character":{const t=await i({title:"人物设计",label:"人物要求（可留空，AI 会根据正文分析）",placeholder:"如：主角的宿敌，剑术高超，性格偏执"});return t===null?null:{prompt:`请设计/完善一个小说人物：${t||"基于当前文本中已有的人物线索"}

【输出要求】
1. 姓名、定位、外貌、性格
2. 动机、背景、能力、缺陷
3. 成长弧光（成长/堕落）
4. 在故事中的用途
5. 至少一个标志性动作或口头禅（体现性格）
6. 至少一个矛盾点（让人物立体）`,system:`你是角色设计师，生成有辨识度、有矛盾、有成长弧光的人物档案。

核心原则：
1. 用具体细节展现性格，而非标签
2. 每个人物要有至少一个矛盾点
3. 对话风格要体现人物个性
4. 不要脸谱化，要立体`}}case"naming":{const t=await i({title:"起名",label:"起名类型与要求",placeholder:"如：仙侠主角名，意境清冷 / 神秘地点名 / 神兵利器名"});return t===null?null:{prompt:`请根据「${t}」起名：给出10个候选名，每个配一句含义说明与适用场景。

【要求】
1. 名字要有辨识度、好记
2. 贴合风格和设定
3. 避免俗套和撞名
4. 含义要简洁有力`,system:"你是起名专家，擅长人物名、道具名、地点名、势力名、书名的创作。",withCtx:!1}}case"style":{const t=await i({title:"文笔仿写",label:"粘贴要学习的文风样本",placeholder:"粘贴一段你喜欢的文字风格..."});return t===null||!t.trim()?null:{prompt:`【文风样本】
${t}

请先分析这段样本的文风要点，然后用该文风仿写当前的正文内容。

【分析要点】
1. 句式特点（长短句比例、断句习惯、是否有一句一段）
2. 用词偏好（书面/口语/古风/网络、高频词汇）
3. 描写手法（动作/心理/环境的比例、感官描写偏好）
4. 节奏模式（紧张舒缓的转换方式、段落长度）
5. 独特元素（比喻风格、口头禅、标点习惯）
6. 对话特点（口语化程度、省略方式、是否有沉默/断裂）
7. 叙述者态度（中性/有态度/会吐槽）
8. 意图特征（作者想让读者感受到什么？用了什么手法达成？）

【仿写要求】
1. 直接输出仿写内容，不要解释
2. 严格模仿样本的句式和用词
3. 保持原文的剧情走向
4. 避免AI味：不用"他感到、他意识到、不是...而是..."等表达
5. 句子长短交替，允许"不完整句"和"一句一段"
6. 对话口语化，允许沉默和断裂
7. 情绪要混合，叙述者可以有态度`,system:`你是文风分析仿写专家。你的分析基于21部中文网文经典的人类写作特征。

核心原则：
1. 先提炼样本的句式、用词、描写、语气、节奏、对话、叙述者态度特点
2. 再严格模仿该风格进行改写/仿写
3. 避免AI味：不用"他感到、他意识到、不是...而是...、与其说...不如说..."等表达
4. 用动作呈现情绪，用口语化对话
5. 句子长短交替，允许"不完整句"
6. 情绪要混合，叙述者可以有态度`}}case"beats":return{prompt:`请为当前章节设计情感节拍规划。

【输出内容】
1. 开头：悬念/铺垫（如何抓住读者）
2. 中段：升级/冲突推进（如何制造紧张）
3. 情绪顶点（最紧张/感动/愤怒的瞬间）
4. 结尾：钩子/状态卡（如何让读者想看下一章）

【要求】
- 给出具体的情感曲线
- 标注爽点和转折点
- 说明读者心理预期
- 输出可直接执行的章节大纲`,system:"你是情感节奏设计师，擅长章节级情绪曲线与节拍设计。重点：张弛有度，有起有伏。"};case"translate":{const t=await i({title:"翻译",label:"目标语言",value:"英语",placeholder:"英语 / 日语 / 韩语 / 法语 / 西班牙语..."});return t===null||!t.trim()?null:{prompt:`请把以下内容翻译成${t}。

【要求】
1. 保留原作的文风、语气与节奏
2. 人名、地名、专有名词保留拼音或音译并保持全文一致
3. 译文要自然流畅、有文学性，避免机器翻译腔
4. 直接输出译文，不要解释`,system:"你是资深文学翻译家，擅长小说文体的多语种翻译，注重文风还原与专有名词的一致性。"}}case"consistency":return{prompt:`请检查当前章节中各角色的表现是否与之前一致。

【检查重点】
1. 性格特征是否前后矛盾
2. 说话方式/语气是否突变
3. 人物关系描述是否与设定冲突
4. 外貌/能力描写是否有出入
5. 行为动机是否合理

【输出格式】
角色名 → 问题描述 → 出处 → 建议修改

如果没发现问题，请说明角色表现一致。`,system:"你是角色一致性审查专家。仔细比对当前章节中角色的表现与项目设定中的人物档案，找出所有不一致的地方。"};default:return null}}async function N(n){try{return await window.api.aiGetContext(n)||""}catch{try{const[t,a,c,o,r,h]=await Promise.all([window.api.listWorlds(n),window.api.listCharacters(n),window.api.listOutlines(n),window.api.listTimeline(n),window.api.listForeshadowings(n),window.api.listWorldRules(n)]),s=[];return t.length&&s.push(`【世界观】${t.map(e=>`${e.name}：${(e.content||"").slice(0,120)}`).join(`
`).slice(0,1e4)}`),a.length&&s.push(`【人物】${a.map(e=>`${e.name}（${e.role}）：${(e.personality||e.background||"").slice(0,100)}`).join(`
`).slice(0,6e3)}`),c.length&&s.push(`【大纲】${c.map(e=>`${e.title}：${(e.content||"").slice(0,100)}`).join(`
`).slice(0,6e3)}`),o.length&&s.push(`【故事年表】${o.map(e=>`${e.story_time||"?"} ${e.title}`).join("；").slice(0,2e3)}`),r.length&&s.push(`【伏笔状态】${r.map(e=>`${e.title}(${e.status})`).join("、").slice(0,2e3)}`),h.length&&s.push(`【真实与幻想规则】${h.map(e=>`${e.era}/${e.type==="史实"?"◈ 史实":"◇ 架空"}：${e.item}${e.content?" - "+e.content.slice(0,80):""}`).join(`
`).slice(0,5e3)}`),s.join(`

`)}catch{return""}}}function T({ask:n,askPrompt:i}){return async t=>{const a=await A(t,i);a&&await n(a.prompt,a.system,{withCtx:a.withCtx!==!1})}}export{w as A,q as T,N as b,T as u};
