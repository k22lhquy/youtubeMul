const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const { randomBytes, randomUUID, scrypt, timingSafeEqual } = require("node:crypto");
const { promisify } = require("node:util");
const { googleClientId, jwtSecret } = require("../config/env");
const db = require("../config/database");
const scryptAsync = promisify(scrypt);
const google = googleClientId ? new OAuth2Client(googleClientId) : null;

const tokenFor = (user) => jwt.sign({ sub: user.id, name: user.name, email: user.email }, jwtSecret, { expiresIn: "7d" });
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

async function loginWithGoogle(req, res) {
  if (!google) return res.status(503).json({ error: "Đăng nhập Google chưa được cấu hình." });
  try {
    const ticket = await google.verifyIdToken({ idToken: req.body?.credential, audience: googleClientId });
    const { sub, email, email_verified: verified, name: googleName } = ticket.getPayload();
    if (!verified || !email) return res.status(401).json({ error: "Tài khoản Google chưa xác minh email." });
    const name = String(googleName || email.split("@")[0]).trim().slice(0, 32);
    const existing = await db.query("SELECT id FROM users WHERE google_sub = $1 OR LOWER(email) = LOWER($2) LIMIT 1", [sub, email]);
    const id = existing.rows[0]?.id || randomUUID();
    const { rows } = await db.query(
      `INSERT INTO users (id, name, email, google_sub) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, google_sub = EXCLUDED.google_sub
       RETURNING id, name, email`,
      [id, name, email, sub],
    );
    res.json({ token: tokenFor(rows[0]), user: publicUser(rows[0]) });
  } catch {
    res.status(401).json({ error: "Đăng nhập Google không hợp lệ." });
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

const config = (_, res) => res.json({ googleClientId });

module.exports = { register, login, loginWithGoogle, config, me, hashPassword, passwordMatches };
