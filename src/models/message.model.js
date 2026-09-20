const db = require("../config/database");

const shape = (row) => ({ id: String(row.id), name: row.name, content: row.content, createdAt: row.created_at });

async function list(roomCode) {
  const { rows } = await db.query("SELECT id, name, content, created_at FROM messages WHERE room_code = $1 ORDER BY created_at DESC LIMIT 50", [roomCode]);
  return rows.reverse().map(shape);
}

async function create(roomCode, user, content) {
  const { rows } = await db.query("INSERT INTO messages (room_code, user_id, name, content) VALUES ($1, $2, $3, $4) RETURNING id, name, content, created_at", [roomCode, user.sub, user.name, content]);
  return shape(rows[0]);
}

module.exports = { list, create };
