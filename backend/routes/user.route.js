const express = require("express");
const { profileUpload } = require("../middlewares/multer.middleware");
const {
  authenticateUser,
  authorizeUserRoles,
} = require("../middlewares/auth.middleware");

const {
  handleRegisterUser,
  handleLoginUser,
  handleDeleteUser,
  handleGetUserProfile,
  handleUpdateUserProfile,
  handleToggleBlockUser,
} = require("../controllers/user.controller");

const router = express.Router();

// User registration and login routes
router.post("/register", profileUpload.single("userImage"), handleRegisterUser);
router.post("/login", handleLoginUser);

// User profile route
router
  .route("/:id/profile")
  .get(authenticateUser, handleGetUserProfile)
  .put(
    authenticateUser,
    authorizeUserRoles("client", "student"),
    profileUpload.single("userImage"),
    handleUpdateUserProfile
  );

// User deletion route
router.delete("/:id", authenticateUser, handleDeleteUser);

// Admin routes for user management
router.put(
  "/:id/toggle-block",
  authenticateUser,
  authorizeUserRoles("admin"),
  handleToggleBlockUser
);

module.exports = router;
