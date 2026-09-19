const express = require("express");
const path = require("node:path");
const authRoutes = require("./routes/auth.routes");

const app = express();
const clientDist = path.join(__dirname, "..", "client", "dist");

app.use(express.json());
app.get("/api/health", (_, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use(express.static(clientDist));
app.get("*splat", (_, res) => res.sendFile(path.join(clientDist, "index.html")));

module.exports = { app };
