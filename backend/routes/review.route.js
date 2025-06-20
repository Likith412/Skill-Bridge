const express = require("express");

const { authorizeUserRoles } = require("../middlewares/auth.middleware");
const {
  handleUpdateSpecificReview,
  handleDeleteSpecificReview,
  handleGetSpecificReview,
} = require("../controllers/review.controller");

const router = express.Router();

router
  .route("/:id")
  .get(handleGetSpecificReview) // anyone can view a specific review
  .put(authorizeUserRoles("client"), handleUpdateSpecificReview) // only client can update a review
  .delete(authorizeUserRoles("client"), handleDeleteSpecificReview); // only client can delete a review

module.exports = router;
