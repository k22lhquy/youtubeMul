const db = require("../config/database");

class RoomStore {
  constructor() { this.rooms = new Map(); }

  async get(id) {
    if (this.rooms.has(id)) return this.rooms.get(id);
    const { rows } = await db.query("SELECT * FROM rooms WHERE code = $1", [id]);
    if (!rows[0]) return undefined;
    const row = rows[0];
    const room = { id, members: new Map(), state: { videoUrl: row.video_url, playing: row.playing, position: row.position, changedAt: Number(row.changed_at), version: row.version } };
    this.rooms.set(id, room);
    return room;
  }

  async create(room) {
    await db.query(
      "INSERT INTO rooms (code, owner_id, video_url, playing, position, changed_at, version) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [room.id, room.ownerId, room.state.videoUrl, room.state.playing, room.state.position, room.state.changedAt, room.state.version],
    );
    this.rooms.set(room.id, room);
    return room;
  }

  async save(room) {
    await db.query(
      "UPDATE rooms SET video_url = $2, playing = $3, position = $4, changed_at = $5, version = $6, updated_at = NOW() WHERE code = $1",
      [room.id, room.state.videoUrl, room.state.playing, room.state.position, room.state.changedAt, room.state.version],
    );
  }

  release(id) { this.rooms.delete(id); }

  async history(ownerId) {
    const { rows } = await db.query("SELECT code, video_url, playing, position, updated_at FROM rooms WHERE owner_id = $1 ORDER BY updated_at DESC LIMIT 20", [ownerId]);
    return rows.map((row) => ({ code: row.code, videoUrl: row.video_url, playing: row.playing, position: row.position, updatedAt: row.updated_at }));
  }
}

module.exports = new RoomStore();
