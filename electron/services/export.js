const { use, sanitize, readTextFile } = require('./common')
const { createNovel, getNovel } = require('./novels')
const { createChapter } = require('./chapters')
const { createOutline } = require('./outlines')
const { createCharacter } = require('./characters')
const { createWorld } = require('./worlds')
const { createMaterial } = require('./materials')
const { createForeshadowing } = require('./foreshadowings')
const { createTimelineEvent } = require('./timeline')
const { createItem } = require('./items')
const { createPrompt } = require('./prompts')

function materialBatchImport(novelId, files) {
  const d = use()
  let count = 0
  for (const { name, content } of files) {
    if (!content) continue
    d.prepare('INSERT INTO materials (novel_id, title, type, content, source) VALUES (?, ?, ?, ?, ?)').run(
      novelId,
      name,
      '文件导入',
      content,
      ''
    )
    count++
  }
  return { count }
}
async function exportDocx(novelId, chapterIds = null) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx')
  const d = use()
  const novel = d.prepare('SELECT * FROM novels WHERE id=?').get(novelId)
  if (!novel) throw new Error('项目不存在')
  let chapters
  if (chapterIds && chapterIds.length) {
    const placeholders = chapterIds.map(() => '?').join(',')
    chapters = d
      .prepare(`SELECT * FROM chapters WHERE novel_id=? AND id IN (${placeholders}) ORDER BY order_index`)
      .all(novelId, ...chapterIds)
  } else {
    chapters = d.prepare('SELECT * FROM chapters WHERE novel_id=? ORDER BY order_index').all(novelId)
  }
  const children = []
  children.push(
    new Paragraph({
      text: novel.name,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  )
  for (const ch of chapters) {
    children.push(
      new Paragraph({
        text: ch.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    )
    const paragraphs = (ch.content || '').split(/\n{2,}/)
    for (const p of paragraphs) {
      const trimmed = p.trim()
      if (!trimmed) continue
      if (/^#{1,6}\s/.test(trimmed)) {
        const level = trimmed.match(/^#+/)[0].length
        const text = trimmed.replace(/^#+\s*/, '')
        children.push(
          new Paragraph({
            text,
            heading: level <= 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
            spacing: { before: 200, after: 100 },
          })
        )
      } else {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: trimmed })],
            spacing: { after: 100 },
            indent: { firstLine: 480 },
          })
        )
      }
    }
  }
  const doc = new Document({ sections: [{ children }] })
  return Packer.toBuffer(doc)
}
function exportNovel(novelId, dir, format = 'md') {
  const fs = require('fs')
  const path = require('path')
  const d = use()
  const novel = d.prepare('SELECT * FROM novels WHERE id=?').get(novelId)
  if (!novel) throw new Error('项目不存在')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const base = path.join(dir, sanitize(novel.name))
  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true })
  const chapDir = path.join(base, 'chapters')
  if (!fs.existsSync(chapDir)) fs.mkdirSync(chapDir, { recursive: true })
  const chapters = d.prepare('SELECT * FROM chapters WHERE novel_id=? ORDER BY order_index').all(novelId)
  for (const ch of chapters) {
    const ext = format === 'txt' ? '.txt' : '.md'
    const file = path.join(chapDir, `${String(ch.order_index).padStart(3, '0')}-${sanitize(ch.title)}${ext}`)
    const text = format === 'txt' ? ch.content || '' : `# ${ch.title}\n\n${ch.content || ''}`
    fs.writeFileSync(file, text, 'utf8')
  }
  const payload = {
    format: 'novel-studio-export',
    version: 1,
    exported_at: new Date().toISOString(),
    novel: { name: novel.name, description: novel.description, genre: novel.genre },
    chapters: chapters.map(({ title, content, order_index, status, summary }) => ({
      title,
      content,
      order_index,
      status,
      summary,
    })),
    outlines: d.prepare('SELECT * FROM outlines WHERE novel_id=?').all(novelId),
    characters: d.prepare('SELECT * FROM characters WHERE novel_id=?').all(novelId),
    worlds: d.prepare('SELECT * FROM worlds WHERE novel_id=?').all(novelId),
    materials: d.prepare('SELECT * FROM materials WHERE novel_id=?').all(novelId),
    foreshadowings: d.prepare('SELECT * FROM foreshadowings WHERE novel_id=?').all(novelId),
    timeline: d.prepare('SELECT * FROM timeline_events WHERE novel_id=?').all(novelId),
    relations: d.prepare('SELECT * FROM relations WHERE novel_id=?').all(novelId),
    items: d.prepare('SELECT * FROM items WHERE novel_id=?').all(novelId),
    prompts: d.prepare('SELECT * FROM prompts WHERE novel_id=?').all(novelId),
  }
  fs.writeFileSync(path.join(base, 'project.json'), JSON.stringify(payload, null, 2), 'utf8')
  return { dir: base, chapters: chapters.length }
}
function importNovel(inputPath) {
  const fs = require('fs')
  const path = require('path')

  if (!fs.existsSync(inputPath)) throw new Error('路径不存在')

  // 单文件导入：直接把 txt/md 文件作为新项目的一个章节
  if (fs.statSync(inputPath).isFile()) {
    const ext = path.extname(inputPath).toLowerCase()
    if (ext !== '.txt' && ext !== '.md') throw new Error('仅支持 .txt 或 .md 文件')
    const content = readTextFile(inputPath)
    const name = path.basename(inputPath, ext)
    const novelId = createNovel({ name }).id
    let title = name
    let chContent = content
    const m = content.match(/^#\s+(.+)\n/)
    if (m) {
      title = m[1]
      chContent = content.slice(m[0].length)
    }
    createChapter(novelId, { title, content: chContent.trim() })
    return getNovel(novelId)
  }

  // 文件夹导入
  const dir = inputPath
  let payload = null
  for (const c of [
    path.join(dir, 'project.json'),
    ...fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => path.join(dir, f)),
  ]) {
    try {
      const data = JSON.parse(fs.readFileSync(c, 'utf8'))
      if (data.format === 'novel-studio-export') {
        payload = data
        break
      }
    } catch (e) {
      /* skip */
    }
  }
  let novelId
  if (payload) {
    novelId = createNovel(payload.novel).id
    for (const ch of payload.chapters || []) {
      createChapter(novelId, { title: ch.title, content: ch.content || '' })
    }
    for (const o of payload.outlines || []) createOutline(novelId, { title: o.title, content: o.content, type: o.type })
    for (const c of payload.characters || []) createCharacter(novelId, c)
    for (const w of payload.worlds || []) createWorld(novelId, w)
    for (const m of payload.materials || []) createMaterial(novelId, m)
    for (const f of payload.foreshadowings || []) createForeshadowing(novelId, f)
    for (const t of payload.timeline || []) createTimelineEvent(novelId, t)
    for (const i of payload.items || []) createItem(novelId, i)
    for (const p of payload.prompts || []) if (p.novel_id) createPrompt(novelId, p)
  } else {
    const name = path.basename(dir)
    novelId = createNovel({ name }).id
    const dir2 = fs.existsSync(path.join(dir, 'chapters')) ? path.join(dir, 'chapters') : dir
    const extRe = /\.(md|txt)$/i
    for (const f of fs
      .readdirSync(dir2)
      .filter((x) => extRe.test(x))
      .sort()) {
      let text = readTextFile(path.join(dir2, f))
      let title = f.replace(extRe, '').replace(/^\d{3}-/, '')
      const m = text.match(/^#\s+(.+)\n/)
      if (m) {
        title = m[1]
        text = text.replace(/^#\s+.+\n+/, '')
      }
      createChapter(novelId, { title, content: text.trim() })
    }
  }
  return getNovel(novelId)
}
function backupNovel(novelId, dir) {
  const fs = require('fs')
  const path = require('path')
  const novel = use().prepare('SELECT * FROM novels WHERE id=?').get(novelId)
  if (!novel) throw new Error('项目不存在')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backDir = path.join(dir, `${sanitize(novel.name)}-${ts}`)
  const result = exportNovel(novelId, backDir)
  return { dir: backDir, ...result }
}
function autoBackupAll(dir) {
  const fs = require('fs')
  const path = require('path')
  const { listNovels } = require('./novels')
  const novels = listNovels()
  if (!novels.length) return { count: 0 }
  if (!dir) return { count: 0, error: '未设置备份目录' }

  // 确保备份目录存在
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  let count = 0
  for (const n of novels) {
    try {
      backupNovel(n.id, dir)
      count++
    } catch (e) {
      /* skip */
    }
  }

  // 备份轮转：每个项目最多保留最近 30 个备份
  try {
    const maxBackups = 30
    const entries = fs.readdirSync(dir)
    const novelGroups = {}

    for (const entry of entries) {
      try {
        const fullPath = path.join(dir, entry)
        const stat = fs.statSync(fullPath)
        if (!stat.isDirectory()) continue
        const match = entry.match(/^(.+)-\d{4}-\d{2}-\d{2}T/)
        if (match) {
          const novelName = match[1]
          if (!novelGroups[novelName]) novelGroups[novelName] = []
          novelGroups[novelName].push({ name: entry, path: fullPath, time: stat.mtime })
        }
      } catch (e) {
        /* skip entries that may have been deleted */
      }
    }

    for (const [, backups] of Object.entries(novelGroups)) {
      if (backups.length <= maxBackups) continue
      // 按时间排序，删除旧备份
      backups.sort((a, b) => a.time - b.time)
      const toDelete = backups.slice(0, backups.length - maxBackups)
      for (const old of toDelete) {
        try {
          fs.rmSync(old.path, { recursive: true, force: true })
        } catch (e) {
          /* skip */
        }
      }
    }
  } catch (e) {
    /* skip rotation errors */
  }

  return { count }
}

module.exports = { materialBatchImport, exportDocx, exportNovel, importNovel, backupNovel, autoBackupAll }
