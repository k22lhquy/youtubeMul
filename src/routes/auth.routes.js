const router = require("express").Router();
const { createGuestToken, register, login, me } = require("../controllers/auth.controller");
const { authRequired } = require("../middleware/auth");

router.post("/guest", createGuestToken);
router.post("/register", register);
router.post("/login", login);
router.get("/me", authRequired, me);
module.exports = router;
