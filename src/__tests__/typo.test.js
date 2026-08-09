import { describe, it, expect } from 'vitest'
const { frequencyCheck, patternCheck, applyFix } = require('../../electron/typo')

describe('frequencyCheck', () => {
  it('returns empty array for empty text', () => {
    expect(frequencyCheck('')).toEqual([])
  })

  it('returns empty array for text with only symbols/numbers', () => {
    expect(frequencyCheck('123!@#')).toEqual([])
  })

  it('returns character frequency sorted by count descending', () => {
    const text = '的的的了了是'
    const result = frequencyCheck(text, 10)
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].ch).toBe('的')
    expect(result[0].count).toBe(3)
  })

  it('respects the top parameter', () => {
    const text = '天地玄黄宇宙洪荒日月盈昃辰宿列张'
    const result = frequencyCheck(text, 3)
    expect(result.length).toBeLessThanOrEqual(3)
  })

  it('includes rate and sample position', () => {
    const text = '你好世界你好'
    const result = frequencyCheck(text, 10)
    const entry = result.find((r) => r.ch === '你')
    expect(entry).toBeDefined()
    expect(entry.count).toBe(2)
    expect(entry.rate).toBeGreaterThan(0)
    expect(entry.rate).toBeLessThanOrEqual(1)
    expect(typeof entry.sample).toBe('number')
  })

  it('filters out whitespace, digits, and punctuation', () => {
    const text = 'abc 123 !@# 你好'
    const result = frequencyCheck(text, 10)
    const chars = result.map((r) => r.ch)
    expect(chars).not.toContain('a')
    expect(chars).not.toContain('1')
    expect(chars).not.toContain('!')
    expect(chars).toContain('你')
    expect(chars).toContain('好')
  })

  it('defaults top to 30', () => {
    const chars = '的一是不了人我在有他这中大来上个国'
    const text = chars.repeat(10)
    const result = frequencyCheck(text)
    expect(result.length).toBeLessThanOrEqual(30)
  })
})

describe('patternCheck', () => {
  it('returns empty array for clean text', () => {
    expect(patternCheck('这是一段没有问题的文本')).toEqual([])
  })

  it('detects "做为" which should be "作为"', () => {
    const result = patternCheck('他做为一名学生')
    expect(result.length).toBe(1)
    expect(result[0].wrong).toBe('做为')
    expect(result[0].right).toBe('作为')
    expect(result[0].kind).toBe('pattern')
  })

  it('detects multiple occurrences of the same pattern', () => {
    const result = patternCheck('做为老师，做为朋友')
    expect(result.length).toBe(2)
    expect(result[0].start).not.toBe(result[1].start)
  })

  it('detects "必需" which should be "必须"', () => {
    const result = patternCheck('你必需完成')
    expect(result.length).toBe(1)
    expect(result[0].wrong).toBe('必需')
    expect(result[0].right).toBe('必须')
  })

  it('returns correct positions', () => {
    const result = patternCheck('他做为一名学生')
    expect(result[0].start).toBe(1)
    expect(result[0].end).toBe(3)
  })

  it('sets source to "启发式"', () => {
    const result = patternCheck('他做为学生')
    expect(result[0].source).toBe('启发式')
  })

  it('handles empty text', () => {
    expect(patternCheck('')).toEqual([])
  })
})

describe('applyFix', () => {
  it('applies a single fix correctly', () => {
    const text = '他做为一名学生'
    const issues = [
      { wrong: '做为', right: '作为', start: 1, end: 3 },
    ]
    const result = applyFix(text, issues)
    expect(result.text).toBe('他作为一名学生')
    expect(result.count).toBe(1)
  })

  it('applies multiple fixes in reverse order', () => {
    const text = '做为老师，做为朋友'
    const issues = [
      { wrong: '做为', right: '作为', start: 0, end: 2 },
      { wrong: '做为', right: '作为', start: 5, end: 7 },
    ]
    const result = applyFix(text, issues)
    expect(result.text).toBe('作为老师，作为朋友')
    expect(result.count).toBe(2)
  })

  it('skips issues where wrong text does not match at position', () => {
    const text = '他作为一名学生'
    const issues = [
      { wrong: '做为', right: '作为', start: 1, end: 3 },
    ]
    const result = applyFix(text, issues)
    expect(result.text).toBe('他作为一名学生')
    expect(result.count).toBe(0)
  })

  it('skips issues with invalid positions', () => {
    const text = 'test'
    const issues = [
      { wrong: 'x', right: 'y', start: -1, end: 1 },
      { wrong: 'x', right: 'y', start: 0, end: 100 },
      { wrong: 'x', right: 'y', start: 3, end: 2 },
    ]
    const result = applyFix(text, issues)
    expect(result.text).toBe('test')
    expect(result.count).toBe(0)
  })

  it('filters out issues without wrong or right', () => {
    const text = 'hello'
    const issues = [
      { wrong: '', right: 'x', start: 0, end: 0 },
      { wrong: 'h', right: '', start: 0, end: 1 },
    ]
    const result = applyFix(text, issues)
    expect(result.count).toBe(0)
  })

  it('returns count of applied fixes', () => {
    const text = '做为做为'
    const issues = [
      { wrong: '做为', right: '作为', start: 0, end: 2 },
      { wrong: '做为', right: '作为', start: 2, end: 4 },
    ]
    const result = applyFix(text, issues)
    expect(result.count).toBe(2)
  })

  it('handles empty text', () => {
    const result = applyFix('', [])
    expect(result.text).toBe('')
    expect(result.count).toBe(0)
  })
})
