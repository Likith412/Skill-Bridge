const mongoose = require("mongoose");

const Review = require("../models/review.model");
const Project = require("../models/project.model");
const User = require("../models/user.model");
const Application = require("../models/application.model");

async function handleCreateReview(req, res) {
  const { id: projectId } = req.params;

  // === Validate MongoDB ObjectId ===
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(404).json({ message: "Project not found" });
  }

  try {
    // === Check if project exists ===
    const projectDoc = await Project.findById(projectId);
    if (!projectDoc) {
      return res.status(404).json({ message: "Project not found" });
    }

    // === Ensure reviewer is the project creator ===
    const { _id: reviewerId } = req.user;
    const { createdBy } = projectDoc;

    const isCreator = createdBy.toString() === reviewerId.toString();
    if (!isCreator) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    const { rating, comment, revieweeId } = req.body;

    // === Basic field validations ===
    if (!rating || !revieweeId || !comment) {
      return res
        .status(400)
        .json({ error: "Rating, revieweeId, and comment are required" });
    }

    // === Validate revieweeId format ===
    if (!mongoose.Types.ObjectId.isValid(revieweeId)) {
      return res.status(400).json({ message: "Reviewee user not found" });
    }

    // === Check if reviewee user exists ===
    const revieweeUser = await User.findById(revieweeId);
    if (!revieweeUser) {
      return res.status(404).json({ message: "Reviewee user not found" });
    }

    // === Check if reviewee is part of this project ===
    const isAssigned = await Application.findOne({
      project: projectId,
      student: revieweeId,
      status: "approved",
    });

    if (!isAssigned) {
      return res.status(403).json({
        message: "You can only review students assigned to this project",
      });
    }

    // === Prevent duplicate review for same student in same project ===
    const existingReview = await Review.findOne({
      project: projectId,
      reviewer: reviewerId,
      reviewee: revieweeId,
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You already reviewed this student for this project",
      });
    }

    // === Validate rating ===
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
    }

    // === Create review ===
    const newReview = await Review.create({
      rating,
      comment: comment.trim(),
      project: projectId,
      reviewer: reviewerId,
      reviewee: revieweeId,
    });

    return res.status(201).json({ message: "Review created", review: newReview._id });
  } catch (err) {
    console.log("Create review error: ", err);
    return res.status(500).json({ message: "Server error while creating review" });
  }
}

async function handleDeleteSpecificReview(req, res) {
  const { id: reviewId } = req.params;

  // === Validate MongoDB ObjectId ===
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return res.status(404).json({ message: "Review not found" });
  }

  try {
    // === Check if review exists ===
    const reviewDoc = await Review.findById(reviewId);
    if (!reviewDoc) {
      return res.status(404).json({ message: "Review not found" });
    }

    // === Ensure reviewer is the one deleting the review ===
    const { _id: currentUserId } = req.user;
    const { reviewer } = reviewDoc;

    const isReviewer = reviewer.toString() === currentUserId.toString();

    if (!isReviewer) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // === Delete review ===
    await Review.findByIdAndDelete(reviewId);
    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (err) {
    console.log("Delete review error: ", err);
    return res.status(500).json({ message: "Server error while deleting review" });
  }
}

async function handleUpdateSpecificReview(req, res) {
  const { id: reviewId } = req.params;

  // === Validate MongoDB ObjectId ===
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return res.status(404).json({ message: "Review not found" });
  }

  try {
    // === Check if review exists ===
    const reviewDoc = await Review.findById(reviewId);
    if (!reviewDoc) {
      return res.status(404).json({ message: "Review not found" });
    }

    // === Ensure reviewer is the one updating the review ===
    const { _id: currentUserId } = req.user;
    const { reviewer } = reviewDoc;

    const isReviewer = reviewer.toString() === currentUserId.toString();

    if (!isReviewer) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // === Validate request body ===
    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const { rating, comment } = req.body;

    // === Basic field validations ===
    if (!rating || !comment) {
      return res.status(400).json({ error: "Rating and comment are required" });
    }

    // === Validate rating ===
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
    }

    // === Update review ===
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { rating, comment: comment.trim() },
      { new: true }
    );

    return res.status(200).json({ message: "Review updated", review: updatedReview });
  } catch (err) {
    console.log("Update review error: ", err);
    return res.status(500).json({ message: "Server error while updating review" });
  }
}

async function handleGetSpecificReview(req, res) {
  const { id: reviewId } = req.params;

  // === Validate MongoDB ObjectId ===
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return res.status(404).json({ message: "Review not found" });
  }

  try {
    // === Check if review exists ===
    const reviewDoc = await Review.findById(reviewId);

    if (!reviewDoc) {
      return res.status(404).json({ message: "Review not found" });
    }

    // === Return success response ===
    return res.status(200).json({ review: reviewDoc });
  } catch (err) {
    console.log("Get specific review error: ", err);
    return res.status(500).json({ message: "Server error while fetching review" });
  }
}

module.exports = {
  handleCreateReview,
  handleDeleteSpecificReview,
  handleUpdateSpecificReview,
  handleGetSpecificReview,
};
