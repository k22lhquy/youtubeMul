const rooms = require("../models/room.model");

const now = () => Date.now();
const roomId = (value) => String(value || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32);
const validVideoUrl = (value) => {
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
};
const positionAt = (state, timestamp = now()) => state.playing ? state.position + (timestamp - state.changedAt) / 1000 : state.position;

function snapshot(room) {
  return {
    roomId: room.id, state: room.state, serverNow: now(), members: [...room.members.values()],
  };
}

function broadcast(io, room) {
  room.members.forEach((_, socketId) => io.to(socketId).emit("room-state", snapshot(room)));
}

function registerRoomSocket(io) {
  io.on("connection", (socket) => {
    socket.on("join-room", async ({ roomId: rawId, videoUrl }, reply = () => {}) => {
      const id = roomId(rawId);
      if (!id) return reply({ error: "Mã phòng không hợp lệ." });
      try {
        let room = await rooms.get(id);
        if (!room) {
          if (!validVideoUrl(videoUrl)) return reply({ error: "Cần nhập URL video HTTP(S) để tạo phòng." });
          room = await rooms.create({ id, ownerId: socket.data.user.guest ? null : socket.data.user.sub, members: new Map(), state: { videoUrl, playing: false, position: 0, changedAt: now(), version: 1 } });
        }
        socket.join(id);
        socket.data.roomId = id;
        room.members.set(socket.id, { id: socket.id, name: socket.data.user.name });
        reply(snapshot(room));
        broadcast(io, room);
      } catch (error) {
        console.error(error);
        reply({ error: "Database chưa sẵn sàng." });
      }
    });

    socket.on("room-action", async ({ action, position, videoUrl }) => {
      try {
        const room = await rooms.get(socket.data.roomId);
        if (!room || !room.members.has(socket.id)) return socket.emit("room-error", "Bạn chưa tham gia phòng.");
        const timestamp = now();
        const currentPosition = Math.max(0, positionAt(room.state, timestamp));
        if (action === "load" && validVideoUrl(videoUrl)) room.state = { videoUrl, playing: false, position: 0, changedAt: timestamp, version: room.state.version + 1 };
        else if (action === "play") room.state = { ...room.state, playing: true, position: Math.max(0, Number(position) || currentPosition), changedAt: timestamp, version: room.state.version + 1 };
        else if (action === "pause") room.state = { ...room.state, playing: false, position: currentPosition, changedAt: timestamp, version: room.state.version + 1 };
        else if (action === "seek") room.state = { ...room.state, position: Math.max(0, Number(position) || 0), changedAt: timestamp, version: room.state.version + 1 };
        else return socket.emit("room-error", action === "load" ? "URL video không hợp lệ." : "Thao tác không hợp lệ.");
        await rooms.save(room);
        broadcast(io, room);
      } catch (error) {
        console.error(error);
        socket.emit("room-error", "Không lưu được trạng thái phòng.");
      }
    });

    socket.on("sync-request", async () => { const room = await rooms.get(socket.data.roomId); if (room) socket.emit("room-state", snapshot(room)); });
    socket.on("clock-ping", (_, reply = () => {}) => reply(now()));
    socket.on("disconnect", async () => {
      try {
        const room = await rooms.get(socket.data.roomId);
        if (!room) return;
        room.members.delete(socket.id);
        if (!room.members.size) {
          if (room.state.playing) room.state = { ...room.state, playing: false, position: positionAt(room.state), changedAt: now(), version: room.state.version + 1 };
          await rooms.save(room);
          return rooms.release(room.id);
        }
        broadcast(io, room);
      } catch (error) {
        console.error(error);
      }
    });
  });
}

async function roomHistory(req, res) {
  if (req.user.guest) return res.status(403).json({ error: "Cần tài khoản để xem lịch sử phòng." });
  res.json({ rooms: await rooms.history(req.user.sub) });
}

module.exports = { registerRoomSocket, roomHistory };
