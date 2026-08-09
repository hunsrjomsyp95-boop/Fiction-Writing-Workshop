import { describe, it, expect } from 'vitest'
const { extractTitle, extractText } = require('../../electron/crawl')

describe('extractTitle', () => {
  it('extracts title from a standard HTML page', () => {
    const html = '<html><head><title>我的小说</title></head><body></body></html>'
    expect(extractTitle(html)).toBe('我的小说')
  })

  it('trims whitespace from title', () => {
    const html = '<html><head><title>  有空格  </title></head></html>'
    expect(extractTitle(html)).toBe('有空格')
  })

  it('returns "无标题" when no title tag exists', () => {
    const html = '<html><head></head><body></body></html>'
    expect(extractTitle(html)).toBe('无标题')
  })

  it('handles title with attributes', () => {
    const html = '<html><head><title class="main">标题</title></head></html>'
    expect(extractTitle(html)).toBe('标题')
  })

  it('handles case-insensitive title tag', () => {
    const html = '<html><head><TITLE>大写标题</TITLE></head></html>'
    expect(extractTitle(html)).toBe('大写标题')
  })
})

describe('extractText', () => {
  it('strips HTML tags and returns plain text', () => {
    const html = '<p>Hello <b>World</b></p>'
    expect(extractText(html)).toBe('Hello World')
  })

  it('removes script tags and their content', () => {
    const html = '<p>visible</p><script>alert("hidden")</script><p>also visible</p>'
    expect(extractText(html)).toBe('visible also visible')
  })

  it('removes style tags and their content', () => {
    const html = '<p>text</p><style>body { color: red; }</style><p>more</p>'
    expect(extractText(html)).toBe('text more')
  })

  it('removes nav, header, and footer tags', () => {
    const html = '<nav>导航</nav><header>页头</header><main>正文内容</main><footer>页脚</footer>'
    expect(extractText(html)).toBe('正文内容')
  })

  it('prefers article content over main content', () => {
    const html = '<div>outside</div><article>article content</article><main>main content</main>'
    expect(extractText(html)).toBe('article content')
  })

  it('falls back to main content when no article', () => {
    const html = '<div>outside</div><main>main content</main>'
    expect(extractText(html)).toBe('main content')
  })

  it('uses full page when no article or main', () => {
    const html = '<div><p>hello world</p></div>'
    expect(extractText(html)).toBe('hello world')
  })

  it('replaces HTML entities', () => {
    const html = '<p>&amp; &lt; &gt; &quot; &#x27; &#39; &nbsp;</p>'
    const result = extractText(html)
    expect(result).toContain('&')
    expect(result).toContain('<')
    expect(result).toContain('>')
    expect(result).toContain('"')
    expect(result).toContain("'")
  })

  it('collapses multiple whitespace into one', () => {
    const html = '<p>hello   \n\t  world</p>'
    expect(extractText(html)).toBe('hello world')
  })

  it('trims leading and trailing whitespace', () => {
    const html = '  <p>hello</p>  '
    expect(extractText(html)).toBe('hello')
  })

  it('handles empty HTML', () => {
    expect(extractText('')).toBe('')
  })

  it('truncates output to 100000 characters', () => {
    const longText = 'x'.repeat(200000)
    const html = `<p>${longText}</p>`
    expect(extractText(html).length).toBeLessThanOrEqual(100000)
  })

  it('handles nested tags properly', () => {
    const html = '<div><p><span><b>deeply nested</b></span></p></div>'
    expect(extractText(html)).toBe('deeply nested')
  })
})
