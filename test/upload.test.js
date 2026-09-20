const assert = require("node:assert/strict");
const fs = require("node:fs");
const { spawn } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");
const { Pool } = require("pg");

test("uploads and serves a local video", async (t) => {
  const root = path.join(__dirname, "..");
  const port = 3100 + Math.floor(Math.random() * 90);
  const app = spawn(process.execPath, ["server.js"], { cwd: root, env: { ...process.env, PORT: String(port) } });
  t.after(() => app.kill());
  await new Promise((resolve, reject) => { app.stdout.on("data", (data) => data.toString().includes("running at") && resolve()); app.once("error", reject); });

  const base = `http://127.0.0.1:${port}`;
  const authResponse = await fetch(`${base}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Upload Test", email: `upload-${Date.now()}@example.com`, password: "correct-horse" }) });
  const auth = await authResponse.json();
  const video = Buffer.from(fs.readFileSync(path.join(__dirname, "fixtures", "video.webm.base64"), "utf8"), "base64");
  const response = await fetch(`${base}/api/videos`, { method: "POST", headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "video/webm", "X-File-Name": "test.webm" }, body: video });
  assert.equal(response.status, 201);
  const { url } = await response.json();
  assert.equal((await fetch(`${base}${url}`)).status, 200);

  const target = path.join(root, url.replace(/^\//, ""));
  const db = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://syncscreen:syncscreen-local@127.0.0.1:5432/syncscreen" });
  t.after(async () => { await fs.promises.rm(target, { force: true }); await db.query("DELETE FROM users WHERE id = $1", [auth.user.id]); await db.end(); });
});
