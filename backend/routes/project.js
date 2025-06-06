const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const authorizeRoles = require("../middlewares/authorizeRoles");

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
  .post(verifyToken, authorizeRoles("client"), handleCreateProject); // only client can create

router
  .route("/:id")
  .get(handleGetSpecificProject) // anyone can view specific project
  .delete(verifyToken, authorizeRoles("client"), handleDeleteSpecificProject); // only client can delete

router.put("/edit/:id",
  verifyToken,
  authorizeRoles("client"),
  handleUpdateSpecificProject
); // only client can update


module.exports = router;
