const express = require("express");
const { authorizeUserRoles } = require("../middlewares/auth.middleware");

const {
  handleCreateProject,
  handleGetProjects,
  handleGetSpecificProject,
  handleUpdateSpecificProject,
  handleDeleteSpecificProject,
} = require("../controllers/project.controller");

const router = express.Router();

router
  .route("/")
  .get(handleGetProjects) // anyone can view projects
  .post(authorizeUserRoles("client"), handleCreateProject); // only client can create

router
  .route("/:id")
  .get(handleGetSpecificProject) // anyone can view specific project
  .delete(authorizeUserRoles("client", "admin"), handleDeleteSpecificProject); // only client and admin can delete

router.put(
  "/edit/:id",
  authorizeUserRoles("client", "admin"),
  handleUpdateSpecificProject
); // only client can update

module.exports = router;
