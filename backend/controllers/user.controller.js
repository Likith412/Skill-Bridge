const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");

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

    let { username, email, password, role, studentProfile, clientProfile } = req.body;

    // === Trim whitespace ===
    username = username?.trim();
    email = email?.trim();

    let parsedStudentProfile = parseJson(studentProfile);
    let parsedClientProfile = parseJson(clientProfile);

    // === Basic field validations ===
    if (!username || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Username, email, password, and role are required" });
    }

    // === Email validation ===
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
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
        !parsedStudentProfile.bio ||
        !parsedStudentProfile.skills ||
        !parsedStudentProfile.portfolioLinks ||
        !parsedStudentProfile.availability
      ) {
        return res
          .status(400)
          .json({ message: "Missing or invalid fields in student profile" });
      }

      // Validate skills array
      if (
        !Array.isArray(parsedStudentProfile.skills) ||
        parsedStudentProfile.skills.length === 0
      ) {
        return res.status(400).json({ message: "skills must be a non-empty array" });
      }

      // Validate portfolioLinks array
      if (
        !Array.isArray(parsedStudentProfile.portfolioLinks) ||
        parsedStudentProfile.portfolioLinks.length === 0
      ) {
        return res
          .status(400)
          .json({ message: "portfolioLinks must be a non-empty array" });
      }

      // Validate availability
      const validAvailabilities = [
        "10hrs/week",
        "15hrs/week",
        "20hrs/week",
        "24hrs/week",
      ];

      if (!validAvailabilities.includes(parsedStudentProfile.availability)) {
        return res.status(400).json({ message: "Invalid availability option provided" });
      }
    }

    if (role === "client") {
      // Ensure client profile has required fields
      if (
        !parsedClientProfile ||
        !parsedClientProfile.orgName ||
        !parsedClientProfile.orgDescription ||
        !parsedClientProfile.socialLinks
      ) {
        return res
          .status(400)
          .json({ message: "Missing or invalid fields in client profile" });
      }

      // Sanitize socialLinks if present
      const socialLinks = parsedClientProfile.socialLinks;

      // Check if socialLinks NOT an object
      if (typeof socialLinks !== "object" || Array.isArray(socialLinks)) {
        return res.status(400).json({ message: "Social links must be an object" });
      }

      // Destructure safely
      const { linkedin, twitter, website } = socialLinks;

      // Validate non-empty fields
      if (linkedin && !validator.isURL(linkedin)) {
        return res.status(400).json({ message: "Invalid LinkedIn URL provided" });
      }
      if (twitter && !validator.isURL(twitter)) {
        return res.status(400).json({ message: "Invalid Twitter URL provided" });
      }
      if (website && !validator.isURL(website)) {
        return res.status(400).json({ message: "Invalid Website URL provided" });
      }

      // Ensure socialLinks is an object with valid URLs
      parsedClientProfile.socialLinks = {
        linkedin: linkedin || "",
        twitter: twitter || "",
        website: website || "",
      };
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
    const existingUser = await User.findOne({ $or: [{ email }, { username }] }).lean();
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
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    let { email, password } = req.body;

    // === Trim whitespace ===
    email = email?.trim();

    // === Basic field validations ===
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // === Email validation ===
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // === Fetch user by email ===
    const dbUser = await User.findOne({ email }).lean();

    if (!dbUser) {
      return res.status(400).json({ message: "Invalid user credentials" });
    }

    // === Check if password matches ===
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

// Pending...
async function handleUpdateUserProfile(req, res) {
  const User = require("../models/user.model");

const handleUpdateUserProfile = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const updates = req.body;

    // Fetch existing user
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent changing username or password
    if ("username" in updates || "password" in updates) {
      return res.status(400).json({ message: "Username and password cannot be updated" });
    }

    const updateData = {};

    // === Student profile update ===
    if (existingUser.role === "student" && updates.studentProfile) {
      const {
        fullName,
        skills,
        bio,
        portfolioLinks,
        availability,
      } = updates.studentProfile;

      updateData.studentProfile = {
        fullName,
        skills,
        bio,
        portfolioLinks,
        availability,
        profileImageUrl: existingUser.studentProfile.profileImageUrl, // keep old one
      };
    }

    // === Client profile update ===
    if (existingUser.role === "client" && updates.clientProfile) {
      const {
        orgName,
        orgDescription,
        socialLinks,
      } = updates.clientProfile;

      updateData.clientProfile = {
        orgName,
        orgDescription,
        socialLinks,
        orgLogoUrl: existingUser.clientProfile.orgLogoUrl, // keep old one
      };
    }

    // Run the update
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    return res.status(200).json({
      message: "User profile updated successfully",
      userProfile: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ message: "Server error while updating profile" });
  }
};

module.exports = { handleUpdateUserProfile };

}

module.exports = {
  handleRegisterUser,
  handleLoginUser,
  handleGetUserProfile,
  handleUpdateUserProfile,
};
