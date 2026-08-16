import { query, execute, getOne, getScalar } from './db-web'

// 小说相关服务
export async function listNovels() {
  return await query('SELECT * FROM novels ORDER BY updated_at DESC')
}

export async function getNovel(id) {
  return await getOne('SELECT * FROM novels WHERE id = ?', [id])
}

export async function createNovel(params) {
  const { name, description = '', genre = '', target_words = 0 } = params
  const result = await execute(
    'INSERT INTO novels (name, description, genre, target_words) VALUES (?, ?, ?, ?)',
    [name, description, genre, target_words]
  )
  return await getNovel(result.lastId)
}

export async function updateNovel(id, params) {
  const { name, description, genre, target_words } = params
  const fields = []
  const values = []
  
  if (name !== undefined) { fields.push('name = ?'); values.push(name) }
  if (description !== undefined) { fields.push('description = ?'); values.push(description) }
  if (genre !== undefined) { fields.push('genre = ?'); values.push(genre) }
  if (target_words !== undefined) { fields.push('target_words = ?'); values.push(target_words) }
  
  fields.push("updated_at = datetime('now','localtime')")
  values.push(id)
  
  await execute(`UPDATE novels SET ${fields.join(', ')} WHERE id = ?`, values)
  return await getNovel(id)
}

export async function deleteNovel(id) {
  await execute('DELETE FROM novels WHERE id = ?', [id])
}

// 章节相关服务
export async function listChapters(novelId) {
  return await query(
    'SELECT * FROM chapters WHERE novel_id = ? ORDER BY order_index',
    [novelId]
  )
}

export async function getChapter(id) {
  return await getOne('SELECT * FROM chapters WHERE id = ?', [id])
}

export async function createChapter(novelId, params) {
  const { title, content = '', order_index = 0, status = '草稿', summary = '', scene = '', notes = '' } = params
  const word_count = content.length
  
  const result = await execute(
    `INSERT INTO chapters (novel_id, title, content, order_index, status, summary, scene, notes, word_count) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [novelId, title, content, order_index, status, summary, scene, notes, word_count]
  )
  
  return await getChapter(result.lastId)
}

export async function updateChapter(id, params) {
  const { title, content, order_index, status, summary, scene, notes } = params
  const fields = []
  const values = []
  
  if (title !== undefined) { fields.push('title = ?'); values.push(title) }
  if (content !== undefined) { 
    fields.push('content = ?'); values.push(content)
    fields.push('word_count = ?'); values.push(content.length)
  }
  if (order_index !== undefined) { fields.push('order_index = ?'); values.push(order_index) }
  if (status !== undefined) { fields.push('status = ?'); values.push(status) }
  if (summary !== undefined) { fields.push('summary = ?'); values.push(summary) }
  if (scene !== undefined) { fields.push('scene = ?'); values.push(scene) }
  if (notes !== undefined) { fields.push('notes = ?'); values.push(notes) }
  
  fields.push("updated_at = datetime('now','localtime')")
  values.push(id)
  
  await execute(`UPDATE chapters SET ${fields.join(', ')} WHERE id = ?`, values)
  return await getChapter(id)
}

export async function deleteChapter(id) {
  await execute('DELETE FROM chapters WHERE id = ?', [id])
}

export async function batchDeleteChapters(ids) {
  if (!ids || ids.length === 0) return
  const placeholders = ids.map(() => '?').join(',')
  await execute(`DELETE FROM chapters WHERE id IN (${placeholders})`, ids)
}

export async function batchUpdateChapters(ids, patch) {
  if (!ids || ids.length === 0) return
  const fields = []
  const values = []
  
  Object.entries(patch).forEach(([key, value]) => {
    fields.push(`${key} = ?`)
    values.push(value)
  })
  
  fields.push("updated_at = datetime('now','localtime')")
  
  const placeholders = ids.map(() => '?').join(',')
  await execute(
    `UPDATE chapters SET ${fields.join(', ')} WHERE id IN (${placeholders})`,
    [...values, ...ids]
  )
}

export async function reorderChapters(novelId, ids) {
  for (let i = 0; i < ids.length; i++) {
    await execute(
      'UPDATE chapters SET order_index = ? WHERE id = ? AND novel_id = ?',
      [i, ids[i], novelId]
    )
  }
}

// 版本相关服务
export async function listVersions(chapterId) {
  return await query(
    'SELECT * FROM chapter_versions WHERE chapter_id = ? ORDER BY version DESC',
    [chapterId]
  )
}

export async function saveVersion(chapterId, content, summary = '') {
  const maxVersion = await getScalar(
    'SELECT MAX(version) FROM chapter_versions WHERE chapter_id = ?',
    [chapterId]
  )
  const newVersion = (maxVersion || 0) + 1
  
  await execute(
    'INSERT INTO chapter_versions (chapter_id, version, content, change_summary) VALUES (?, ?, ?, ?)',
    [chapterId, newVersion, content, summary]
  )
  
  return { version: newVersion }
}

export async function getVersionContent(id) {
  return await getOne('SELECT * FROM chapter_versions WHERE id = ?', [id])
}

export async function deleteVersions(chapterId) {
  await execute('DELETE FROM chapter_versions WHERE chapter_id = ?', [chapterId])
}

export async function setVersionTag(id, tag) {
  await execute('UPDATE chapter_versions SET change_summary = ? WHERE id = ?', [tag, id])
}

// 大纲相关服务
export async function listOutlines(novelId) {
  return await query(
    'SELECT * FROM outlines WHERE novel_id = ? ORDER BY order_index',
    [novelId]
  )
}

export async function createOutline(novelId, params) {
  const { title, content = '', type = '节点', parent_id = null, order_index = 0 } = params
  
  const result = await execute(
    'INSERT INTO outlines (novel_id, parent_id, title, content, type, order_index) VALUES (?, ?, ?, ?, ?, ?)',
    [novelId, parent_id, title, content, type, order_index]
  )
  
  return await getOne('SELECT * FROM outlines WHERE id = ?', [result.lastId])
}

export async function updateOutline(id, params) {
  const { title, content, type, parent_id, order_index } = params
  const fields = []
  const values = []
  
  if (title !== undefined) { fields.push('title = ?'); values.push(title) }
  if (content !== undefined) { fields.push('content = ?'); values.push(content) }
  if (type !== undefined) { fields.push('type = ?'); values.push(type) }
  if (parent_id !== undefined) { fields.push('parent_id = ?'); values.push(parent_id) }
  if (order_index !== undefined) { fields.push('order_index = ?'); values.push(order_index) }
  
  fields.push("updated_at = datetime('now','localtime')")
  values.push(id)
  
  await execute(`UPDATE outlines SET ${fields.join(', ')} WHERE id = ?`, values)
  return await getOne('SELECT * FROM outlines WHERE id = ?', [id])
}

export async function deleteOutline(id) {
  await execute('DELETE FROM outlines WHERE id = ?', [id])
}

// 人物相关服务
export async function listCharacters(novelId) {
  return await query(
    'SELECT * FROM characters WHERE novel_id = ? ORDER BY id',
    [novelId]
  )
}

export async function createCharacter(novelId, params) {
  const { name, alias = '', role = '配角', gender = '', age = '', appearance = '', personality = '', background = '', relationships = '', notes = '' } = params
  
  const result = await execute(
    `INSERT INTO characters (novel_id, name, alias, role, gender, age, appearance, personality, background, relationships, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [novelId, name, alias, role, gender, age, appearance, personality, background, relationships, notes]
  )
  
  return await getOne('SELECT * FROM characters WHERE id = ?', [result.lastId])
}

export async function updateCharacter(id, params) {
  const { name, alias, role, gender, age, appearance, personality, background, relationships, notes } = params
  const fields = []
  const values = []
  
  if (name !== undefined) { fields.push('name = ?'); values.push(name) }
  if (alias !== undefined) { fields.push('alias = ?'); values.push(alias) }
  if (role !== undefined) { fields.push('role = ?'); values.push(role) }
  if (gender !== undefined) { fields.push('gender = ?'); values.push(gender) }
  if (age !== undefined) { fields.push('age = ?'); values.push(age) }
  if (appearance !== undefined) { fields.push('appearance = ?'); values.push(appearance) }
  if (personality !== undefined) { fields.push('personality = ?'); values.push(personality) }
  if (background !== undefined) { fields.push('background = ?'); values.push(background) }
  if (relationships !== undefined) { fields.push('relationships = ?'); values.push(relationships) }
  if (notes !== undefined) { fields.push('notes = ?'); values.push(notes) }
  
  fields.push("updated_at = datetime('now','localtime')")
  values.push(id)
  
  await execute(`UPDATE characters SET ${fields.join(', ')} WHERE id = ?`, values)
  return await getOne('SELECT * FROM characters WHERE id = ?', [id])
}

export async function deleteCharacter(id) {
  await execute('DELETE FROM characters WHERE id = ?', [id])
}

export async function updateCharactersOrder(ids) {
  for (let i = 0; i < ids.length; i++) {
    await execute('UPDATE characters SET id = ? WHERE id = ?', [ids[i], ids[i]])
  }
}

// 世界观相关服务
export async function listWorlds(novelId, worldName = null) {
  if (worldName) {
    return await query(
      'SELECT * FROM worlds WHERE novel_id = ? AND world_name = ? ORDER BY id',
      [novelId, worldName]
    )
  }
  return await query('SELECT * FROM worlds WHERE novel_id = ? ORDER BY id', [novelId])
}

export async function listWorldNames(novelId) {
  const results = await query(
    'SELECT DISTINCT world_name FROM worlds WHERE novel_id = ? ORDER BY world_name',
    [novelId]
  )
  return results.map(r => r.world_name)
}

export async function createWorld(novelId, params) {
  const { name, category = '其他', content = '', world_name = '主世界' } = params
  
  const result = await execute(
    'INSERT INTO worlds (novel_id, name, category, content, world_name) VALUES (?, ?, ?, ?, ?)',
    [novelId, name, category, content, world_name]
  )
  
  return await getOne('SELECT * FROM worlds WHERE id = ?', [result.lastId])
}

export async function updateWorld(id, params) {
  const { name, category, content, world_name } = params
  const fields = []
  const values = []
  
  if (name !== undefined) { fields.push('name = ?'); values.push(name) }
  if (category !== undefined) { fields.push('category = ?'); values.push(category) }
  if (content !== undefined) { fields.push('content = ?'); values.push(content) }
  if (world_name !== undefined) { fields.push('world_name = ?'); values.push(world_name) }
  
  fields.push("updated_at = datetime('now','localtime')")
  values.push(id)
  
  await execute(`UPDATE worlds SET ${fields.join(', ')} WHERE id = ?`, values)
  return await getOne('SELECT * FROM worlds WHERE id = ?', [id])
}

export async function deleteWorld(id) {
  await execute('DELETE FROM worlds WHERE id = ?', [id])
}

// 资料库相关服务
export async function listMaterials(novelId, type = null) {
  if (type) {
    return await query(
      'SELECT * FROM materials WHERE novel_id = ? AND type = ? ORDER BY id',
      [novelId, type]
    )
  }
  return await query('SELECT * FROM materials WHERE novel_id = ? ORDER BY id', [novelId])
}

export async function queryMaterials(novelId, keyword, type = null) {
  if (type) {
    return await query(
      'SELECT * FROM materials WHERE novel_id = ? AND type = ? AND (title LIKE ? OR content LIKE ?) ORDER BY id',
      [novelId, type, `%${keyword}%`, `%${keyword}%`]
    )
  }
  return await query(
    'SELECT * FROM materials WHERE novel_id = ? AND (title LIKE ? OR content LIKE ?) ORDER BY id',
    [novelId, `%${keyword}%`, `%${keyword}%`]
  )
}

export async function getMaterialById(id) {
  return await getOne('SELECT * FROM materials WHERE id = ?', [id])
}

export async function getMaterialTypes(novelId) {
  const results = await query(
    'SELECT DISTINCT type FROM materials WHERE novel_id = ? ORDER BY type',
    [novelId]
  )
  return results.map(r => r.type)
}

export async function createMaterial(novelId, params) {
  const { title, type = '未分类', content = '', source = '', tags = '', ai_classified = 0 } = params
  
  const result = await execute(
    'INSERT INTO materials (novel_id, title, type, content, source, tags, ai_classified) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [novelId, title, type, content, source, tags, ai_classified]
  )
  
  return await getOne('SELECT * FROM materials WHERE id = ?', [result.lastId])
}

export async function updateMaterial(id, params) {
  const { title, type, content, source, tags, ai_classified } = params
  const fields = []
  const values = []
  
  if (title !== undefined) { fields.push('title = ?'); values.push(title) }
  if (type !== undefined) { fields.push('type = ?'); values.push(type) }
  if (content !== undefined) { fields.push('content = ?'); values.push(content) }
  if (source !== undefined) { fields.push('source = ?'); values.push(source) }
  if (tags !== undefined) { fields.push('tags = ?'); values.push(tags) }
  if (ai_classified !== undefined) { fields.push('ai_classified = ?'); values.push(ai_classified) }
  
  fields.push("updated_at = datetime('now','localtime')")
  values.push(id)
  
  await execute(`UPDATE materials SET ${fields.join(', ')} WHERE id = ?`, values)
  return await getOne('SELECT * FROM materials WHERE id = ?', [id])
}

export async function deleteMaterial(id) {
  await execute('DELETE FROM materials WHERE id = ?', [id])
}

// 设置相关服务
export async function getSetting(key, defaultValue = null) {
  const result = await getOne('SELECT value FROM settings WHERE key = ?', [key])
  if (!result) return defaultValue
  
  try {
    return JSON.parse(result.value)
  } catch {
    return result.value
  }
}

export async function setSetting(key, value) {
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
  await execute(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, stringValue]
  )
}

// 错字相关服务
export async function listTypoDict() {
  return await query('SELECT * FROM typo_dict ORDER BY id')
}

export async function addTypo(params) {
  const { wrong, right, note = '', source = '自定义' } = params
  
  const result = await execute(
    'INSERT INTO typo_dict (wrong, right, note, source) VALUES (?, ?, ?, ?)',
    [wrong, right, note, source]
  )
  
  return await getOne('SELECT * FROM typo_dict WHERE id = ?', [result.lastId])
}

export async function updateTypo(id, params) {
  const { wrong, right, note, source } = params
  const fields = []
  const values = []
  
  if (wrong !== undefined) { fields.push('wrong = ?'); values.push(wrong) }
  if (right !== undefined) { fields.push('right = ?'); values.push(right) }
  if (note !== undefined) { fields.push('note = ?'); values.push(note) }
  if (source !== undefined) { fields.push('source = ?'); values.push(source) }
  
  values.push(id)
  
  await execute(`UPDATE typo_dict SET ${fields.join(', ')} WHERE id = ?`, values)
  return await getOne('SELECT * FROM typo_dict WHERE id = ?', [id])
}

export async function deleteTypo(id) {
  await execute('DELETE FROM typo_dict WHERE id = ?', [id])
}

export async function getTypoRecords(novelId, chapterId = null) {
  if (chapterId) {
    return await query(
      'SELECT * FROM typo_records WHERE novel_id = ? AND chapter_id = ? ORDER BY id',
      [novelId, chapterId]
    )
  }
  return await query(
    'SELECT * FROM typo_records WHERE novel_id = ? ORDER BY id',
    [novelId]
  )
}

export async function clearTypoRecords(novelId, chapterId = null) {
  if (chapterId) {
    await execute('DELETE FROM typo_records WHERE novel_id = ? AND chapter_id = ?', [novelId, chapterId])
  } else {
    await execute('DELETE FROM typo_records WHERE novel_id = ?', [novelId])
  }
}

// 伏笔相关服务
export async function listForeshadowings(novelId, status = null) {
  if (status) {
    return await query(
      'SELECT * FROM foreshadowings WHERE novel_id = ? AND status = ? ORDER BY id',
      [novelId, status]
    )
  }
  return await query('SELECT * FROM foreshadowings WHERE novel_id = ? ORDER BY id', [novelId])
}

export async function createForeshadowing(novelId, params) {
  const { title, type = '普通', status = '计划', chapter_id = null, setup_desc = '', call_desc = '', resolve_desc = '' } = params
  
  const result = await execute(
    'INSERT INTO foreshadowings (novel_id, title, type, status, chapter_id, setup_desc, call_desc, resolve_desc) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [novelId, title, type, status, chapter_id, setup_desc, call_desc, resolve_desc]
  )
  
  return await getOne('SELECT * FROM foreshadowings WHERE id = ?', [result.lastId])
}

export async function updateForeshadowing(id, params) {
  const { title, type, status, chapter_id, setup_desc, call_desc, resolve_desc } = params
  const fields = []
  const values = []
  
  if (title !== undefined) { fields.push('title = ?'); values.push(title) }
  if (type !== undefined) { fields.push('type = ?'); values.push(type) }
  if (status !== undefined) { fields.push('status = ?'); values.push(status) }
  if (chapter_id !== undefined) { fields.push('chapter_id = ?'); values.push(chapter_id) }
  if (setup_desc !== undefined) { fields.push('setup_desc = ?'); values.push(setup_desc) }
  if (call_desc !== undefined) { fields.push('call_desc = ?'); values.push(call_desc) }
  if (resolve_desc !== undefined) { fields.push('resolve_desc = ?'); values.push(resolve_desc) }
  
  fields.push("updated_at = datetime('now','localtime')")
  values.push(id)
  
  await execute(`UPDATE foreshadowings SET ${fields.join(', ')} WHERE id = ?`, values)
  return await getOne('SELECT * FROM foreshadowings WHERE id = ?', [id])
}

export async function deleteForeshadowing(id) {
  await execute('DELETE FROM foreshadowings WHERE id = ?', [id])
}

// 年表相关服务
export async function listTimeline(novelId) {
  return await query(
    'SELECT * FROM timeline_events WHERE novel_id = ? ORDER BY order_index',
    [novelId]
  )
}

export async function createTimelineEvent(novelId, params) {
  const { title, story_time = '', description = '', location = '', chapter_id = null, status = '进行中', order_index = 0 } = params
  
  const result = await execute(
    'INSERT INTO timeline_events (novel_id, title, story_time, description, location, chapter_id, status, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [novelId, title, story_time, description, location, chapter_id, status, order_index]
  )
  
  return await getOne('SELECT * FROM timeline_events WHERE id = ?', [result.lastId])
}

export async function updateTimelineEvent(id, params) {
  const { title, story_time, description, location, chapter_id, status, order_index } = params
  const fields = []
  const values = []
  
  if (title !== undefined) { fields.push('title = ?'); values.push(title) }
  if (story_time !== undefined) { fields.push('story_time = ?'); values.push(story_time) }
  if (description !== undefined) { fields.push('description = ?'); values.push(description) }
  if (location !== undefined) { fields.push('location = ?'); values.push(location) }
  if (chapter_id !== undefined) { fields.push('chapter_id = ?'); values.push(chapter_id) }
  if (status !== undefined) { fields.push('status = ?'); values.push(status) }
  if (order_index !== undefined) { fields.push('order_index = ?'); values.push(order_index) }
  
  fields.push("updated_at = datetime('now','localtime')")
  values.push(id)
  
  await execute(`UPDATE timeline_events SET ${fields.join(', ')} WHERE id = ?`, values)
  return await getOne('SELECT * FROM timeline_events WHERE id = ?', [id])
}

export async function deleteTimelineEvent(id) {
  await execute('DELETE FROM timeline_events WHERE id = ?', [id])
}

export async function reorderTimeline(novelId, ids) {
  for (let i = 0; i < ids.length; i++) {
    await execute(
      'UPDATE timeline_events SET order_index = ? WHERE id = ? AND novel_id = ?',
      [i, ids[i], novelId]
    )
  }
}

export async function sortTimelineByStoryTime(novelId) {
  const events = await query(
    'SELECT * FROM timeline_events WHERE novel_id = ? ORDER BY story_time',
    [novelId]
  )
  for (let i = 0; i < events.length; i++) {
    await execute(
      'UPDATE timeline_events SET order_index = ? WHERE id = ?',
      [i, events[i].id]
    )
  }
  return events
}

// 关系相关服务
export async function listRelations(novelId, charId = null) {
  if (charId) {
    return await query(
      `SELECT r.*, 
              ca.name as char_a_name, ca.alias as char_a_alias,
              cb.name as char_b_name, cb.alias as char_b_alias
       FROM relations r
       LEFT JOIN characters ca ON r.char_a_id = ca.id
       LEFT JOIN characters cb ON r.char_b_id = cb.id
       WHERE r.novel_id = ? AND (r.char_a_id = ? OR r.char_b_id = ?)
       ORDER BY r.id`,
      [novelId, charId, charId]
    )
  }
  return await query(
    `SELECT r.*, 
            ca.name as char_a_name, ca.alias as char_a_alias,
            cb.name as char_b_name, cb.alias as char_b_alias
     FROM relations r
     LEFT JOIN characters ca ON r.char_a_id = ca.id
     LEFT JOIN characters cb ON r.char_b_id = cb.id
     WHERE r.novel_id = ?
     ORDER BY r.id`,
    [novelId]
  )
}

export async function createRelation(novelId, params) {
  const { char_a_id, char_b_id, type = '认识', label = '', direction = '双向', description = '' } = params
  
  const result = await execute(
    'INSERT INTO relations (novel_id, char_a_id, char_b_id, type, label, direction, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [novelId, char_a_id, char_b_id, type, label, direction, description]
  )
  
  return await getOne('SELECT * FROM relations WHERE id = ?', [result.lastId])
}

export async function updateRelation(id, params) {
  const { char_a_id, char_b_id, type, label, direction, description } = params
  const fields = []
  const values = []
  
  if (char_a_id !== undefined) { fields.push('char_a_id = ?'); values.push(char_a_id) }
  if (char_b_id !== undefined) { fields.push('char_b_id = ?'); values.push(char_b_id) }
  if (type !== undefined) { fields.push('type = ?'); values.push(type) }
  if (label !== undefined) { fields.push('label = ?'); values.push(label) }
  if (direction !== undefined) { fields.push('direction = ?'); values.push(direction) }
  if (description !== undefined) { fields.push('description = ?'); values.push(description) }
  
  fields.push("updated_at = datetime('now','localtime')")
  values.push(id)
  
  await execute(`UPDATE relations SET ${fields.join(', ')} WHERE id = ?`, values)
  return await getOne('SELECT * FROM relations WHERE id = ?', [id])
}

export async function deleteRelation(id) {
  await execute('DELETE FROM relations WHERE id = ?', [id])
}

// 物品相关服务
export async function listItems(novelId, category = null) {
  if (category) {
    return await query(
      'SELECT * FROM items WHERE novel_id = ? AND category = ? ORDER BY id',
      [novelId, category]
    )
  }
  return await query('SELECT * FROM items WHERE novel_id = ? ORDER BY id', [novelId])
}

export async function createItem(novelId, params) {
  const { name, category = '物品', description = '', owner_id = null, location = '', importance = '普通', tags = '' } = params
  
  const result = await execute(
    'INSERT INTO items (novel_id, name, category, description, owner_id, location, importance, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [novelId, name, category, description, owner_id, location, importance, tags]
  )
  
  return await getOne('SELECT * FROM items WHERE id = ?', [result.lastId])
}

export async function updateItem(id, params) {
  const { name, category, description, owner_id, location, importance, tags } = params
  const fields = []
  const values = []
  
  if (name !== undefined) { fields.push('name = ?'); values.push(name) }
  if (category !== undefined) { fields.push('category = ?'); values.push(category) }
  if (description !== undefined) { fields.push('description = ?'); values.push(description) }
  if (owner_id !== undefined) { fields.push('owner_id = ?'); values.push(owner_id) }
  if (location !== undefined) { fields.push('location = ?'); values.push(location) }
  if (importance !== undefined) { fields.push('importance = ?'); values.push(importance) }
  if (tags !== undefined) { fields.push('tags = ?'); values.push(tags) }
  
  fields.push("updated_at = datetime('now','localtime')")
  values.push(id)
  
  await execute(`UPDATE items SET ${fields.join(', ')} WHERE id = ?`, values)
  return await getOne('SELECT * FROM items WHERE id = ?', [id])
}

export async function deleteItem(id) {
  await execute('DELETE FROM items WHERE id = ?', [id])
}

// 提示词相关服务
export async function listPrompts(novelId) {
  if (novelId) {
    return await query(
      'SELECT * FROM prompts WHERE novel_id = ? OR novel_id IS NULL ORDER BY builtin DESC, id',
      [novelId]
    )
  }
  return await query('SELECT * FROM prompts WHERE novel_id IS NULL ORDER BY builtin DESC, id')
}

export async function createPrompt(novelId, params) {
  const { name, category = '通用', system_prompt = '', user_prompt = '', params: promptParams = '[]', builtin = 0 } = params
  
  const result = await execute(
    'INSERT INTO prompts (novel_id, name, category, system_prompt, user_prompt, params, builtin) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [novelId, name, category, system_prompt, user_prompt, promptParams, builtin]
  )
  
  return await getOne('SELECT * FROM prompts WHERE id = ?', [result.lastId])
}

export async function updatePrompt(id, params) {
  const { name, category, system_prompt, user_prompt, params: promptParams, builtin } = params
  const fields = []
  const values = []
  
  if (name !== undefined) { fields.push('name = ?'); values.push(name) }
  if (category !== undefined) { fields.push('category = ?'); values.push(category) }
  if (system_prompt !== undefined) { fields.push('system_prompt = ?'); values.push(system_prompt) }
  if (user_prompt !== undefined) { fields.push('user_prompt = ?'); values.push(user_prompt) }
  if (promptParams !== undefined) { fields.push('params = ?'); values.push(promptParams) }
  if (builtin !== undefined) { fields.push('builtin = ?'); values.push(builtin) }
  
  values.push(id)
  
  await execute(`UPDATE prompts SET ${fields.join(', ')} WHERE id = ?`, values)
  return await getOne('SELECT * FROM prompts WHERE id = ?', [id])
}

export async function deletePrompt(id) {
  await execute('DELETE FROM prompts WHERE id = ?', [id])
}

// 世界规则相关服务
export async function listWorldRules(novelId, era = null) {
  if (era) {
    return await query(
      'SELECT * FROM world_rules WHERE novel_id = ? AND era = ? ORDER BY id',
      [novelId, era]
    )
  }
  return await query('SELECT * FROM world_rules WHERE novel_id = ? ORDER BY id', [novelId])
}

export async function listRuleEras(novelId) {
  const results = await query(
    'SELECT DISTINCT era FROM world_rules WHERE novel_id = ? ORDER BY era',
    [novelId]
  )
  return results.map(r => r.era)
}

export async function listCustomEras(novelId) {
  const results = await query(
    'SELECT DISTINCT era FROM world_rules WHERE novel_id = ? AND era != ? ORDER BY era',
    [novelId, '架空']
  )
  return results.map(r => r.era)
}

export async function addCustomEra(novelId, name) {
  // 只是返回名称，实际插入在创建规则时进行
  return { era: name }
}

export async function createWorldRule(novelId, params) {
  const { era = '架空', item, type = '史实', content = '', verified = 0 } = params
  
  const result = await execute(
    'INSERT INTO world_rules (novel_id, era, item, type, content, verified) VALUES (?, ?, ?, ?, ?, ?)',
    [novelId, era, item, type, content, verified]
  )
  
  return await getOne('SELECT * FROM world_rules WHERE id = ?', [result.lastId])
}

export async function updateWorldRule(id, params) {
  const { era, item, type, content, verified } = params
  const fields = []
  const values = []
  
  if (era !== undefined) { fields.push('era = ?'); values.push(era) }
  if (item !== undefined) { fields.push('item = ?'); values.push(item) }
  if (type !== undefined) { fields.push('type = ?'); values.push(type) }
  if (content !== undefined) { fields.push('content = ?'); values.push(content) }
  if (verified !== undefined) { fields.push('verified = ?'); values.push(verified) }
  
  fields.push("updated_at = datetime('now','localtime')")
  values.push(id)
  
  await execute(`UPDATE world_rules SET ${fields.join(', ')} WHERE id = ?`, values)
  return await getOne('SELECT * FROM world_rules WHERE id = ?', [id])
}

export async function deleteWorldRule(id) {
  await execute('DELETE FROM world_rules WHERE id = ?', [id])
}

// 统计相关服务
export async function getStats(novelId) {
  const novel = await getNovel(novelId)
  if (!novel) return null
  
  const chapters = await listChapters(novelId)
  const totalWords = chapters.reduce((sum, ch) => sum + (ch.word_count || 0), 0)
  const totalChapters = chapters.length
  const doneChapters = chapters.filter(ch => ch.status === '已完成').length
  
  const characters = await listCharacters(novelId)
  const characterCount = characters.length
  
  const foreshadowings = await listForeshadowings(novelId)
  const foreshadowingCount = foreshadowings.length
  
  const worlds = await listWorlds(novelId)
  const worldCount = worlds.length
  
  const materials = await listMaterials(novelId)
  const materialCount = materials.length
  
  const relations = await listRelations(novelId)
  const relationCount = relations.length
  
  const items = await listItems(novelId)
  const itemCount = items.length
  
  const timeline = await listTimeline(novelId)
  const timelineCount = timeline.length
  
  const today = new Date().toISOString().split('T')[0]
  const todayWords = await getScalar(
    'SELECT words FROM word_log WHERE novel_id = ? AND day = ?',
    [novelId, today]
  ) || 0
  
  // 获取每日字数统计
  const wordLog = await query(
    'SELECT day, words FROM word_log WHERE novel_id = ? ORDER BY day',
    [novelId]
  )
  
  // 获取章节统计
  const byChapter = chapters.map(ch => ({
    title: ch.title,
    word_count: ch.word_count,
    status: ch.status
  }))
  
  // 角色按角色类型分组
  const charactersByRole = []
  const roleMap = {}
  for (const ch of characters) {
    const role = ch.role || '未分类'
    if (!roleMap[role]) {
      roleMap[role] = { role, c: 0 }
      charactersByRole.push(roleMap[role])
    }
    roleMap[role].c++
  }
  
  // 关系按方向分组
  const relationsByDirection = []
  const dirMap = {}
  for (const r of relations) {
    const dir = r.direction || '双向'
    if (!dirMap[dir]) {
      dirMap[dir] = { direction: dir, c: 0 }
      relationsByDirection.push(dirMap[dir])
    }
    dirMap[dir].c++
  }
  
  // 关系按类型分组
  const relationsByType = []
  const typeMap = {}
  for (const r of relations) {
    const type = r.type || '认识'
    if (!typeMap[type]) {
      typeMap[type] = { type, c: 0 }
      relationsByType.push(typeMap[type])
    }
    typeMap[type].c++
  }
  
  // 世界观按世界名称分组
  const worldNames = []
  const worldMap = {}
  for (const w of worlds) {
    const name = w.world_name || '主世界'
    if (!worldMap[name]) {
      worldMap[name] = { world_name: name, c: 0 }
      worldNames.push(worldMap[name])
    }
    worldMap[name].c++
  }
  
  // 伏笔按状态分组
  const foreshadowByStatus = []
  const fsMap = {}
  for (const f of foreshadowings) {
    const status = f.status || '计划'
    if (!fsMap[status]) {
      fsMap[status] = { status, c: 0 }
      foreshadowByStatus.push(fsMap[status])
    }
    fsMap[status].c++
  }
  
  return {
    novel,
    totalWords,
    totalWords,
    totalChapters,
    chapterCount: totalChapters,  // 别名
    doneChapters,
    characters: characterCount,
    characterCount: characterCount,  // 别名
    foreshadowings: foreshadowingCount,
    foreshadowByStatus,
    worldCount,
    materialCount,
    relations: relationCount,
    items: itemCount,
    timeline: timelineCount,
    todayWords,
    wordLog,
    byChapter,
    charactersByRole,
    relationsByDirection,
    relationsByType,
    worldNames
  }
}

export async function getAiUsage() {
  // 获取总计
  const total = await getOne(
    'SELECT COALESCE(SUM(prompt_tokens), 0) AS prompt, COALESCE(SUM(completion_tokens), 0) AS completion, COUNT(*) AS calls FROM ai_usage'
  )
  
  // 按天分组
  const byDay = await query(
    'SELECT day, SUM(prompt_tokens) AS prompt, SUM(completion_tokens) AS completion, COUNT(*) AS calls FROM ai_usage GROUP BY day ORDER BY day DESC LIMIT 30'
  )
  
  // 按模型分组
  const byModel = await query(
    'SELECT model, SUM(prompt_tokens) AS prompt, SUM(completion_tokens) AS completion, COUNT(*) AS calls FROM ai_usage GROUP BY model ORDER BY calls DESC'
  )
  
  return {
    prompt: total?.prompt || 0,
    completion: total?.completion || 0,
    calls: total?.calls || 0,
    byDay,
    byModel
  }
}

export async function clearAiUsage() {
  await execute('DELETE FROM ai_usage')
}

export async function addTypingWords(novelId, words) {
  if (!novelId || !words || words <= 0) return getTypingStats(novelId)
  
  const now = new Date()
  const day = now.toISOString().slice(0, 10)
  const hour = String(now.getHours()).padStart(2, '0')
  
  await execute(
    `INSERT INTO typing_stats (novel_id, day, hour, words) VALUES (?, ?, ?, ?)
     ON CONFLICT(novel_id, day, hour) DO UPDATE SET words = words + excluded.words`,
    [novelId, day, hour, Math.round(words)]
  )
  
  // 更新 word_log
  const existing = await getOne(
    'SELECT * FROM word_log WHERE novel_id = ? AND day = ?',
    [novelId, day]
  )
  
  if (existing) {
    await execute(
      'UPDATE word_log SET words = words + ? WHERE id = ?',
      [Math.round(words), existing.id]
    )
  } else {
    await execute(
      'INSERT INTO word_log (novel_id, day, words) VALUES (?, ?, ?)',
      [novelId, day, Math.round(words)]
    )
  }
  
  return getTypingStats(novelId)
}

export async function getTypingStats(novelId) {
  const now = new Date()
  const day = now.toISOString().slice(0, 10)
  
  // 获取今日字数
  const todayResult = await getOne(
    'SELECT COALESCE(SUM(words), 0) AS s FROM typing_stats WHERE novel_id = ? AND day = ?',
    [novelId, day]
  )
  const today = todayResult ? todayResult.s : 0
  
  // 获取每小时统计
  const hourly = await query(
    'SELECT hour, SUM(words) AS words FROM typing_stats WHERE novel_id = ? AND day = ? GROUP BY hour ORDER BY hour',
    [novelId, day]
  )
  
  return { 
    today, 
    session: 0, 
    hourly: hourly.map(h => ({ hour: h.hour, words: h.words })) 
  }
}

export async function resetTypingSession() {
  // 网页版不需要重置会话
}

export async function getWritingStreak(novelId) {
  const today = new Date().toISOString().slice(0, 10)
  const logs = await query(
    'SELECT DISTINCT day FROM word_log WHERE novel_id = ? AND words > 0 ORDER BY day DESC',
    [novelId]
  )
  
  let streak = 0
  let currentDate = new Date(today)
  
  for (const log of logs) {
    const logDate = new Date(log.day)
    const diffDays = Math.floor((currentDate - logDate) / (1000 * 60 * 60 * 24))
    
    if (diffDays === streak) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }
  
  return { streak, today }
}

export async function addFocusSession(novelId, minutes) {
  // 网页版可以实现专注模式统计
}

export async function getFocusStats(novelId) {
  return { totalMinutes: 0, sessions: 0 }
}

// 认证相关服务
export async function authCheck() {
  const user = await getOne('SELECT * FROM users LIMIT 1')
  return { enabled: !!user, user: user ? { username: user.username } : null }
}

export async function registerUser(username, password) {
  // 简单的本地认证实现
  const passwordHash = await hashPassword(password)
  await execute(
    'INSERT OR REPLACE INTO users (username, password_hash) VALUES (?, ?)',
    [username, passwordHash]
  )
  await setSetting('auth_enabled', true)
  return { success: true }
}

export async function loginUser(username, password) {
  const passwordHash = await hashPassword(password)
  const user = await getOne(
    'SELECT * FROM users WHERE username = ? AND password_hash = ?',
    [username, passwordHash]
  )
  if (!user) throw new Error('用户名或密码错误')
  return { username: user.username }
}

export async function changePassword(username, oldPassword, newPassword) {
  const user = await loginUser(username, oldPassword)
  const newPasswordHash = await hashPassword(newPassword)
  await execute(
    'UPDATE users SET password_hash = ? WHERE username = ?',
    [newPasswordHash, username]
  )
  return { success: true }
}

export async function disableAuth(username, password) {
  await loginUser(username, password)
  await setSetting('auth_enabled', false)
  return { success: true }
}

async function hashPassword(password) {
  // 简单的哈希实现，生产环境应使用更安全的方式
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// 快捷键相关服务
export async function getShortcuts() {
  return await getSetting('shortcuts', {})
}

export async function setShortcuts(map) {
  await setSetting('shortcuts', map)
}

// 全文搜索相关服务
export async function fullTextSearch(novelId, keyword) {
  if (!keyword) return []
  
  const likeKeyword = `%${keyword}%`
  
  const chapters = await query(
    `SELECT id, title, content, word_count FROM chapters 
     WHERE novel_id = ? AND (title LIKE ? OR content LIKE ?)
     ORDER BY id`,
    [novelId, likeKeyword, likeKeyword]
  )
  
  return chapters.map(ch => {
    const titleMatch = ch.title.includes(keyword)
    const contentMatch = ch.content.includes(keyword)
    
    let snippet = ''
    if (contentMatch) {
      const index = ch.content.indexOf(keyword)
      const start = Math.max(0, index - 50)
      const end = Math.min(ch.content.length, index + keyword.length + 50)
      snippet = ch.content.slice(start, end)
    }
    
    return {
      ...ch,
      titleMatch,
      contentMatch,
      snippet
    }
  })
}

export async function replaceInChapters(novelId, find, replace) {
  if (!find) return { count: 0 }
  
  const chapters = await query(
    'SELECT id, content FROM chapters WHERE novel_id = ? AND content LIKE ?',
    [novelId, `%${find}%`]
  )
  
  let totalReplacements = 0
  
  for (const chapter of chapters) {
    const newContent = chapter.content.split(find).join(replace)
    const replacements = Math.floor((chapter.content.length - newContent.length) / find.length)
    
    if (replacements > 0) {
      await execute(
        "UPDATE chapters SET content = ?, word_count = ?, updated_at = datetime('now','localtime') WHERE id = ?",
        [newContent, newContent.length, chapter.id]
      )
      totalReplacements += replacements
    }
  }
  
  return { count: totalReplacements }
}

// 导出相关服务
export async function exportNovel(novelId, path = null, format = 'md') {
  const novel = await getNovel(novelId)
  const chapters = await listChapters(novelId)
  
  const files = []
  let totalWords = 0
  
  for (const ch of chapters) {
    totalWords += ch.word_count || 0
    
    if (format === 'md') {
      files.push({
        name: `${ch.title}.md`,
        content: `# ${ch.title}\n\n${ch.content}`
      })
    } else if (format === 'txt') {
      files.push({
        name: `${ch.title}.txt`,
        content: `${ch.title}\n\n${ch.content}`
      })
    }
  }
  
  return {
    novelName: novel.name,
    files,
    totalWords
  }
}

export async function importNovel(file) {
  // 网页版导入功能
  throw new Error('网页版导入功能需要通过文件选择器实现')
}

export async function backupNovel(novelId) {
  // 网页版备份功能
  throw new Error('网页版备份功能需要通过下载实现')
}

export async function autoBackupAll(dir) {
  // 网页版自动备份功能
  return { count: 0 }
}

// 格式化文本
export function formatText(text) {
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
  let changes = 0
  const maxLen = Math.min(original.length, formatted.length)
  for (let i = 0; i < maxLen; i++) {
    if (original[i] !== formatted[i]) changes++
  }
  changes += Math.abs(original.length - formatted.length)
  return changes
}

// 其他服务可以继续添加...

// 地图相关服务
export async function listMapViews(novelId, type) {
  return await query(
    'SELECT * FROM map_views WHERE novel_id = ? AND type = ? ORDER BY id',
    [novelId, type]
  )
}

export async function createMapView(novelId, type, name = '新视图') {
  const result = await execute(
    'INSERT INTO map_views (novel_id, type, name) VALUES (?, ?, ?)',
    [novelId, type, name]
  )
  
  const viewId = result.lastId
  
  // 将 view_id=0 的旧数据迁移到新视图
  if (type === 'worldmap') {
    await execute('UPDATE map_nodes SET view_id = ? WHERE novel_id = ? AND view_id = 0', [viewId, novelId])
    await execute('UPDATE map_edges SET view_id = ? WHERE novel_id = ? AND view_id = 0', [viewId, novelId])
  }
  
  return await getOne('SELECT * FROM map_views WHERE id = ?', [viewId])
}

export async function updateMapView(id, params) {
  const { name } = params
  if (name !== undefined) {
    await execute('UPDATE map_views SET name = ? WHERE id = ?', [name, id])
  }
  return await getOne('SELECT * FROM map_views WHERE id = ?', [id])
}

export async function deleteMapView(id) {
  await execute('DELETE FROM map_nodes WHERE view_id = ?', [id])
  await execute('DELETE FROM map_edges WHERE view_id = ?', [id])
  await execute('DELETE FROM map_views WHERE id = ?', [id])
  return true
}

export async function listMapNodes(novelId, viewId = 0) {
  return await query(
    'SELECT * FROM map_nodes WHERE novel_id = ? AND view_id = ? ORDER BY id',
    [novelId, viewId]
  )
}

export async function createMapNode(novelId, params = {}) {
  const viewId = params.view_id || 0
  const result = await execute(
    'INSERT INTO map_nodes (novel_id, view_id, name, icon, color, x, y, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [novelId, viewId, params.name || '新地点', params.icon || 'mountain', params.color || '#7c7cf0', params.x || 0, params.y || 0, params.note || '']
  )
  return await getOne('SELECT * FROM map_nodes WHERE id = ?', [result.lastId])
}

export async function updateMapNode(id, params) {
  const fields = []
  const values = []
  
  const cols = ['name', 'icon', 'color', 'x', 'y', 'note']
  for (const col of cols) {
    if (params[col] !== undefined) {
      fields.push(`${col} = ?`)
      values.push(params[col])
    }
  }
  
  if (fields.length === 0) {
    return await getOne('SELECT * FROM map_nodes WHERE id = ?', [id])
  }
  
  fields.push("updated_at = datetime('now','localtime')")
  values.push(id)
  
  await execute(`UPDATE map_nodes SET ${fields.join(', ')} WHERE id = ?`, values)
  return await getOne('SELECT * FROM map_nodes WHERE id = ?', [id])
}

export async function deleteMapNode(id) {
  await execute('DELETE FROM map_nodes WHERE id = ?', [id])
  return true
}

export async function listMapEdges(novelId, viewId = 0) {
  return await query(
    'SELECT * FROM map_edges WHERE novel_id = ? AND view_id = ?',
    [novelId, viewId]
  )
}

export async function createMapEdge(novelId, fromId, toId, label = '', viewId = 0) {
  const result = await execute(
    'INSERT INTO map_edges (novel_id, view_id, from_id, to_id, label) VALUES (?, ?, ?, ?, ?)',
    [novelId, viewId, fromId, toId, label]
  )
  return await getOne('SELECT * FROM map_edges WHERE id = ?', [result.lastId])
}

export async function deleteMapEdge(id) {
  await execute('DELETE FROM map_edges WHERE id = ?', [id])
  return true
}

export async function deleteEdgesByNode(nodeId) {
  await execute('DELETE FROM map_edges WHERE from_id = ? OR to_id = ?', [nodeId, nodeId])
  return true
}