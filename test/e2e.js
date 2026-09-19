const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const test = require("node:test");
const { chromium } = require("playwright-core");
const { Pool } = require("pg");

const root = path.join(__dirname, "..");
const edge = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function waitUntil(check, timeout = 15_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for browser state");
}

test("host plays, guest joins, and playback stays synchronized", async (t) => {
  const port = 3800 + Math.floor(Math.random() * 100);
  const app = spawn(process.execPath, ["server.js"], { cwd: root, env: { ...process.env, PORT: String(port) } });
  t.after(() => app.kill());
  await new Promise((resolve, reject) => {
    app.stdout.on("data", (data) => data.toString().includes("running at") && resolve());
    app.once("error", reject);
  });

  const video = Buffer.from(fs.readFileSync(path.join(__dirname, "fixtures", "video.webm.base64"), "utf8"), "base64");
  const media = http.createServer((_, response) => {
    response.writeHead(200, { "Content-Type": "video/webm", "Content-Length": video.length, "Access-Control-Allow-Origin": "*" });
    response.end(video);
  });
  await new Promise((resolve) => media.listen(0, "127.0.0.1", resolve));
  t.after(() => media.close());
  const mediaUrl = `http://127.0.0.1:${media.address().port}/video.webm`;

  const browser = await chromium.launch({ executablePath: edge, headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
  t.after(() => browser.close());
  const db = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://syncscreen:syncscreen-local@127.0.0.1:5432/syncscreen" });
  const suffix = Date.now();
  const hostName = `E2E Host ${suffix}`;
  const guestName = `E2E Guest ${suffix}`;
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
  await host.locator('input[type="url"]').fill(mediaUrl);
  await host.getByRole("button", { name: "Tạo phòng" }).click();
  await host.waitForURL(/#.+/);
  roomCode = host.url().split("#")[1];
  await host.locator("video").waitFor();
  await waitUntil(() => host.locator("video").evaluate((video) => video.readyState >= 1));
  await host.getByRole("button", { name: "Phát", exact: true }).click();
  await waitUntil(() => host.locator("video").evaluate((video) => video.currentTime > 0.5));

  await guest.goto(host.url());
  await guest.locator('input[placeholder="Quy"]').fill(guestName);
  await guest.getByRole("button", { name: "Tham gia phòng" }).click();
  await guest.locator("video").waitFor();
  await waitUntil(() => guest.locator("video").evaluate((video) => video.readyState >= 1));
  await waitUntil(() => guest.locator("video").evaluate((video) => !video.paused && video.currentTime > 0));

  const [hostTime, guestTime] = await Promise.all([
    host.locator("video").evaluate((video) => video.currentTime),
    guest.locator("video").evaluate((video) => video.currentTime),
  ]);
  assert.ok(Math.abs(hostTime - guestTime) < 1.5, `playback drift was ${Math.abs(hostTime - guestTime)}s`);
  await host.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  await waitUntil(() => guest.locator("video").evaluate((video) => video.paused));
  assert.deepEqual(errors, []);
});
