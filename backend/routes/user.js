const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  console.log("all users");
});

module.exports = router;
