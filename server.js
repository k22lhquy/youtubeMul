const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const port = Number(process.env.PORT) || 3000;
const server = http.createServer(app);
const io = new Server(server);
const rooms = new Map();

app.use(express.static(path.join(__dirname, "public")));
app.use("/vendor", express.static(path.join(__dirname, "node_modules", "hls.js", "dist")));
app.use((_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

const now = () => Date.now();

function roomSnapshot(room, socketId) {
  return {
    roomId: room.id,
    state: room.state,
    serverNow: now(),
    hostId: room.hostId,
    isHost: room.hostId === socketId,
    members: [...room.members.values()].map(({ id, name }) => ({ id, name, isHost: id === room.hostId })),
  };
}

function positionAt(state, timestamp = now()) {
  return state.playing ? state.position + (timestamp - state.changedAt) / 1000 : state.position;
}

function emitRoom(room) {
  for (const member of room.members.values()) {
    io.to(member.id).emit("room-state", roomSnapshot(room, member.id));
  }
}

function validVideoUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, name, videoUrl }, reply = () => {}) => {
    const id = String(roomId || "").trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32);
    const displayName = String(name || "").trim().slice(0, 32) || "Khách";
    if (!id) return reply({ error: "Mã phòng không hợp lệ." });

    let room = rooms.get(id);
    if (!room) {
      if (!validVideoUrl(videoUrl)) return reply({ error: "Host cần nhập URL video HTTP(S)." });
      room = {
        id,
        hostId: socket.id,
        members: new Map(),
        state: { videoUrl, playing: false, position: 0, changedAt: now(), version: 1 },
      };
      rooms.set(id, room);
    }

    socket.join(id);
    socket.data.roomId = id;
    room.members.set(socket.id, { id: socket.id, name: displayName });
    const snapshot = roomSnapshot(room, socket.id);
    reply(snapshot);
    emitRoom(room);
  });

  socket.on("room-action", ({ action, position, videoUrl }) => {
    const room = rooms.get(socket.data.roomId);
    if (!room || room.hostId !== socket.id) return socket.emit("room-error", "Chỉ host được điều khiển video.");

    const timestamp = now();
    const currentPosition = Math.max(0, positionAt(room.state, timestamp));
    if (action === "load") {
      if (!validVideoUrl(videoUrl)) return socket.emit("room-error", "URL video không hợp lệ.");
      room.state = { videoUrl, playing: false, position: 0, changedAt: timestamp, version: room.state.version + 1 };
    } else if (action === "play") {
      room.state = { ...room.state, playing: true, position: Math.max(0, Number(position) || currentPosition), changedAt: timestamp, version: room.state.version + 1 };
    } else if (action === "pause") {
      room.state = { ...room.state, playing: false, position: currentPosition, changedAt: timestamp, version: room.state.version + 1 };
    } else if (action === "seek") {
      room.state = { ...room.state, position: Math.max(0, Number(position) || 0), changedAt: timestamp, version: room.state.version + 1 };
    } else {
      return;
    }
    emitRoom(room);
  });

  socket.on("sync-request", () => {
    const room = rooms.get(socket.data.roomId);
    if (room) socket.emit("room-state", roomSnapshot(room, socket.id));
  });

  socket.on("clock-ping", (_, reply = () => {}) => reply(now()));

  socket.on("disconnect", () => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    room.members.delete(socket.id);
    if (!room.members.size) return rooms.delete(room.id);
    if (room.hostId === socket.id) room.hostId = room.members.keys().next().value;
    emitRoom(room);
  });
});

server.listen(port, () => {
  console.log(`SyncScreen running at http://localhost:${port}`);
});
