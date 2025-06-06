const User = require("../models/user");
const bcrypt = require("bcryptjs");

async function handleRegisterUser(req, res) {
  try {
    const {
      username,
      email,
      password,
      role,
      studentProfile = null,
      clientProfile = null,
    } = req.body;

    // Basic field validations
    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing." });
    }

    if (!username || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Username, email, password, and role are required." });
    }

    if (!["student", "client", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role provided." });
    }

    // Role-based profile validation
    if (role === "student") {
      if (
        !studentProfile ||
        !studentProfile.fullName ||
        !studentProfile.skills ||
        !studentProfile.bio ||
        !studentProfile.profileImageUrl ||
        !studentProfile.portfolioLinks ||
        !studentProfile.pricing ||
        !studentProfile.availability
      ) {
        return res
          .status(400)
          .json({ message: "Missing fields in student profile." });
      }
    }

    if (role === "client") {
      if (
        !clientProfile ||
        !clientProfile.orgLogoUrl ||
        !clientProfile.orgDescription
        // socialLinks is optional
      ) {
        return res
          .status(400)
          .json({ message: "Missing fields in client profile." });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with given email or username." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const resultUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      ...(role === "student" && { studentProfile }),
      ...(role === "client" && { clientProfile }),
    });

    res.status(201).json({
      message: "User registered successfully!",
      id: resultUser._id,
    });
  } catch (err) {
    console.log("Registration error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
}

async function handleLoginUser(req, res) {}

module.exports = { handleRegisterUser, handleLoginUser };
