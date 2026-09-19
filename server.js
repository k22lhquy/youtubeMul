const http = require("http");
const { Server } = require("socket.io");
const { app } = require("./src/app");
const { port } = require("./src/config/env");
const { registerRoomSocket } = require("./src/controllers/room.controller");
const { socketAuth } = require("./src/middleware/socket-auth");

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true } });

io.use(socketAuth);
registerRoomSocket(io);

server.listen(port, () => {
  console.log(`SyncScreen running at http://localhost:${port}`);
});
