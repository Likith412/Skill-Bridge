const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    resume: {
        type: [String],
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ["pending", "approved", "rejected"],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;