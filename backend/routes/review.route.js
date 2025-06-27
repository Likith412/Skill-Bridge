const express = require("express");

const { authorizeUserRoles } = require("../middlewares/auth.middleware");
const {
  handleCreateReview,
  handleUpdateSpecificReview,
  handleDeleteSpecificReview,
  handleGetSpecificReview,
} = require("../controllers/review.controller");

const router = express.Router();

// only client can create a review for students assigned to a project
router.post("/", authorizeUserRoles("client"), handleCreateReview);

router
  .route("/:id")
  // anyone can view a specific review
  .get(handleGetSpecificReview)
  // only client can update a review
  .put(authorizeUserRoles("client"), handleUpdateSpecificReview)
  // only client can delete a review
  .delete(authorizeUserRoles("client"), handleDeleteSpecificReview);

module.exports = router;
