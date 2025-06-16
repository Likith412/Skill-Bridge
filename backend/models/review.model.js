const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: String,
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // client
      required: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // student
      required: true,
    },
  },
  { timestamps: true, strict: true }
);

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
