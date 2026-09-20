const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { pipeline, Transform } = require("node:stream");
const { promisify } = require("node:util");

const pipe = promisify(pipeline);
const uploads = path.join(__dirname, "..", "..", "uploads");
const extensions = new Set([".mp4", ".webm", ".ogg"]);
const maxBytes = 1024 ** 3;

async function uploadVideo(req, res) {
  let target;
  try {
    const original = decodeURIComponent(String(req.headers["x-file-name"] || ""));
    const extension = path.extname(original).toLowerCase();
    if (!extensions.has(extension) || !String(req.headers["content-type"] || "").startsWith("video/")) return res.status(400).json({ error: "Chỉ hỗ trợ MP4, WebM hoặc OGG." });
    if (Number(req.headers["content-length"]) > maxBytes) return res.status(413).json({ error: "Video vượt giới hạn 1 GB." });

    await fs.promises.mkdir(uploads, { recursive: true });
    const filename = `${randomUUID()}${extension}`;
    target = path.join(uploads, filename);
    let bytes = 0;
    const limit = new Transform({ transform(chunk, _, callback) { bytes += chunk.length; callback(bytes > maxBytes ? new Error("LIMIT") : null, chunk); } });
    await pipe(req, limit, fs.createWriteStream(target, { flags: "wx" }));
    if (!bytes) throw new Error("EMPTY");
    res.status(201).json({ url: `/uploads/${filename}` });
  } catch (error) {
    if (target) await fs.promises.rm(target, { force: true });
    res.status(error.message === "LIMIT" ? 413 : 400).json({ error: error.message === "LIMIT" ? "Video vượt giới hạn 1 GB." : "Upload video thất bại." });
  }
}

module.exports = { uploadVideo };
