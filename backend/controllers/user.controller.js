const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const User = require("../models/user.model");
const cloudinary = require("../configs/cloudinary.config");

async function handleRegisterUser(req, res) {
  if (!req.body) {
    return res.status(400).json({ message: "Request body is missing." });
  }

  const {
    username,
    email,
    password,
    role,
    studentProfile = null,
    clientProfile = null,
  } = req.body;

  // === Basic field validations ===
  if (!username || !email || !password || !role) {
    return res
      .status(400)
      .json({ message: "Username, email, password, and role are required." });
  }

  // Ensure the role is either 'student' or 'client'
  if (!["student", "client"].includes(role)) {
    return res.status(400).json({ message: "Invalid role provided." });
  }

  // Ensure user image is present (middleware silently drops bad files)
  if (!req.file) {
    if (role === "student") {
      return res.status(400).json({ message: "Profile image is required." });
    } else {
      return res.status(400).json({ message: "Organisation Logo is required." });
    }
  }

  // === Role-based profile validation ===
  if (role === "student") {
    if (
      !studentProfile ||
      !studentProfile.fullName ||
      !studentProfile.skills ||
      !studentProfile.bio ||
      !studentProfile.portfolioLinks ||
      !studentProfile.availability
    ) {
      return res.status(400).json({ message: "Missing fields in student profile." });
    }
  }

  if (role === "client") {
    if (
      !clientProfile ||
      !clientProfile.orgName ||
      !clientProfile.orgDescription
      // socialLinks is optional
    ) {
      return res.status(400).json({ message: "Missing fields in client profile." });
    }
  }

  try {
    // === Uniqueness check ===
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with given email or username." });
    }

    // === Upload image to Cloudinary ===
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "skillbridge/userImages",
    });

    // Clean up local file
    fs.unlink(req.file.path, err => {
      if (err) console.error("Failed to delete local image:", err);
    });

    if (role === "student") {
      studentProfile.profileImageUrl = uploadResult.secure_url;
    }

    if (role === "client") {
      clientProfile.orgLogoUrl = uploadResult.secure_url;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // === Create new user ===
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

async function handleLoginUser(req, res) {
  if (!req.body) {
    return res.status(400).json({ message: "Request body is missing." });
  }

  const { email, password } = req.body;

  // === Basic field validations ===
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const dbUser = await User.findOne({ email });

    if (!dbUser) {
      return res.status(400).json({ message: "Invalid user credentials." });
    }

    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);

    if (!isPasswordMatched) {
      return res.status(400).json({ message: "Incorrect password." });
    }

    // === Prepare payload for JWT ===
    const payload = {
      _id: dbUser._id,
      email: dbUser.email,
      username: dbUser.username,
      role: dbUser.role,
    };

    // === Generate token ===
    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      message: "Login successful",
      user: payload,
      jwtToken,
    });
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
}

module.exports = { handleRegisterUser, handleLoginUser };
