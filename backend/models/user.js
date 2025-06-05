const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { type: String, required: true, unique: true },

  password: { type: String, required: true }, 

  role: {
    type: String,
    enum: ["student", "client"],
    required: true
  },

  // Student fields
  profileImage: String,
  bio: String,
  skills: [String],
  portfolioLinks: [String],
  pricing: Number,
  availability: String,

  //Client fields
  orgName: String,
  orgDescription: String,

  isBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
module.exports = User;
