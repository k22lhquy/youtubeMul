const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");
const { io } = require("socket.io-client");

const root = path.join(__dirname, "..");
const waitFor = (emitter, event) => new Promise((resolve) => emitter.once(event, resolve));

test("host seek synchronizes and host role transfers", async (t) => {
  const port = 3400 + Math.floor(Math.random() * 400);
  const app = spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
  });
  t.after(() => app.kill());

  await new Promise((resolve, reject) => {
    app.stdout.on("data", (data) => data.toString().includes("running at") && resolve());
    app.once("error", reject);
  });

  const url = `http://127.0.0.1:${port}`;
  const tokenFor = async (name) => {
    const response = await fetch(`${url}/api/auth/guest`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }),
    });
    assert.equal(response.status, 200);
    return (await response.json()).token;
  };
  const [hostToken, guestToken] = await Promise.all([tokenFor("Host"), tokenFor("Guest")]);
  const host = io(url, { auth: { token: hostToken }, transports: ["websocket"] });
  const guest = io(url, { auth: { token: guestToken }, transports: ["websocket"] });
  t.after(() => host.close());
  t.after(() => guest.close());
  await Promise.all([waitFor(host, "connect"), waitFor(guest, "connect")]);

  const hostRoom = await new Promise((resolve) => host.emit("join-room", {
    roomId: "TEST-ROOM", videoUrl: "https://example.com/movie.mp4",
  }, resolve));
  const guestRoom = await new Promise((resolve) => guest.emit("join-room", {
    roomId: "TEST-ROOM",
  }, resolve));
  assert.equal(hostRoom.isHost, true);
  assert.equal(guestRoom.isHost, false);

  const synced = new Promise((resolve) => {
    const onState = (update) => {
      if (update.state.position === 42) {
        guest.off("room-state", onState);
        resolve(update);
      }
    };
    guest.on("room-state", onState);
  });
  host.emit("room-action", { action: "seek", position: 42 });
  const update = await synced;
  assert.equal(update.state.position, 42);

  const transferred = waitFor(guest, "room-state");
  host.close();
  const afterHostLeaves = await transferred;
  assert.equal(afterHostLeaves.isHost, true);
});
