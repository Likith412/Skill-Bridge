const express = require("express");

const { authorizeUserRoles } = require("../middlewares/auth.middleware");

const {
  handleCreateApplication,
  handleDeleteApplication,
  handleUpdateApplicationStatus,
  handleGetApplicationsByProject,
  handleGetMyApplications
} = require("../controllers/application.controller");

const { resumeUpload } = require("../middlewares/multer.middleware");

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

router.get(
  "/me",
 
  authorizeUserRoles("student"),
  handleGetMyApplications
);

router.get(
  "/project/:projectId",

  authorizeUserRoles("client", "admin"),
  handleGetApplicationsByProject
);

module.exports = router;
