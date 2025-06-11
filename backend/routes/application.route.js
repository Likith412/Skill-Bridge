const express = require("express");

const { authorizeUserRoles } = require("../middlewares/auth.middleware");

const {
  handleCreateApplication,
  handleDeleteApplication,
  handleUpdateApplicationStatus,
} = require("../controllers/application.controller");

const resumeUpload = require("../middleware/resumeUpload");

const router = express.Router();

// only student can create
router.post(
  "/",
  authorizeUserRoles("student"),
  resumeUpload.single("resume"),
  handleCreateApplication
);

// only student can delete
router.delete("/:id", authorizeUserRoles("student"), handleDeleteApplication);

// only client can change the application status
router.patch("/:id/status", authorizeUserRoles("client"), handleUpdateApplicationStatus);

module.exports = router;
