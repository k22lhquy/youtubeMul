const express = require("express");
const path = require("node:path");
const authRoutes = require("./routes/auth.routes");
const roomRoutes = require("./routes/room.routes");
const videoRoutes = require("./routes/video.routes");
const db = require("./config/database");

const app = express();
const clientDist = path.join(__dirname, "..", "client", "dist");

app.use((_, res, next) => { res.set("Referrer-Policy", "no-referrer-when-downgrade"); next(); });
app.use(express.json());
app.get("/api/health", async (_, res) => {
  try { await db.query("SELECT 1"); res.json({ ok: true, database: "connected" }); }
  catch { res.status(503).json({ ok: false, database: "disconnected" }); }
});
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/videos", videoRoutes);
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads"), { dotfiles: "deny" }));
app.use(express.static(clientDist));
app.get("*splat", (_, res) => res.sendFile(path.join(clientDist, "index.html")));

module.exports = { app };
