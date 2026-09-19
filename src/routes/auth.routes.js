const router = require("express").Router();
const { createGuestToken } = require("../controllers/auth.controller");

router.post("/guest", createGuestToken);
module.exports = router;
