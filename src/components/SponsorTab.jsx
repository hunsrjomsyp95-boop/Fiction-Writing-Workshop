export default function SponsorTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>☕</div>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>支持作者</h2>
      <div className='hint' style={{ marginBottom: 20, textAlign: 'center', lineHeight: 1.8 }}>
        如果这个软件对您的创作有帮助，<br />
        可以选择请我喝杯咖啡 ☕
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <img
            src={new URL('../assets/donate-wechat.jpg', import.meta.url).href}
            alt='微信赞赏码'
            style={{ width: 180, height: 180, borderRadius: 12, border: '2px solid var(--border)' }}
          />
          <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600 }}>微信</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <img
            src={new URL('../assets/donate-alipay.jpg', import.meta.url).href}
            alt='支付宝赞赏码'
            style={{ width: 180, height: 180, borderRadius: 12, border: '2px solid var(--border)' }}
          />
          <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600 }}>支付宝</div>
        </div>
      </div>
      <div className='hint' style={{ marginTop: 20, textAlign: 'center' }}>
        您的支持是我持续更新的动力 ❤️<br />
        <span style={{ fontSize: 12, opacity: 0.7 }}>开发不易，感谢支持</span>
      </div>
    </div>
  )
}
