const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: "user" },
    profileImage: { type: String, default: "" },
    bio: { type: String, default: "" },
    skills: { type: [String], default: [] },
    portfolioLinks: { type: [String], default: [] },
    pricing: { type: Number, default: 0 },
    availability: { type: String, default: "Available" },
    orgName: { type: String, default: "" },
    orgDescription: { type: String, default: "" },
    isBlocked: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
