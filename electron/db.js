const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')
const { seedPrompts, seedTypoDict } = require('./seed')

let db = null
let dbFilePath = null

function getDataDir() {
  const base = path.join(process.env.APPDATA || path.join(process.env.HOME, '.novel-studio'), 'novel-studio')
  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true })
  return base
}

function checkIntegrity(database) {
  try {
    const result = database.pragma('integrity_check')
    return result.length === 1 && result[0].integrity_check === 'ok'
  } catch (e) {
    return false
  }
}

/**
 * 修复损坏的SQLite数据库
 * 
 * 当数据库完整性检查失败时调用此函数。执行以下步骤：
 * 1. 尝试打开损坏的数据库，获取表结构信息
 * 2. 备份损坏的数据库文件（包括WAL和SHM文件）
 * 3. 删除损坏的原始文件
 * 4. 返回备份文件路径，以便后续恢复
 * 
 * @param {string} filePath - 数据库文件路径
 * @returns {Object} 包含success状态和backup路径或error信息
 */
function repairDatabase(filePath) {
  const corruptFile = filePath + '.corrupt.' + Date.now()
  const walFile = filePath + '-wal'
  const shmFile = filePath + '-shm'

  try {
    // 备份损坏的数据库文件（包括WAL和SHM日志文件）
    fs.copyFileSync(filePath, corruptFile)
    if (fs.existsSync(walFile)) fs.copyFileSync(walFile, corruptFile + '-wal')
    if (fs.existsSync(shmFile)) fs.copyFileSync(shmFile, corruptFile + '-shm')

    // 删除损坏的原始文件
    fs.unlinkSync(filePath)
    if (fs.existsSync(walFile)) fs.unlinkSync(walFile)
    if (fs.existsSync(shmFile)) fs.unlinkSync(shmFile)

    return { success: true, backup: corruptFile }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

function openDatabase(filePath) {
  if (db) return db

  // 检查数据库文件是否存在
  if (fs.existsSync(filePath)) {
    // 检查完整性
    try {
      const testDb = new Database(filePath, { readonly: true })
      const isOk = checkIntegrity(testDb)
      testDb.close()

      if (!isOk) {
        const repairResult = repairDatabase(filePath)
        if (repairResult.success) {
          // 数据库已备份到: repairResult.backup
        }
      }
    } catch (e) {
      console.error('数据库检查失败:', e.message)
    }
  }

  try {
    db = new Database(filePath)
    dbFilePath = filePath
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')

    // 启用 busy timeout，避免锁定问题
    db.pragma('busy_timeout = 5000')

    migrate(db)
    return db
  } catch (e) {
    console.error('打开数据库失败:', e.message)
    throw e
  }
}

function init() {
  const dbFile = path.join(getDataDir(), 'novel-studio.db')
  return openDatabase(dbFile)
}

function dbPath() {
  if (dbFilePath) return dbFilePath
  return path.join(getDataDir(), 'novel-studio.db')
}

function replaceDb(newPath) {
  if (db) {
    db.close()
    db = null
  }
  db = new Database(newPath)
  dbFilePath = newPath
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  migrate(db)
  return db
}

/**
 * 数据库迁移函数
 * 
 * 创建所有必要的表和索引，执行数据库迁移。
 * 包含以下功能：
 * 1. 创建所有业务表（小说、章节、人物、世界观等）
 * 2. 创建FTS5全文索引用于章节内容搜索
 * 3. 创建触发器保持FTS索引同步
 * 4. 执行老库迁移，补齐新增列
 * 5. 初始化默认数据（错字词典、提示词等）
 * 
 * @param {Object} d - 数据库连接实例
 */
function migrate(d) {
  d.exec(`
  CREATE TABLE IF NOT EXISTS novels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    genre TEXT DEFAULT '',
    target_words INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    order_index INTEGER NOT NULL DEFAULT 0,
    status TEXT DEFAULT '草稿',
    summary TEXT DEFAULT '',
    scene TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    word_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS chapter_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    change_summary TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS outlines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES outlines(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    type TEXT DEFAULT '节点',
    order_index INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    alias TEXT DEFAULT '',
    role TEXT DEFAULT '配角',
    gender TEXT DEFAULT '',
    age TEXT DEFAULT '',
    appearance TEXT DEFAULT '',
    personality TEXT DEFAULT '',
    background TEXT DEFAULT '',
    relationships TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    order_index INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS worlds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT '其他',
    content TEXT DEFAULT '',
    world_name TEXT DEFAULT '主世界',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT DEFAULT '未分类',
    content TEXT DEFAULT '',
    source TEXT DEFAULT '',
    tags TEXT DEFAULT '',
    ai_classified INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS typo_dict (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wrong TEXT NOT NULL UNIQUE,
    right TEXT NOT NULL,
    note TEXT DEFAULT '',
    source TEXT DEFAULT '内置'
  );

  CREATE TABLE IF NOT EXISTS typo_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER REFERENCES novels(id) ON DELETE CASCADE,
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
    wrong TEXT NOT NULL,
    right TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    fixed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS foreshadowings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT DEFAULT '普通',
    status TEXT DEFAULT '计划',
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
    setup_desc TEXT DEFAULT '',
    call_desc TEXT DEFAULT '',
    resolve_desc TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS timeline_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    story_time TEXT DEFAULT '',
    description TEXT DEFAULT '',
    location TEXT DEFAULT '',
    chapter_id INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
    status TEXT DEFAULT '进行中',
    order_index INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS relations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    char_a_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    char_b_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    type TEXT DEFAULT '认识',
    label TEXT DEFAULT '',
    direction TEXT DEFAULT '双向',
    description TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT '物品',
    description TEXT DEFAULT '',
    owner_id INTEGER REFERENCES characters(id) ON DELETE SET NULL,
    location TEXT DEFAULT '',
    importance TEXT DEFAULT '普通',
    tags TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS prompts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER REFERENCES novels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT '通用',
    system_prompt TEXT DEFAULT '',
    user_prompt TEXT DEFAULT '',
    params TEXT DEFAULT '[]',
    builtin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS word_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    words INTEGER DEFAULT 0,
    UNIQUE(novel_id, day)
  );

  CREATE TABLE IF NOT EXISTS ai_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day TEXT NOT NULL,
    model TEXT DEFAULT '',
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS typing_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    hour TEXT NOT NULL,
    words INTEGER DEFAULT 0,
    UNIQUE(novel_id, day, hour)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS world_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    era TEXT DEFAULT '架空',
    item TEXT NOT NULL,
    type TEXT DEFAULT '史实',
    content TEXT DEFAULT '',
    verified INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS map_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    view_id INTEGER DEFAULT 0,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'mountain',
    color TEXT DEFAULT '#7c7cf0',
    x REAL DEFAULT 0,
    y REAL DEFAULT 0,
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS map_edges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    view_id INTEGER DEFAULT 0,
    from_id INTEGER NOT NULL REFERENCES map_nodes(id) ON DELETE CASCADE,
    to_id INTEGER NOT NULL REFERENCES map_nodes(id) ON DELETE CASCADE,
    label TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS map_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'worldmap',
    name TEXT NOT NULL DEFAULT '默认视图',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS ai_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    model TEXT DEFAULT '',
    tokens INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_ai_conv_novel ON ai_conversations(novel_id, created_at);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
  `)
  // FTS5 全文索引 — 章节内容
  d.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS chapters_fts USING fts5(title, content, content='chapters', content_rowid='id', tokenize='unicode61');
  `)
  // 每次启动重建索引，确保与 chapters 表同步
  d.exec(`INSERT INTO chapters_fts(chapters_fts) VALUES('rebuild')`)
  // 同步触发器
  d.exec(`
    CREATE TRIGGER IF NOT EXISTS chapters_ai AFTER INSERT ON chapters BEGIN
      INSERT INTO chapters_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
    END;
    CREATE TRIGGER IF NOT EXISTS chapters_ad AFTER DELETE ON chapters BEGIN
      INSERT INTO chapters_fts(chapters_fts, rowid, title, content) VALUES('delete', old.id, old.title, old.content);
    END;
    CREATE TRIGGER IF NOT EXISTS chapters_au AFTER UPDATE ON chapters BEGIN
      INSERT INTO chapters_fts(chapters_fts, rowid, title, content) VALUES('delete', old.id, old.title, old.content);
      INSERT INTO chapters_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
    END;
  `)
  // 老库迁移：补齐新增列
  const ensureCol = (table, col, ddl) => {
    try {
      const cs = d.pragma(`table_info(${table})`)
      if (!cs.some((c) => c.name === col)) d.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${ddl}`)
    } catch (e) {
      /* ignore */
    }
  }
  ensureCol('timeline_events', 'order_index', 'INTEGER DEFAULT 0')
  ensureCol('prompts', 'params', "TEXT DEFAULT '[]'")
  ensureCol('novels', 'target_words', 'INTEGER DEFAULT 0')
  ensureCol('worlds', 'world_name', "TEXT DEFAULT '主世界'")
  ensureCol('chapters', 'scene', "TEXT DEFAULT ''")
  ensureCol('chapters', 'notes', "TEXT DEFAULT ''")
  ensureCol('chapter_versions', 'tag', "TEXT DEFAULT ''")
  ensureCol('characters', 'order_index', 'INTEGER DEFAULT 0')
  ensureCol('characters', 'icon', "TEXT DEFAULT ''")
  ensureCol('map_nodes', 'view_id', 'INTEGER DEFAULT 0')
  ensureCol('map_edges', 'view_id', 'INTEGER DEFAULT 0')
  ensureCol('relations', 'type_b', "TEXT DEFAULT ''")
  ensureCol('characters', 'graph_x', 'REAL DEFAULT 0')
  ensureCol('characters', 'graph_y', 'REAL DEFAULT 0')
  seedTypoDict(d)
  seedPrompts(d)
}

module.exports = {
  init,
  db: () => db,
  dbPath,
  replaceDb,
  checkIntegrity: () => (db ? checkIntegrity(db) : false),
  getDataDir,
}
