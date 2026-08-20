const { use, readTextFile } = require('./common')
const fs = require('fs')
const path = require('path')

function ensureTable() {
  const d = use()
  d.exec(`CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    display_name TEXT,
    description TEXT,
    version TEXT,
    author TEXT,
    tags TEXT,
    folder_path TEXT NOT NULL UNIQUE,
    content TEXT,
    active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)
}

function listSkills() {
  ensureTable()
  return use().prepare('SELECT * FROM skills ORDER BY created_at DESC').all()
}

function getSkill(id) {
  return use().prepare('SELECT * FROM skills WHERE id = ?').get(id)
}

function importSkill(folderPath) {
  ensureTable()
  const d = use()
  
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    throw new Error('无效的skill文件夹路径')
  }

  const manifestPath = path.join(folderPath, 'manifest.json')
  let manifest = {}
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(readTextFile(manifestPath))
    } catch {}
  }

  const skillMdPath = path.join(folderPath, 'SKILL.md')
  let skillContent = ''
  if (fs.existsSync(skillMdPath)) {
    skillContent = readTextFile(skillMdPath)
  }

  const mdFiles = {}
  const entries = fs.readdirSync(folderPath, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isFile() && /\.md$/i.test(entry.name) && entry.name !== 'SKILL.md') {
      const filePath = path.join(folderPath, entry.name)
      mdFiles[entry.name] = readTextFile(filePath)
    }
  }

  const name = manifest.name || path.basename(folderPath)
  const displayName = manifest.display_name || name
  const description = manifest.description || ''
  const version = manifest.version || '1.0.0'
  const author = manifest.author || ''
  const tags = Array.isArray(manifest.tags) ? manifest.tags.join(',') : ''

  const fullContent = JSON.stringify({
    skill: skillContent,
    files: mdFiles,
    manifest
  })

  const existing = d.prepare('SELECT id FROM skills WHERE folder_path = ?').get(folderPath)
  if (existing) {
    d.prepare(`UPDATE skills SET name=?, display_name=?, description=?, version=?, author=?, tags=?, content=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
      .run(name, displayName, description, version, author, tags, fullContent, existing.id)
    return d.prepare('SELECT * FROM skills WHERE id = ?').get(existing.id)
  }

  const info = d.prepare(`INSERT INTO skills (name, display_name, description, version, author, tags, folder_path, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(name, displayName, description, version, author, tags, folderPath, fullContent)
  return d.prepare('SELECT * FROM skills WHERE id = ?').get(info.lastInsertRowid)
}

function deleteSkill(id) {
  ensureTable()
  use().prepare('DELETE FROM skills WHERE id = ?').run(id)
}

function setActiveSkill(id, active) {
  ensureTable()
  const d = use()
  d.prepare('UPDATE skills SET active = 0').run()
  if (id && active) {
    d.prepare('UPDATE skills SET active = 1 WHERE id = ?').run(id)
  }
}

function getActiveSkill() {
  ensureTable()
  return use().prepare('SELECT * FROM skills WHERE active = 1').get()
}

function getActiveSkillContext() {
  const skill = getActiveSkill()
  if (!skill) return ''
  
  try {
    const content = JSON.parse(skill.content)
    const parts = []
    
    if (content.skill) {
      parts.push(`# ${skill.display_name}\n\n${content.skill}`)
    }
    
    if (content.files) {
      for (const [filename, text] of Object.entries(content.files)) {
        const name = filename.replace(/\.md$/i, '')
        parts.push(`## ${name}\n\n${text}`)
      }
    }
    
    return parts.join('\n\n---\n\n')
  } catch {
    return ''
  }
}

module.exports = {
  listSkills,
  getSkill,
  importSkill,
  deleteSkill,
  setActiveSkill,
  getActiveSkill,
  getActiveSkillContext,
}
