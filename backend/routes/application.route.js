const express = require("express");

const { authorizeUserRoles } = require("../middlewares/auth.middleware");

const {
  handleCreateApplication,
  handleDeleteApplication,
  handleUpdateApplicationStatus,
  handleGetApplicationsByProject,
  handleGetApplicationsByStudent,
  handleGetSingleApplication,
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

router
  .route("/:id")
  .get(authorizeUserRoles("client", "admin"), handleGetSingleApplication) // only client can view application
  .delete(authorizeUserRoles("student"), handleDeleteApplication); // only student can delete

// only client can change the application status
router.patch("/:id/status", authorizeUserRoles("client"), handleUpdateApplicationStatus);

// only student can view their applications
router.get("/student", authorizeUserRoles("student"), handleGetApplicationsByStudent);

// only client and admin can view applications by project
router.get(
  "/project/:projectId",
  authorizeUserRoles("client", "admin"),
  handleGetApplicationsByProject
);

module.exports = router;
