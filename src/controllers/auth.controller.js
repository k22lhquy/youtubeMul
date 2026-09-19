const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

function createGuestToken(req, res) {
  const name = String(req.body?.name || "").trim().slice(0, 32);
  if (!name) return res.status(400).json({ error: "Tên hiển thị là bắt buộc." });
  res.json({ token: jwt.sign({ name }, jwtSecret, { expiresIn: "24h" }), name });
}

module.exports = { createGuestToken };
