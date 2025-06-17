const express = require("express");
const { authorizeUserRoles } = require("../middlewares/auth.middleware");

const {
  handleCreateProject,
  handleGetProjects,
  handleGetSpecificProject,
  handleUpdateSpecificProject,
  handleDeleteSpecificProject,
} = require("../controllers/project.controller");

const { handleCreateReview } = require("../controllers/review.controller");

const router = express.Router();

router
  .route("/")
  .get(handleGetProjects) // anyone can view projects
  .post(authorizeUserRoles("client"), handleCreateProject); // only client can create

router
  .route("/:id")
  .get(handleGetSpecificProject) // anyone can view specific project
  .delete(authorizeUserRoles("client"), handleDeleteSpecificProject) // only client can delete
  .put(authorizeUserRoles("client"), handleUpdateSpecificProject); // only client can update

router.post("/:id/review", authorizeUserRoles("client"), handleCreateReview); // only client can create a review for students assigned to a project

module.exports = router;
