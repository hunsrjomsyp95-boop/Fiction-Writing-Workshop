import { useState } from 'react'
import { FileText, PenTool, Bot, Users, Settings } from 'lucide-react'

const STEPS = [
  {
    title: '欢迎使用 小说创作工坊',
    body: '一款本地运行的小说写作工具：章节创作、双向链接（[[名称]] 跳转）、错字校对、敏感词自动检测、版本对比（并排 diff）、伏笔管理、世界观设定、资料库自动分类、导出PDF/MD/TXT、写作统计图表、AI 续写/润色/校对/严格编辑/夸夸骨灰粉。首次使用请先点击右上角「设置」填写 AI 配置。',
    icon: FileText,
  },
  {
    title: '写作时',
    body: '「章节」页：顶部按钮可保存（同时生成版本快照）、增强阅读模式（舒适排版+上下章导航）、查找（Ctrl+F）；第二行可填写章节状态、场景、摘要、笔记。右侧面板「AI 助手」支持光标感知续写（自动携带前文摘要）、润色/扩写/概括、🔍严格编辑、🌟夸夸骨灰粉。「校对」面板可本地扫描或 AI 审校。「敏感词」面板自动匹配高亮。「暂存」面板可快速记录灵感片段并插入正文。',
    icon: PenTool,
  },
  {
    title: 'AI 思考',
    body: '独立导航「AI 思考」：选择要分析的章节，一键获得「给出建议/后续剧情/人物设计/起名/文笔仿写/情感节拍」。「提示词库」内置 20+ 专业模板，含各流派大纲包（玄幻仙侠/言情/悬疑/历史/都市），支持参数化表单与自定义。勾选「附加项目设定」后 AI 会结合整个项目创作。',
    icon: Bot,
  },
  {
    title: '设定与资料',
    body: '「大纲」多层树形；「人物」含角色卡、关系网（力导向可视化）、出场章节追踪；「世界观」分多世界设定、物品地点、AI 世界地图、创作规则（史实锚点 vs 架空改造）、AI 分析分类与词条拆分；「伏笔」「年表」管理叙事结构；「资料库」自动分类可查询。编辑器中可用 [[名称]] 创建双向链接跳转。',
    icon: Users,
  },
  {
    title: '设置与数据',
    body: '「设置」集中管理：主题（护眼/岩浆红/深海蓝等 6 种+自定义+导入模板）、文字颜色、字号、AI 配置、关于信息。「数据」提供导出（MD/TXT/PDF）/文件导入/备份/自动备份与数据库恢复，统计页面支持 7/30/90 天写作图表。「快捷键」可自定义全局按键（Ctrl+1~9 切导航）。',
    icon: Settings,
  },
]

export default function Onboarding({ onClose }) {
  const [step, setStep] = useState(0)
  const cur = STEPS[step]

  return (
    <div className='modal-mask'>
      <div className='modal' style={{ width: 620 }}>
        <div className='modal-head'>
          <cur.icon size={18} /> 功能速览
          <div className='spacer' />
          <span className='hint'>
            {step + 1} / {STEPS.length}
          </span>
        </div>
        <div className='modal-body'>
          <h2 style={{ fontSize: 20, marginBottom: 8 }}>{cur.title}</h2>
          <p style={{ lineHeight: 2, color: 'var(--text-dim)' }}>{cur.body}</p>
        </div>
        <div className='modal-foot'>
          <button className='ghost' onClick={onClose}>
            跳过
          </button>
          <div className='grow' />
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            上一步
          </button>
          {step < STEPS.length - 1 ? (
            <button className='primary' onClick={() => setStep((s) => s + 1)}>
              下一段
            </button>
          ) : (
            <button className='primary' onClick={onClose}>
              开始创作
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
