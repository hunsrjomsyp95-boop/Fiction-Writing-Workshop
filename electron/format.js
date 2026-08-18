function formatText(text) {
  let out = text

  // 1. normalize line endings
  out = out.replace(/\r\n/g, '\n')

  // 2. remove trailing whitespace on each line
  out = out.replace(/[ \t]+$/gm, '')

  // 3. collapse 3+ consecutive blank lines into 2
  out = out.replace(/\n{3,}/g, '\n\n')

  // 4. ensure file ends with exactly one newline
  out = out.replace(/\n*$/, '\n')

  // 5. convert full-width ASCII to half-width (except in Chinese punctuation that should stay full-width)
  out = out.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))

  // 6. fix mixed Chinese/English spacing: add space between Chinese and English/numbers
  out = out.replace(/([\u4e00-\u9fff])([A-Za-z0-9@#$%&])/g, '$1 $2')
  out = out.replace(/([A-Za-z0-9@#$%&])([\u4e00-\u9fff])/g, '$1 $2')

  // 7. remove spaces before Chinese punctuation
  out = out.replace(/ +([，。、；：？！）】」』》"]+)/g, '$1')

  // 8. add space after Chinese punctuation if followed by non-Chinese
  out = out.replace(/([，。、；：？！）】」』》"])([A-Za-z0-9])/g, '$1 $2')

  const changes = countChanges(text, out)
  return { text: out, changes }
}

function countChanges(original, formatted) {
  const Diff = require('diff')
  const diff = Diff.diffChars(original, formatted)
  let changes = 0
  for (const part of diff) {
    if (part.added || part.removed) {
      changes++
    }
  }
  return changes
}

module.exports = { formatText }
