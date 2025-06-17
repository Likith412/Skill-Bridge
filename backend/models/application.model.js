const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resume: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
  },
  { timestamps: true, strict: true }
);

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
