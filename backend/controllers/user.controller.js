const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user.model");
const Project = require("../models/project.model");
const Review = require("../models/review.model");

const { streamUpload } = require("../utils/fileUpload");
const { parseJson } = require("../utils/parseJson");

async function handleRegisterUser(req, res) {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const { username, email, password, role, studentProfile, clientProfile } = req.body;

    let parsedStudentProfile = parseJson(studentProfile);
    let parsedClientProfile = parseJson(clientProfile);

    // === Basic field validations ===
    if (!username || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Username, email, password, and role are required" });
    }

    // Ensure the role is either 'student' or 'client'
    if (!["student", "client"].includes(role)) {
      return res.status(400).json({ message: "Invalid role provided" });
    }

    // === Role-based profile validation ===
    if (role === "student") {
      if (
        !parsedStudentProfile ||
        !parsedStudentProfile.fullName ||
        !parsedStudentProfile.skills ||
        !parsedStudentProfile.bio ||
        !parsedStudentProfile.portfolioLinks ||
        !parsedStudentProfile.availability
      ) {
        return res
          .status(400)
          .json({ message: "Missing or invalid fields in student profile" });
      }
    }

    if (role === "client") {
      if (
        !parsedClientProfile ||
        !parsedClientProfile.orgName ||
        !parsedClientProfile.orgDescription
        // socialLinks is optional
      ) {
        return res
          .status(400)
          .json({ message: "Missing or invalid fields in client profile" });
      }
    }

    // Ensure user image is present (middleware silently drops bad files)
    if (!req.file) {
      if (role === "student") {
        return res.status(400).json({ message: "Profile image is required" });
      } else {
        return res.status(400).json({ message: "Organisation Logo is required" });
      }
    }

    // === Uniqueness check ===
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with given email or username" });
    }

    // === Upload image to Cloudinary ===
    const uploadResult = await streamUpload(req.file.buffer, {
      folder: "skillbridge/userImages",
    });

    if (role === "student") {
      parsedStudentProfile.profileImageUrl = uploadResult.secure_url;
    }

    if (role === "client") {
      parsedClientProfile.orgLogoUrl = uploadResult.secure_url;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // === Create new user ===
    const resultUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      ...(role === "student" && { studentProfile: parsedStudentProfile }),
      ...(role === "client" && { clientProfile: parsedClientProfile }),
    });

    res.status(201).json({
      message: "User registered successfully",
      id: resultUser._id,
    });
  } catch (err) {
    console.log("Registration error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
}

async function handleLoginUser(req, res) {
  if (!req.body) {
    return res.status(400).json({ message: "Request body is missing" });
  }

  const { email, password } = req.body;

  // === Basic field validations ===
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const dbUser = await User.findOne({ email });

    if (!dbUser) {
      return res.status(400).json({ message: "Invalid user credentials" });
    }

    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);

    if (!isPasswordMatched) {
      return res.status(400).json({ message: "Incorrect password" });
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
    res.status(500).json({ message: "Server error during login" });
  }
}

// Get anyone's user profile
async function handleGetUserProfile(req, res) {
  try {
    const { id: userId } = req.params;

    // === Fetch user profile ===
    const userProfile = await User.findById(userId).select("-password").lean();

    if (!userProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    // === Fetch reviews if user is a student ===
    if (userProfile.role === "student") {
      const reviews = await Review.find(
        { reviewee: userId },
        { _id: 1, project: 1, reviewer: 1, rating: 1, comment: 1, createdAt: 1 }
      )
        .sort({ createdAt: -1 })
        .lean();

      // Add reviews to userProfile
      userProfile.reviews = reviews;
    }
    // === Fetch projects if user is a client ===
    else if (userProfile.role === "client") {
      const projects = await Project.find(
        { createdBy: userId },
        { _id: 1, title: 1, description: 1, status: 1, createdAt: 1 }
      ).lean();

      // Add projects to userProfile
      userProfile.projects = projects;
    }

    // === Return success response ===
    return res
      .status(200)
      .json({ message: "User profile fetched successfully", userProfile });
  } catch (error) {
    console.log("Get user profile error:", error);
    return res.status(500).json({ message: "Server error while fetching user profile" });
  }
}

module.exports = { handleRegisterUser, handleLoginUser, handleGetUserProfile };
