const mongoose = require("mongoose");

// Student Profile Subschema
const StudentProfileSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    skills: { type: [String], required: true },
    bio: { type: String, required: true },
    profileImageUrl: { type: String, required: true },
    portfolioLinks: { type: [String], required: true },
    availability: {
      type: String,
      enum: ["10hrs/week", "15hrs/week", "20hrs/week", "24hrs/week"],
      required: true,
    },
  },
  { _id: false, strict: true }
);

// Client Profile Subschema
const ClientProfileSchema = new mongoose.Schema(
  {
    orgName: { type: String, required: true },
    orgDescription: { type: String, required: true },
    orgLogoUrl: { type: String, required: true },
    socialLinks: {
      // optional social links
      type: new mongoose.Schema(
        {
          linkedin: { type: String },
          twitter: { type: String },
          website: { type: String },
        },
        { _id: false, strict: true } // Enforces only these fields
      ),
    },
  },
  { _id: false, strict: true }
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

    isBlocked: {
      type: Boolean,
      required: function () {
        return this.role !== "admin";
      },
    },

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
  { timestamps: true, strict: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
