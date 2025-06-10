const express = require("express");
const { profileUpload } = require("../middlewares/multer.middleware");

const { handleRegisterUser, handleLoginUser } = require("../controllers/user.controller");

const router = express.Router();

router.post("/register", profileUpload.single("userImage"), handleRegisterUser);
router.post("/login", handleLoginUser);

module.exports = router;
