const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright-core");
const { Pool } = require("pg");

test("registers in the UI and creates a room with the account JWT", async (t) => {
  const port = 3200 + Math.floor(Math.random() * 90);
  const app = spawn(process.execPath, ["server.js"], { cwd: path.join(__dirname, ".."), env: { ...process.env, PORT: String(port) } });
  t.after(() => app.kill());
  await new Promise((resolve, reject) => { app.stdout.on("data", (data) => data.toString().includes("running at") && resolve()); app.once("error", reject); });

  const browser = await chromium.launch({ executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const email = `ui-${Date.now()}@example.com`;
  let roomCode;
  const db = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://syncscreen:syncscreen-local@127.0.0.1:5432/syncscreen" });
  t.after(async () => { if (roomCode) await db.query("DELETE FROM rooms WHERE code = $1", [roomCode]); await db.query("DELETE FROM users WHERE email = $1", [email]); await db.end(); });

  await page.goto(`http://127.0.0.1:${port}`);
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await page.locator('input[name="name"]').fill("UI Account");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("correct-horse");
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await page.getByText("Đã đăng nhập: UI Account").waitFor();
  await page.locator('input[type="url"]').fill("https://example.com/movie.mp4");
  await page.getByRole("button", { name: "Tạo phòng" }).click();
  await page.waitForURL(/#.+/);
  roomCode = page.url().split("#")[1];
  assert.match(await page.locator("body").innerText(), /UI Account \(host\)/);
  await page.goto(`http://127.0.0.1:${port}`);
  await page.getByText("Phòng gần đây").waitFor();
  await page.getByRole("link", { name: new RegExp(roomCode) }).waitFor();
});
