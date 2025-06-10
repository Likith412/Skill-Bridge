const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeUserRoles } = require("../middleware/authMiddleware");
const resumeUpload = require("../middleware/resumeUpload");
const {acceptApplication,deleteApplication,createApplication} = require("../controllers/application.controller")
// Student: Create Application
router.post(
  "/",
  authenticateUser,
  authorizeUserRoles("student"),
  resumeUpload.single("resume"),
  createApplication
);

// Student: Delete Application
router.delete(
  "/:id",
  authenticateUser,
  authorizeUserRoles("student"),
  deleteApplication
);

// Client: Accept Application
router.patch(
  "/:id/accept",
  authenticateUser,
  authorizeUserRoles("client"),
  acceptApplication
);

module.exports = router;
