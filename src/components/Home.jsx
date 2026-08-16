import { useState, useEffect } from 'react'
import { BookOpen } from 'lucide-react'
import { useDialog } from '../Dialog.jsx'

/**
 * 首页组件
 * 
 * 应用的主页面，提供以下功能：
 * - 小说列表：显示所有小说，支持搜索和排序
 * - 新建小说：创建新小说项目
 * - 数据管理：导入、导出、备份、恢复
 * - 设置入口：访问应用设置
 * - 用户认证：登录、注销（如果启用）
 * - 统计概览：显示写作统计信息
 * 
 * @param {Function} onOpen - 打开小说的回调函数
 * @param {Function} toast - 消息提示函数
 */
export default function Home({ onOpen, toast }) {
  const { confirm } = useDialog()
  const [novels, setNovels] = useState(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', genre: '', description: '' })

  const load = async () => setNovels(await window.api.listNovels())

  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    if (!form.name.trim()) {
      toast('请填写小说名称', 'error')
      return
    }
    const novel = await window.api.createNovel(form)
    setCreating(false)
    setForm({ name: '', genre: '', description: '' })
    toast('项目创建成功', 'success')
    onOpen(novel)
  }

  const del = async (id) => {
    if (
      !(await confirm({
        title: '删除项目',
        message: '确定删除该项目？章节、大纲、资料等将一并删除，且不可恢复。',
        danger: true,
      }))
    )
      return
    await window.api.deleteNovel(id)
    toast('已删除', 'success')
    load()
  }

  return (
    <div
      className='home-container'
      style={{
        height: '100%',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 24px',
      }}
    >
      <div style={{ maxWidth: 900, width: '100%' }}>
        <div className='row' style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>小说创作工坊</h1>
          <div className='grow' />
          <button className='primary' onClick={() => setCreating(true)}>
            + 新建小说
          </button>
        </div>

        {novels === null ? (
          <div className='loading' style={{ padding: 40 }}>
            加载中..
          </div>
        ) : novels.length === 0 && !creating ? (
          <div className='empty-state panel' style={{ padding: '48px 24px' }}>
            <div style={{ fontSize: 36, opacity: 0.5 }}>
              <BookOpen size={36} />
            </div>
            <div style={{ fontSize: 13 }}>还没有创作项目，点击「新建小说」开始你的第一个故事。</div>
          </div>
        ) : (
          <div className='home-grid' style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {novels.map((n) => (
              <div className='card home-card' key={n.id} onClick={() => onOpen(n)}>
                <div className='row' style={{ marginBottom: 6 }}>
                  <div className='name grow' style={{ fontSize: 14 }}>
                    {n.name}
                  </div>
                  <button
                    className='ghost small danger'
                    onClick={(e) => {
                      e.stopPropagation()
                      del(n.id)
                    }}
                    title='删除'
                  >
                    删除
                  </button>
                </div>
                {n.genre && (
                  <span className='badge accent' style={{ marginBottom: 4 }}>
                    {n.genre}
                  </span>
                )}
                <div className='meta' style={{ lineHeight: 1.5 }}>
                  {n.description || '暂无简介'}
                </div>
                <div className='meta' style={{ marginTop: 4, fontSize: 10, color: 'var(--text-faint)' }}>
                  {n.updated_at}
                </div>
              </div>
            ))}
          </div>
        )}

        {creating && (
          <div className='modal-mask'>
            <div className='modal' onClick={(e) => e.stopPropagation()}>
              <div className='modal-head'>新建小说项目</div>
              <div className='modal-body'>
                <div className='form-field'>
                  <label>小说名称 *</label>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && create()}
                    placeholder='例如：《星海拾荒者》'
                  />
                </div>
                <div className='form-field'>
                  <label>类型/题材</label>
                  <input
                    value={form.genre}
                    onChange={(e) => setForm({ ...form, genre: e.target.value })}
                    placeholder='科幻 / 玄幻 / 都市 / 悬疑...'
                  />
                </div>
                <div className='form-field'>
                  <label>简介</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder='一句话简介或创作说明...'
                  />
                </div>
              </div>
              <div className='modal-foot'>
                <button onClick={() => setCreating(false)}>取消</button>
                <button className='primary' onClick={create}>
                  创建
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 32, fontSize: 11, color: 'var(--text-faint)', opacity: 0.6 }}>
          v1.2.6 · 免费创作工具
        </div>
      </div>
    </div>
  )
}
