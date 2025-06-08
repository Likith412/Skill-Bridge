const mongoose = require("mongoose");

// Student Profile Subschema
const StudentProfileSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    skills: { type: [String], required: true },
    bio: { type: String, required: true },
    profileImageUrl: { type: String, required: true },
    portfolioLinks: { type: [String], required: true },
    pricing: { type: String, required: true },
    availability: { type: String, required: true },
  },
  { _id: false }
);

// Client Profile Subschema
const ClientProfileSchema = new mongoose.Schema(
  {
    orgName: { type: String, required: true },
    orgDescription: { type: String, required: true },
    orgLogoUrl: { type: String, required: true },
    socialLinks: {
      linkedin: String,
      twitter: String,
      github: String,
    },
  },
  { _id: false }
);

// Main User Schema
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["student", "client", "admin"],
      required: true,
    },

    isBlocked: { type: Boolean, default: false },

    studentProfile: {
      type: StudentProfileSchema,
      required: function () {
        return this.role === "student";
      },
    },

    clientProfile: {
      type: ClientProfileSchema,
      required: function () {
        return this.role === "client";
      },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
