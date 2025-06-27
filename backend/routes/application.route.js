const express = require("express");

const { authorizeUserRoles } = require("../middlewares/auth.middleware");

const {
  handleCreateApplication,
  handleDeleteApplication,
  handleUpdateApplicationStatus,
  handleGetApplicationsByProject,
  handleGetApplicationsByStudent,
  handleGetSpecificApplication,
} = require("../controllers/application.controller");

const { resumeUpload } = require("../middlewares/multer.middleware");

const router = express.Router();

// only student can create
router
  .route("/")
  .post(
    authorizeUserRoles("student"),
    resumeUpload.single("resume"),
    handleCreateApplication
  )
  // only client and admin can view applications
  .get(authorizeUserRoles("client", "admin"), handleGetApplicationsByProject);

// only student can delete
router
  .route("/:id")
  .delete(authorizeUserRoles("student"), handleDeleteApplication)
  .get(authorizeUserRoles("client", "admin"), handleGetSpecificApplication);

// only client can change the application status
router.patch("/:id/status", authorizeUserRoles("client"), handleUpdateApplicationStatus);

// only student can view his/her's applications
router.get(
  "/student",
  authorizeUserRoles("student", "admin"),
  handleGetApplicationsByStudent
);

// only client can view a particular application

module.exports = router;
