import{c as l,g as p}from"./index-DjbDwKqL.js";import{U as u}from"./user-CTv4QXe6.js";/**
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
 */const j=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],M=l("shield-check",j),N=[{key:"advice",label:"给出建议",icon:f},{key:"plot",label:"后续剧情",icon:w},{key:"character",label:"人物设计",icon:u},{key:"naming",label:"起名",icon:p},{key:"style",label:"文笔仿写",icon:k},{key:"beats",label:"情感节拍",icon:_},{key:"translate",label:"翻译",icon:m},{key:"consistency",label:"角色一致性",icon:M}];async function x(n,i){switch(n){case"advice":return{prompt:"请作为资深小说编辑分析以下文本，给出具体可执行的改进建议：亮点、问题、节奏、描写、对话、爽点与结构优化。",system:"你是资深小说编辑，善于给出建设性、可落地的修改意见。"};case"plot":return{prompt:"请基于当前文本设计后续剧情：给出 3-5 条具体的后续发展方案，每条包含剧情走向、冲突升级、章节钩子。",system:"你是小说剧情架构师，擅长设计扣人心弦、逻辑自洽的后续情节。"};case"character":{const t=await i({title:"人物设计",label:"人物要求（可留空，AI 会根据正文分析）",placeholder:"如：主角的宿敌，剑术高超，性格偏执"});return t===null?null:{prompt:`请设计/完善一个小说人物：${t||"基于当前文本中已有的人物线索"}`,system:"你是角色设计师，生成有辨识度、有矛盾、有成长弧光的人物档案：姓名、定位、外貌、性格、动机、背景、能力、缺陷、弧光、在故事中的用途。"}}case"naming":{const t=await i({title:"起名",label:"起名类型与要求",placeholder:"如：仙侠主角名，意境清冷 / 神秘地点名 / 神兵利器名"});return t===null?null:{prompt:`请根据「${t}」起名：给出 10 个候选名，每个配一句含义说明与适用场景。`,system:"你是起名专家，擅长人物名、道具名、地点名、势力名、书名的创作，名字要有辨识度、好记、贴合风格。",withCtx:!1}}case"style":{const t=await i({title:"文笔仿写",label:"粘贴要学习的文风样本",placeholder:"粘贴一段你喜欢的文字风格..."});return t===null||!t.trim()?null:{prompt:`【文风样本】
${t}

请先分析这段样本的文风要点，然后用该文风仿写当前的正文内容。`,system:"你是文风分析仿写专家：先提炼样本的句式、用词、描写、语气、节奏特点，再严格模仿该风格进行改写/仿写。"}}case"beats":return{prompt:"请为当前章节设计情感节拍规划：开头悬念/铺垫、中段升级/冲突推进、情绪顶点、结尾钩子/状态卡。给出本章的情感曲线、爽点安排、转折点与读者心理预期。",system:"你是情感节奏设计师，擅长章节级情绪曲线与节拍设计，输出可直接执行的章节大纲。"};case"translate":{const t=await i({title:"翻译",label:"目标语言",value:"英语",placeholder:"英语 / 日语 / 韩语 / 法语 / 西班牙语..."});return t===null||!t.trim()?null:{prompt:`请把以下内容翻译成${t}。要求：1. 保留原作的文风、语气与节奏；2. 人名、地名、专有名词保留拼音或音译并保持全文一致；3. 译文要自然流畅、有文学性，避免机器翻译腔；4. 直接输出译文，不要解释。

【待翻译文本】
`,system:"你是资深文学翻译家，擅长小说文体的多语种翻译，注重文风还原与专有名词的一致性。"}}case"consistency":return{prompt:"请检查当前章节中各角色的表现是否与之前一致。重点关注：1. 性格特征是否前后矛盾；2. 说话方式/语气是否突变；3. 人物关系描述是否与设定冲突；4. 外貌/能力描写是否有出入；5. 行为动机是否合理。逐条列出发现的问题，如果没发现问题请说明角色表现一致。",system:"你是角色一致性审查专家。你会仔细比对当前章节中角色的表现与项目设定中的人物档案（性格、外貌、背景、关系等），找出所有不一致的地方。输出格式：角色名 → 问题描述 → 出处 → 建议修改。"};default:return null}}async function A(n){try{return await window.api.aiGetContext(n)||""}catch{try{const[t,a,c,o,r,h]=await Promise.all([window.api.listWorlds(n),window.api.listCharacters(n),window.api.listOutlines(n),window.api.listTimeline(n),window.api.listForeshadowings(n),window.api.listWorldRules(n)]),s=[];return t.length&&s.push(`【世界观】${t.map(e=>`${e.name}：${(e.content||"").slice(0,120)}`).join(`
`).slice(0,1e4)}`),a.length&&s.push(`【人物】${a.map(e=>`${e.name}（${e.role}）：${(e.personality||e.background||"").slice(0,100)}`).join(`
`).slice(0,6e3)}`),c.length&&s.push(`【大纲】${c.map(e=>`${e.title}：${(e.content||"").slice(0,100)}`).join(`
`).slice(0,6e3)}`),o.length&&s.push(`【故事年表】${o.map(e=>`${e.story_time||"?"} ${e.title}`).join("；").slice(0,2e3)}`),r.length&&s.push(`【伏笔状态】${r.map(e=>`${e.title}(${e.status})`).join("、").slice(0,2e3)}`),h.length&&s.push(`【真实与幻想规则】${h.map(e=>`${e.era}/${e.type==="史实"?"◈ 史实":"◇ 架空"}：${e.item}${e.content?" - "+e.content.slice(0,80):""}`).join(`
`).slice(0,5e3)}`),s.join(`

`)}catch{return""}}}function T({ask:n,askPrompt:i}){return async t=>{const a=await x(t,i);a&&await n(a.prompt,a.system,{withCtx:a.withCtx!==!1})}}export{w as A,N as T,A as b,T as u};
