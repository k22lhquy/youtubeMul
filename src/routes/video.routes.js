const router = require("express").Router();
const { uploadVideo } = require("../controllers/video.controller");
const { authRequired } = require("../middleware/auth");

router.post("/", authRequired, uploadVideo);
module.exports = router;
