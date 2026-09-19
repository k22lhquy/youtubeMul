const express = require("express");
const path = require("node:path");
const authRoutes = require("./routes/auth.routes");
const db = require("./config/database");

const app = express();
const clientDist = path.join(__dirname, "..", "client", "dist");

app.use(express.json());
app.get("/api/health", async (_, res) => {
  try { await db.query("SELECT 1"); res.json({ ok: true, database: "connected" }); }
  catch { res.status(503).json({ ok: false, database: "disconnected" }); }
});
app.use("/api/auth", authRoutes);
app.use(express.static(clientDist));
app.get("*splat", (_, res) => res.sendFile(path.join(clientDist, "index.html")));

module.exports = { app };
