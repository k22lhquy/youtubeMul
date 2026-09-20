const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

function socketAuth(socket, next) {
  try {
    socket.data.user = jwt.verify(socket.handshake.auth?.token, jwtSecret);
    if (!socket.data.user.sub || !socket.data.user.name) throw new Error("Invalid account token");
    next();
  }
  catch { next(new Error("Unauthorized")); }
}

module.exports = { socketAuth };
