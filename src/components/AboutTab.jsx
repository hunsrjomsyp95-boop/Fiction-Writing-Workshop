import { ChevronLeft } from 'lucide-react'

export default function AboutTab() {
  const version = import.meta.env.VITE_APP_VERSION || '1.3.6'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0' }}>
      <div style={{ marginBottom: 8 }}>
        <ChevronLeft size={40} />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>小说创作工坊</h2>
      <div className='badge accent' style={{ marginTop: 6 }}>
        版本 {version}
      </div>

      <div
        className='panel'
        style={{
          marginTop: 16,
          padding: '12px 18px',
          background: 'var(--bg-3)',
          textAlign: 'center',
          width: '100%',
          maxWidth: 360,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8 }}>最新版本下载</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
          <div>
            夸克网盘：
            <a href='https://pan.quark.cn/s/236730563604' target='_blank' rel='noreferrer'>
              https://pan.quark.cn/s/236730563604
            </a>
          </div>
          <div>
            百度网盘：
            <a href='https://pan.baidu.com/s/1H_9154mscNxu8JxmTS0URQ' target='_blank' rel='noreferrer'>
              https://pan.baidu.com/s/1H_9154mscNxu8JxmTS0URQ
            </a>
            <span className='hint'> 提取码: 1234</span>
          </div>
        </div>
      </div>

      <div className='row' style={{ marginTop: 16 }}>
        <span className='dim'>作者：</span>
        <b>哔哩哔哩耄耋教你写小说</b>
      </div>
      <div
        className='panel'
        style={{ marginTop: 14, padding: '12px 18px', background: 'var(--bg-3)', textAlign: 'center' }}
      >
        <div style={{ color: 'var(--green)', fontWeight: 600 }}>软件免费</div>
        <div className='hint' style={{ marginTop: 4 }}>
          如果是购买的那就是被骗了
        </div>
      </div>
      <div className='hint' style={{ marginTop: 16, textAlign: 'center' }}>
        本地运行的小说写作工具 · 数据保存在本机
      </div>
      <div className='hint' style={{ marginTop: 12, textAlign: 'center' }}>
        发现漏洞请联系：<a href='mailto:2982871730@qq.com'>2982871730@qq.com</a>
      </div>
    </div>
  )
}
