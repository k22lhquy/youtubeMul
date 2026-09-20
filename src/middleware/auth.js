const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

function authRequired(req, res, next) {
  try {
    req.user = jwt.verify(req.headers.authorization?.replace(/^Bearer /, ""), jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: "Phiên đăng nhập không hợp lệ." });
  }
}

module.exports = { authRequired };
