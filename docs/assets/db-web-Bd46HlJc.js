import{g as R,r as I}from"./sql.js-COXJihbN.js";var U=I();const D=R(U),A="novel-studio";let e=null,i=null;async function c(){return new Promise((E,t)=>{const T=indexedDB.open(A,1);T.onerror=()=>t(T.error),T.onsuccess=()=>{const a=T.result.transaction("database","readonly").objectStore("database").get("main");a.onsuccess=()=>E(a.result||null),a.onerror=()=>t(a.error)},T.onupgradeneeded=o=>{const N=o.target.result;N.objectStoreNames.contains("database")||N.createObjectStore("database")}})}async function r(E){return new Promise((t,T)=>{const o=indexedDB.open(A,1);o.onerror=()=>T(o.error),o.onsuccess=()=>{const d=o.result.transaction("database","readwrite").objectStore("database").put(E,"main");d.onsuccess=()=>t(),d.onerror=()=>T(d.error)},o.onupgradeneeded=N=>{const n=N.target.result;n.objectStoreNames.contains("database")||n.createObjectStore("database")}})}let s=null;function L(){s&&clearTimeout(s),s=setTimeout(async()=>{if(e){const E=e.export();await r(E)}},5e3)}async function S(){try{const E=new URL(""+new URL("sql-wasm-DfANybxk.wasm",import.meta.url).href,import.meta.url).href,T=await(await fetch(E)).arrayBuffer();i=await D({wasmBinary:T});let o=null;try{o=await c()}catch(n){console.warn("从 IndexedDB 加载失败，将创建新数据库:",n)}o?e=new i.Database(o):e=new i.Database,e.run("PRAGMA foreign_keys = ON"),await l(e);const N=e.export();return await r(N),console.log("数据库初始化成功"),e}catch(E){throw console.error("数据库初始化失败:",E),E}}async function l(E){E.exec(`
    CREATE TABLE IF NOT EXISTS novels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      genre TEXT DEFAULT '',
      target_words INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
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
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chapter_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      content TEXT NOT NULL,
      change_summary TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS outlines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES outlines(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      type TEXT DEFAULT '节点',
      order_index INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
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
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS worlds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT DEFAULT '其他',
      content TEXT DEFAULT '',
      world_name TEXT DEFAULT '主世界',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
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
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
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
      created_at TEXT DEFAULT (datetime('now'))
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
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
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
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
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
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
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
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
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
      created_at TEXT DEFAULT (datetime('now'))
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
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS world_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      era TEXT DEFAULT '架空',
      item TEXT NOT NULL,
      type TEXT DEFAULT '史实',
      content TEXT DEFAULT '',
      verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      model TEXT DEFAULT '',
      tokens INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS map_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'worldmap',
      name TEXT NOT NULL DEFAULT '新视图',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS map_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      view_id INTEGER DEFAULT 0,
      name TEXT NOT NULL DEFAULT '新地点',
      icon TEXT DEFAULT 'mountain',
      color TEXT DEFAULT '#7c7cf0',
      x REAL DEFAULT 0,
      y REAL DEFAULT 0,
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS map_edges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      novel_id INTEGER NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
      view_id INTEGER DEFAULT 0,
      from_id INTEGER NOT NULL,
      to_id INTEGER NOT NULL,
      label TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `),E.exec(`
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
    CREATE INDEX IF NOT EXISTS idx_map_nodes_novel ON map_nodes(novel_id, view_id);
    CREATE INDEX IF NOT EXISTS idx_map_edges_novel ON map_edges(novel_id, view_id);
  `),F(E)}function F(E){const t=E.exec("SELECT COUNT(*) as count FROM typo_dict");t[0]&&t[0].values[0][0]===0&&E.run(`
      INSERT OR IGNORE INTO typo_dict (wrong, right, note, source) VALUES 
      ('的地得', '的地得', '的地得用法区分', '内置'),
      ('他她它', '他她它', '他她它用法区分', '内置')
    `);const T=E.exec("SELECT COUNT(*) as count FROM prompts");T[0]&&T[0].values[0][0]===0&&E.run(`
      INSERT OR IGNORE INTO prompts (name, category, system_prompt, user_prompt, builtin) VALUES 
      ('续写', '写作辅助', '你是一位专业的小说作家，擅长续写故事。请根据上下文自然地续写下去。', '{{content}}', 1),
      ('润色', '写作辅助', '你是一位文学编辑，擅长润色文字。请帮助改进以下文字，保持原意但提升表达质量。', '{{content}}', 1),
      ('校对', '写作辅助', '你是一位专业校对员，请检查以下文字中的错别字、语法错误，并给出修改建议。', '{{content}}', 1)
    `)}function X(E,t=[]){if(!e)throw new Error("数据库未初始化");const T=e.prepare(E);t.length>0&&T.bind(t);const o=[];for(;T.step();)o.push(T.getAsObject());return T.free(),L(),o}function C(E,t=[]){var N;if(!e)throw new Error("数据库未初始化");t.length>0?e.run(E,t):e.run(E);const T=((N=e.exec("SELECT last_insert_rowid()")[0])==null?void 0:N.values[0][0])||0,o=e.getRowsModified();return L(),{lastId:T,changes:o}}function O(E,t=[]){const T=X(E,t);return T.length>0?T[0]:null}function u(E,t=[]){const T=O(E,t);return T?Object.values(T)[0]:null}async function m(){if(e){const E=e.export();await r(E)}}function p(){if(!e)throw new Error("数据库未初始化");const E=e.export();return new Blob([E],{type:"application/x-sqlite3"})}async function v(E){const t=await E.arrayBuffer(),T=new Uint8Array(t);return e&&e.close(),e=new i.Database(T),e.run("PRAGMA foreign_keys = ON"),await r(T),e}export{C as execute,p as exportDatabase,O as getOne,u as getScalar,v as importDatabase,S as initDatabase,X as query,m as saveDatabase};
