const express = require("express");
const { authorizeUserRoles, authenticateUser } = require("../middlewares/auth");

const {
  handleCreateProject,
  handleGetProjects,
  handleGetSpecificProject,
  handleUpdateSpecificProject,
  handleDeleteSpecificProject,
} = require("../controllers/project");

const router = express.Router();

router
  .route("/")
  .get(handleGetProjects) // anyone can view projects
  .post(authenticateUser, authorizeUserRoles("client"), handleCreateProject); // only client can create

router
  .route("/:id")
  .get(handleGetSpecificProject) // anyone can view specific project
  .delete(
    authenticateUser,
    authorizeUserRoles("client"),
    handleDeleteSpecificProject
  ); // only client can delete

router.put(
  "/edit/:id",
  authenticateUser,
  authorizeUserRoles("client"),
  handleUpdateSpecificProject
); // only client can update

module.exports = router;
