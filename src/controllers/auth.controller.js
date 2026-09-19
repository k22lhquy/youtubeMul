const jwt = require("jsonwebtoken");
const { randomUUID } = require("node:crypto");
const { jwtSecret } = require("../config/env");
const db = require("../config/database");

async function createGuestToken(req, res) {
  const name = String(req.body?.name || "").trim().slice(0, 32);
  if (!name) return res.status(400).json({ error: "Tên hiển thị là bắt buộc." });
  try {
    const id = randomUUID();
    await db.query("INSERT INTO users (id, name) VALUES ($1, $2)", [id, name]);
    res.json({ token: jwt.sign({ sub: id, name }, jwtSecret, { expiresIn: "24h" }), user: { id, name } });
  } catch (error) {
    console.error(error);
    res.status(503).json({ error: "Database chưa sẵn sàng." });
  }
}

module.exports = { createGuestToken };
