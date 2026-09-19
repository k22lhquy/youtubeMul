const rooms = require("../models/room.model");

const now = () => Date.now();
const roomId = (value) => String(value || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32);
const validVideoUrl = (value) => {
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
};
const positionAt = (state, timestamp = now()) => state.playing ? state.position + (timestamp - state.changedAt) / 1000 : state.position;

function snapshot(room, socketId) {
  return {
    roomId: room.id, state: room.state, serverNow: now(), hostId: room.hostId, isHost: room.hostId === socketId,
    members: [...room.members.values()].map(({ id, name }) => ({ id, name, isHost: id === room.hostId })),
  };
}

function broadcast(io, room) {
  room.members.forEach((_, socketId) => io.to(socketId).emit("room-state", snapshot(room, socketId)));
}

function registerRoomSocket(io) {
  io.on("connection", (socket) => {
    socket.on("join-room", async ({ roomId: rawId, videoUrl }, reply = () => {}) => {
      const id = roomId(rawId);
      if (!id) return reply({ error: "Mã phòng không hợp lệ." });
      try {
        let room = await rooms.get(id);
        if (!room) {
          if (!validVideoUrl(videoUrl)) return reply({ error: "Host cần nhập URL video HTTP(S)." });
          room = await rooms.create({ id, hostId: socket.id, members: new Map(), state: { videoUrl, playing: false, position: 0, changedAt: now(), version: 1 } });
        }
        if (!room.hostId) room.hostId = socket.id;
        socket.join(id);
        socket.data.roomId = id;
        room.members.set(socket.id, { id: socket.id, name: socket.data.user.name });
        reply(snapshot(room, socket.id));
        broadcast(io, room);
      } catch (error) {
        console.error(error);
        reply({ error: "Database chưa sẵn sàng." });
      }
    });

    socket.on("room-action", async ({ action, position, videoUrl }) => {
      try {
        const room = await rooms.get(socket.data.roomId);
        if (!room || room.hostId !== socket.id) return socket.emit("room-error", "Chỉ host được điều khiển video.");
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

    socket.on("sync-request", async () => { const room = await rooms.get(socket.data.roomId); if (room) socket.emit("room-state", snapshot(room, socket.id)); });
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
        if (room.hostId === socket.id) room.hostId = room.members.keys().next().value;
        broadcast(io, room);
      } catch (error) {
        console.error(error);
      }
    });
  });
}

module.exports = { registerRoomSocket };
