import { describe, it, expect } from 'vitest'
const { formatText } = require('../../electron/format')

describe('formatText', () => {
  it('normalizes CRLF to LF', () => {
    const result = formatText('line1\r\nline2\r\nline3')
    expect(result.text).toBe('line1\nline2\nline3\n')
  })

  it('removes trailing whitespace on each line', () => {
    const result = formatText('hello   \nworld\t  \nend')
    expect(result.text).toBe('hello\nworld\nend\n')
  })

  it('collapses 3+ consecutive blank lines into 2', () => {
    const result = formatText('a\n\n\n\n\nb')
    expect(result.text).toBe('a\n\nb\n')
  })

  it('ensures file ends with exactly one newline', () => {
    expect(formatText('hello').text).toBe('hello\n')
    expect(formatText('hello\n\n').text).toBe('hello\n')
    expect(formatText('hello\n').text).toBe('hello\n')
  })

  it('converts full-width ASCII to half-width', () => {
    const result = formatText('ＡＢＣＤ１２３４')
    expect(result.text).toBe('ABCD1234\n')
  })

  it('converts full-width lowercase to half-width', () => {
    const result = formatText('ａｂｃ')
    expect(result.text).toBe('abc\n')
  })

  it('adds space between Chinese and English characters', () => {
    const result = formatText('你好world')
    expect(result.text).toBe('你好 world\n')
  })

  it('adds space between English and Chinese characters', () => {
    const result = formatText('hello你好')
    expect(result.text).toBe('hello 你好\n')
  })

  it('adds space between Chinese and numbers', () => {
    const result = formatText('共10个')
    expect(result.text).toBe('共 10 个\n')
  })

  it('does not add extra space where already present', () => {
    const result = formatText('你好 world')
    expect(result.text).toBe('你好 world\n')
  })

  it('removes spaces before Chinese punctuation', () => {
    const result = formatText('你好 ， 世界 ！')
    // regex removes spaces immediately before punctuation only
    expect(result.text).toBe('你好， 世界！\n')
  })

  it('adds space after Chinese punctuation if followed by non-Chinese', () => {
    const result = formatText('你好，world')
    expect(result.text).toBe('你好， world\n')
  })

  it('handles empty string', () => {
    const result = formatText('')
    expect(result.text).toBe('\n')
    expect(result.changes).toBe(1)
  })

  it('handles text that is already well-formatted', () => {
    const input = '这是一段格式良好的文本。\n'
    const result = formatText(input)
    expect(result.text).toBe(input)
    expect(result.changes).toBe(0)
  })

  it('returns a changes count', () => {
    const result = formatText('hello')
    expect(result).toHaveProperty('changes')
    expect(typeof result.changes).toBe('number')
  })

  it('handles combined formatting rules', () => {
    const input = '你好ＡＢＣworld　\r\n\n\n\n\n结束'
    const result = formatText(input)
    // full-width ASCII (Ａ-Ｚ) is converted; full-width space (U+3000) is not in that range
    expect(result.text).toBe('你好 ABCworld　\n\n结束\n')
  })
})
