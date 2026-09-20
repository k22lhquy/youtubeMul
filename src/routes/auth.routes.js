const router = require("express").Router();
const { register, login, loginWithGoogle, config, me } = require("../controllers/auth.controller");
const { authRequired } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.post("/google", loginWithGoogle);
router.get("/config", config);
router.get("/me", authRequired, me);
module.exports = router;
