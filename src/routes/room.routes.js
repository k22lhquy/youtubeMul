const router = require("express").Router();
const { roomHistory } = require("../controllers/room.controller");
const { authRequired } = require("../middleware/auth");

router.get("/", authRequired, roomHistory);
module.exports = router;
