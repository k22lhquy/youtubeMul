const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright-core");
const { Pool } = require("pg");

const root = path.join(__dirname, "..");
const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const videoUrl = process.env.E2E_YOUTUBE_URL || "https://www.youtube.com/watch?v=M7lc1UVf-VE";
const videoId = new URL(videoUrl).searchParams.get("v");

test("YouTube URL loads and synchronizes play state", async (t) => {
  const port = 3900 + Math.floor(Math.random() * 90);
  const app = spawn(process.execPath, ["server.js"], { cwd: root, env: { ...process.env, PORT: String(port) } });
  t.after(() => app.kill());
  await new Promise((resolve, reject) => {
    app.stdout.on("data", (data) => data.toString().includes("running at") && resolve());
    app.once("error", reject);
  });

  const browser = await chromium.launch({ executablePath: edge, headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
  t.after(() => browser.close());
  const db = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://syncscreen:syncscreen-local@127.0.0.1:5432/syncscreen" });
  const suffix = Date.now();
  const hostName = `YouTube Host ${suffix}`;
  const guestName = `YouTube Guest ${suffix}`;
  let roomCode;
  t.after(async () => {
    if (roomCode) await db.query("DELETE FROM rooms WHERE code = $1", [roomCode]);
    await db.query("DELETE FROM users WHERE name = ANY($1::text[])", [[hostName, guestName]]);
    await db.end();
  });

  const host = await browser.newPage();
  const guest = await browser.newPage();
  const errors = [];
  host.on("pageerror", (error) => errors.push(`host: ${error.message}`));
  guest.on("pageerror", (error) => errors.push(`guest: ${error.message}`));
  await host.goto(`http://127.0.0.1:${port}`);
  await host.locator('input[placeholder="Quy"]').fill(hostName);
  await host.locator('input[type="url"]').fill(videoUrl);
  await host.getByRole("button", { name: "Tạo phòng" }).click();
  await host.waitForURL(/#.+/);
  roomCode = host.url().split("#")[1];
  await host.locator(`iframe[src*="youtube.com/embed/${videoId}"]`).waitFor({ timeout: 20_000 });
  await host.getByRole("button", { name: "Phát", exact: true }).click();
  try {
    await host.locator('iframe[data-player-state="1"]').waitFor({ timeout: 20_000 });
  } catch {
    const iframe = host.locator(`iframe[src*="youtube.com/embed/${videoId}"]`);
    throw new Error(JSON.stringify({ state: await iframe.getAttribute("data-player-state"), playerError: await iframe.getAttribute("data-player-error"), page: await host.locator("body").innerText(), errors }));
  }
  await host.getByText("Đang phát đồng bộ").waitFor();

  await guest.goto(host.url());
  await guest.locator('input[placeholder="Quy"]').fill(guestName);
  await guest.getByRole("button", { name: "Tham gia phòng" }).click();
  await guest.locator(`iframe[src*="youtube.com/embed/${videoId}"]`).waitFor({ timeout: 20_000 });
  await guest.getByText("Đang phát đồng bộ").waitFor();
  await guest.locator('iframe[data-player-state="1"]').waitFor({ timeout: 20_000 });
  await host.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  await guest.locator('iframe[data-player-state="2"]').waitFor({ timeout: 20_000 });
  assert.deepEqual(errors, []);
});
