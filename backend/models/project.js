const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  budget: { type: Number, required: true },
  deadline: { type: Date, required: true },
  requiredSkills: [String],
  status: {
    type: String,
    enum: ["open", "in-progress", "completed", "cancelled"],
    default: "open"
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updateAt: { type: Date, default: Date.now }
});

const Project = mongoose.model("Project", projectSchema);
module.exports = Project;
