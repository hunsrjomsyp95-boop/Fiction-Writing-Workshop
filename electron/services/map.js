const { use } = require('./common')

// 视图 CRUD
function listViews(novelId, type) {
  return use().prepare('SELECT * FROM map_views WHERE novel_id=? AND type=? ORDER BY id').all(novelId, type)
}

function createView(novelId, type, name = '新视图') {
  const d = use()
  const info = d.prepare('INSERT INTO map_views (novel_id, type, name) VALUES (?, ?, ?)').run(novelId, type, name)
  const viewId = info.lastInsertRowid
  
  // 将 view_id=0 的旧数据迁移到新视图
  if (type === 'worldmap') {
    d.prepare('UPDATE map_nodes SET view_id=? WHERE novel_id=? AND view_id=0').run(viewId, novelId)
    d.prepare('UPDATE map_edges SET view_id=? WHERE novel_id=? AND view_id=0').run(viewId, novelId)
  }
  
  return d.prepare('SELECT * FROM map_views WHERE id=?').get(viewId)
}

function updateView(id, patch) {
  const d = use()
  if (patch.name !== undefined) {
    d.prepare('UPDATE map_views SET name=? WHERE id=?').run(patch.name, id)
  }
  return d.prepare('SELECT * FROM map_views WHERE id=?').get(id)
}

function deleteView(id) {
  const d = use()
  d.prepare('DELETE FROM map_nodes WHERE view_id=?').run(id)
  d.prepare('DELETE FROM map_edges WHERE view_id=?').run(id)
  d.prepare('DELETE FROM map_views WHERE id=?').run(id)
  return true
}

// 节点 CRUD
function listNodes(novelId, viewId = 0) {
  return use().prepare('SELECT * FROM map_nodes WHERE novel_id=? AND view_id=? ORDER BY id').all(novelId, viewId)
}

function createNode(novelId, patch = {}) {
  const d = use()
  const viewId = patch.view_id || 0
  const info = d
    .prepare('INSERT INTO map_nodes (novel_id, view_id, name, icon, color, x, y, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(novelId, viewId, patch.name || '新地点', patch.icon || 'mountain', patch.color || '#7c7cf0', patch.x || 0, patch.y || 0, patch.note || '')
  return d.prepare('SELECT * FROM map_nodes WHERE id=?').get(info.lastInsertRowid)
}

function updateNode(id, patch) {
  const d = use()
  const cols = ['name', 'icon', 'color', 'x', 'y', 'note']
  const sets = []
  const vals = []
  for (const c of cols) {
    if (patch[c] !== undefined) {
      sets.push(`${c}=?`)
      vals.push(patch[c])
    }
  }
  if (sets.length === 0) return d.prepare('SELECT * FROM map_nodes WHERE id=?').get(id)
  d.prepare(`UPDATE map_nodes SET ${sets.join(',')}, updated_at=datetime('now','localtime') WHERE id=?`).run(...vals, id)
  return d.prepare('SELECT * FROM map_nodes WHERE id=?').get(id)
}

function deleteNode(id) {
  use().prepare('DELETE FROM map_nodes WHERE id=?').run(id)
  return true
}

// 边 CRUD
function listEdges(novelId, viewId = 0) {
  return use().prepare('SELECT * FROM map_edges WHERE novel_id=? AND view_id=?').all(novelId, viewId)
}

function createEdge(novelId, fromId, toId, label = '', viewId = 0) {
  const d = use()
  const info = d.prepare('INSERT INTO map_edges (novel_id, view_id, from_id, to_id, label) VALUES (?, ?, ?, ?, ?)').run(novelId, viewId, fromId, toId, label)
  return d.prepare('SELECT * FROM map_edges WHERE id=?').get(info.lastInsertRowid)
}

function deleteEdge(id) {
  use().prepare('DELETE FROM map_edges WHERE id=?').run(id)
  return true
}

function deleteEdgesByNode(nodeId) {
  use().prepare('DELETE FROM map_edges WHERE from_id=? OR to_id=?').run(nodeId, nodeId)
  return true
}

module.exports = { listViews, createView, updateView, deleteView, listNodes, createNode, updateNode, deleteNode, listEdges, createEdge, deleteEdge, deleteEdgesByNode }
