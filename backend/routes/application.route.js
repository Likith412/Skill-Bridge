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

// only student can delete
router.delete("/:id", authorizeUserRoles("student"), handleDeleteApplication);

// only client can change the application status
router.patch("/:id/status", authorizeUserRoles("client"), handleUpdateApplicationStatus);

router.get("/student", authorizeUserRoles("student"), handleGetApplicationsByStudent);

router.get(
  "/project/:projectId",
  authorizeUserRoles("client", "admin"),
  handleGetApplicationsByProject
);
router.get(
  "/application/:applicationId",
  authorizeUserRoles("client"),
  handleGetSingleApplication
);


module.exports = router;
