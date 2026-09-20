const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");
const { Pool } = require("pg");

test("registers, rejects duplicate email, and logs in", async (t) => {
  const port = 3300 + Math.floor(Math.random() * 90);
  const app = spawn(process.execPath, ["server.js"], { cwd: path.join(__dirname, ".."), env: { ...process.env, PORT: String(port) } });
  t.after(() => app.kill());
  await new Promise((resolve, reject) => {
    let stderr = "";
    app.stderr.on("data", (data) => { stderr += data; });
    app.stdout.on("data", (data) => data.toString().includes("running at") && resolve());
    app.once("error", reject);
    app.once("exit", (code) => reject(new Error(`server exited ${code}: ${stderr}`)));
  });

  const email = `account-${Date.now()}@example.com`;
  const body = { name: "Account Test", email, password: "correct-horse" };
  const post = (route, data) => fetch(`http://127.0.0.1:${port}/api/auth/${route}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const created = await post("register", body);
  assert.equal(created.status, 201);
  const session = await created.json();
  assert.equal(session.user.email, email);

  assert.equal((await post("register", body)).status, 409);
  assert.equal((await post("login", { email, password: "wrong-pass" })).status, 401);
  const loggedIn = await post("login", body);
  assert.equal(loggedIn.status, 200);
  const me = await fetch(`http://127.0.0.1:${port}/api/auth/me`, { headers: { Authorization: `Bearer ${(await loggedIn.json()).token}` } });
  assert.equal((await me.json()).user.email, email);

  const db = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://syncscreen:syncscreen-local@127.0.0.1:5432/syncscreen" });
  t.after(async () => { await db.query("DELETE FROM users WHERE email = $1", [email]); await db.end(); });
});
