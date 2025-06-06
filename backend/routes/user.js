const express = require("express");

const { handleRegisterUser } = require("../controllers/user");

const router = express.Router();

router.post("/", handleRegisterUser);

module.exports = router;
