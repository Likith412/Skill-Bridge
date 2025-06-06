const express = require("express");

const {
  handleCreateProject,
  handleGetProjects,
  handleGetSpecificProject,
  handleUpdateSpecificProject,
  handleDeleteSpecificProject,
} = require("../controllers/project");

const router = express.Router();

router.route("/").get(handleGetProjects).post(handleCreateProject);

router
  .route("/:id")
  .get(handleGetSpecificProject)
  .delete(handleDeleteSpecificProject);

router.put("/edit/:id", handleUpdateSpecificProject);

module.exports = router;
