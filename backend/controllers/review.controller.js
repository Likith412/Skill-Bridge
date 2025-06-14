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

    return res.status(201).json({ message: "Review created", review: newReview });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error while creating review" });
  }
}

module.exports = { handleCreateReview };
