import { describe, it, expect } from 'vitest'
const { formatSearchResults } = require('../../electron/search')

describe('formatSearchResults', () => {
  it('returns "未找到相关结果" when results are null', () => {
    const result = formatSearchResults(null)
    expect(result).toContain('未找到相关结果')
  })

  it('returns "未找到相关结果" when results are empty', () => {
    const result = formatSearchResults([])
    expect(result).toContain('未找到相关结果')
  })

  it('formats a single search result', () => {
    const results = [
      { title: '测试标题', link: 'https://example.com', snippet: '这是摘要' },
    ]
    const output = formatSearchResults(results)
    expect(output).toContain('联网搜索结果')
    expect(output).toContain('1. 测试标题')
    expect(output).toContain('链接：https://example.com')
    expect(output).toContain('摘要：这是摘要')
  })

  it('formats multiple search results with numbering', () => {
    const results = [
      { title: '结果一', link: 'https://a.com', snippet: '摘要一' },
      { title: '结果二', link: 'https://b.com', snippet: '摘要二' },
      { title: '结果三', link: 'https://c.com', snippet: '摘要三' },
    ]
    const output = formatSearchResults(results)
    expect(output).toContain('1. 结果一')
    expect(output).toContain('2. 结果二')
    expect(output).toContain('3. 结果三')
  })

  it('handles results with empty fields', () => {
    const results = [{ title: '', link: '', snippet: '' }]
    const output = formatSearchResults(results)
    expect(output).toContain('1. ')
    expect(output).toContain('链接：')
    expect(output).toContain('摘要：')
  })

  it('handles undefined results', () => {
    const result = formatSearchResults(undefined)
    expect(result).toContain('未找到相关结果')
  })
})
