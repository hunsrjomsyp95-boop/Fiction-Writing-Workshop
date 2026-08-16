import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite'

const DB_NAME = 'novel-studio'
let db = null
let sqlite = null

export async function initDatabase() {
  sqlite = new SQLiteConnection(CapacitorSQLite)
  
  // 检查是否已有数据库
  const ret = await sqlite.isDatabase(DB_NAME)
  if (ret.result) {
    db = await sqlite.retrieveConnection(DB_NAME, false)
  } else {
    db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false)
  }
  
  await db.open()
  await migrate(db)
  return db
}

export function getDb() {
  return db
}

export async function closeDatabase() {
  if (db) {
    await db.close()
    db = null
  }
  if (sqlite) {
    await sqlite.closeConnection(DB_NAME, false)
    sqlite = null
  }
}

async function migrate(d) {
  // 创建表结构
  await d.execute(`
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

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      model TEXT DEFAULT '',
      tokens INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)

  // 创建索引
  await d.execute(`
    CREATE INDEX IF NOT EXISTS idx_ai_conv_novel ON ai_conversations(novel_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_chapters_novel ON chapters(novel_id, order_index);
    CREATE INDEX IF NOT EXISTS idx_characters_novel ON characters(novel_id);
    CREATE INDEX IF NOT EXISTS idx_worlds_novel ON worlds(novel_id);
    CREATE INDEX IF NOT EXISTS idx_materials_novel ON materials(novel_id);
    CREATE INDEX IF NOT EXISTS idx_outlines_novel ON outlines(novel_id);
    CREATE INDEX IF NOT EXISTS idx_foreshadowings_novel ON foreshadowings(novel_id);
    CREATE INDEX IF NOT EXISTS idx_timeline_events_novel ON timeline_events(novel_id);
    CREATE INDEX IF NOT EXISTS idx_relations_novel ON relations(novel_id);
    CREATE INDEX IF NOT EXISTS idx_items_novel ON items(novel_id);
    CREATE INDEX IF NOT EXISTS idx_prompts_novel ON prompts(novel_id);
    CREATE INDEX IF NOT EXISTS idx_world_rules_novel ON world_rules(novel_id);
    CREATE INDEX IF NOT EXISTS idx_typo_records_novel ON typo_records(novel_id);
    CREATE INDEX IF NOT EXISTS idx_word_log_novel ON word_log(novel_id);
    CREATE INDEX IF NOT EXISTS idx_typing_stats_novel ON typing_stats(novel_id);
  `)

  // 初始化默认数据
  await seedData(d)
}

async function seedData(d) {
  // 检查是否已有错字词典数据
  const result = await d.query('SELECT COUNT(*) as count FROM typo_dict')
  if (result.values && result.values[0] && result.values[0].count === 0) {
    // 插入默认错字词典
    await d.execute(`
      INSERT OR IGNORE INTO typo_dict (wrong, right, note, source) VALUES 
      ('的地得', '的地得', '的地得用法区分', '内置'),
      ('他她它', '他她它', '他她它用法区分', '内置')
    `)
  }

  // 检查是否已有提示词数据
  const promptResult = await d.query('SELECT COUNT(*) as count FROM prompts')
  if (promptResult.values && promptResult.values[0] && promptResult.values[0].count === 0) {
    // 插入默认提示词
    await d.execute(`
      INSERT OR IGNORE INTO prompts (name, category, system_prompt, user_prompt, builtin) VALUES 
      ('续写', '写作辅助', '你是一位专业的小说作家，擅长续写故事。请根据上下文自然地续写下去。', '{{content}}', 1),
      ('润色', '写作辅助', '你是一位文学编辑，擅长润色文字。请帮助改进以下文字，保持原意但提升表达质量。', '{{content}}', 1),
      ('校对', '写作辅助', '你是一位专业校对员，请检查以下文字中的错别字、语法错误，并给出修改建议。', '{{content}}', 1)
    `)
  }
}

// 封装查询方法，简化使用
export async function query(sql, params = []) {
  if (!db) throw new Error('数据库未初始化')
  const result = await db.query(sql, params)
  return result.values || []
}

export async function execute(sql, params = []) {
  if (!db) throw new Error('数据库未初始化')
  return await db.run(sql, params)
}

export async function getOne(sql, params = []) {
  const results = await query(sql, params)
  return results.length > 0 ? results[0] : null
}

export async function getScalar(sql, params = []) {
  const result = await getOne(sql, params)
  if (!result) return null
  return Object.values(result)[0]
}