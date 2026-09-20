const jwt = require("jsonwebtoken");
const { randomBytes, randomUUID, scrypt, timingSafeEqual } = require("node:crypto");
const { promisify } = require("node:util");
const { jwtSecret } = require("../config/env");
const db = require("../config/database");
const scryptAsync = promisify(scrypt);

const tokenFor = (user, guest = false) => jwt.sign({ sub: user.id, name: user.name, email: user.email, guest }, jwtSecret, { expiresIn: guest ? "24h" : "7d" });
const publicUser = ({ id, name, email }) => ({ id, name, email });

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

async function passwordMatches(password, stored) {
  const [salt, hex] = String(stored || "").split(":");
  if (!salt || !hex) return false;
  const expected = Buffer.from(hex, "hex");
  const actual = await scryptAsync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function credentials(body) {
  return {
    name: String(body?.name || "").trim().slice(0, 32),
    email: String(body?.email || "").trim().toLowerCase().slice(0, 254),
    password: String(body?.password || ""),
  };
}

async function createGuestToken(req, res) {
  const name = String(req.body?.name || "").trim().slice(0, 32);
  if (!name) return res.status(400).json({ error: "Tên hiển thị là bắt buộc." });
  try {
    const id = randomUUID();
    await db.query("INSERT INTO users (id, name) VALUES ($1, $2)", [id, name]);
    const user = { id, name };
    res.json({ token: tokenFor(user, true), user });
  } catch (error) {
    console.error(error);
    res.status(503).json({ error: "Database chưa sẵn sàng." });
  }
}

async function register(req, res) {
  const { name, email, password } = credentials(req.body);
  if (name.length < 2 || !email.includes("@") || password.length < 8 || password.length > 128) return res.status(400).json({ error: "Tên, email hoặc mật khẩu không hợp lệ (mật khẩu tối thiểu 8 ký tự)." });
  try {
    const user = { id: randomUUID(), name, email };
    await db.query("INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4)", [user.id, name, email, await hashPassword(password)]);
    res.status(201).json({ token: tokenFor(user), user });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "Email đã được sử dụng." });
    console.error(error);
    res.status(503).json({ error: "Không tạo được tài khoản." });
  }
}

async function login(req, res) {
  const { email, password } = credentials(req.body);
  try {
    const { rows } = await db.query("SELECT id, name, email, password_hash FROM users WHERE LOWER(email) = $1", [email]);
    if (!rows[0] || !(await passwordMatches(password, rows[0].password_hash))) return res.status(401).json({ error: "Email hoặc mật khẩu không đúng." });
    res.json({ token: tokenFor(rows[0]), user: publicUser(rows[0]) });
  } catch (error) {
    console.error(error);
    res.status(503).json({ error: "Không đăng nhập được." });
  }
}

function me(req, res) {
  res.json({ user: publicUser({ id: req.user.sub, name: req.user.name, email: req.user.email }) });
}

module.exports = { createGuestToken, register, login, me };
