const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const User = require("../models/user.model");
const Project = require("../models/project.model");
const Review = require("../models/review.model");

const { streamUpload } = require("../utils/fileUpload");
const { validateUserProfileInput } = require("../validators/user.validator");
const Application = require("../models/application.model");

async function handleRegisterUser(req, res) {
  try {
    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    let { username, email, password, role, studentProfile, clientProfile } = req.body;

    // === Trim whitespace ===
    username = username?.toLowerCase().trim();
    email = email?.toLowerCase().trim();

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

    // === User profile validation ===
    const { error, parsedClientProfile, parsedStudentProfile } = validateUserProfileInput(
      { studentProfile, clientProfile },
      role
    );

    if (error) {
      return res.status(400).json({ message: error });
    }

    // === Uniqueness check ===
    const existingUser = await User.findOne({ $or: [{ email }, { username }] }).lean();
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with given email or username" });
    }

    // === Default image URL based on role ===
    const DEFAULT_IMAGE_URL =
      role === "student"
        ? "https://res.cloudinary.com/dtz9sclra/image/upload/v1750100782/skillbridge/userImages/08350cafa4fabb8a6a1be2d9f18f2d88_rqzpsk.jpg"
        : "https://res.cloudinary.com/dtz9sclra/image/upload/v1750101610/skillbridge/userImages/1702503196049_edvubj.jpg";

    let imageUrl = DEFAULT_IMAGE_URL;

    // === If user uploaded an image, handle it. else use default ===
    if (req.file) {
      try {
        // Upload image to Cloudinary
        const uploadResult = await streamUpload(req.file.buffer, {
          folder: "skillbridge/userImages",
        });

        imageUrl = uploadResult.secure_url;
      } catch (error) {
        console.log("Image upload error:", error);
      }
    }

    // === Assign image URL based on role ===
    if (role === "student") {
      parsedStudentProfile.profileImageUrl = imageUrl;
    }

    if (role === "client") {
      parsedClientProfile.orgLogoUrl = imageUrl;
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
    email = email?.toLowerCase().trim();

    // === Basic field validations ===
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // === Email validation ===
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // === Fetch user by email ===
    const dbUser = await User.findOne({ email });

    if (!dbUser) {
      return res.status(400).json({ message: "Invalid user credentials" });
    }

    // === Check if user is blocked ===
    if (dbUser.isBlocked) {
      return res
        .status(403)
        .json({ message: "Your account has been blocked. Contact admin." });
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

    // === Return success response ===
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
    const userProfile = await User.findById(userId, {
      password: 0,
      updatedAt: 0,
      __v: 0,
    }).lean();

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

async function handleUpdateUserProfile(req, res) {
  try {
    const { id: userId } = req.params;
    const { _id: currentUserId, role } = req.user;

    // Ensure the user is updating their own profile
    const isAuthorized = currentUserId.toString() === userId.toString();

    if (!isAuthorized) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    let { studentProfile, clientProfile } = req.body;

    const { error, parsedClientProfile, parsedStudentProfile } = validateUserProfileInput(
      { studentProfile, clientProfile },
      role
    );

    if (error) {
      return res.status(400).json({ message: error });
    }

    // Ensure user image is present (middleware silently drops bad files)
    if (req.file) {
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
    }

    const updateData = {};

    if (role === "student") {
      updateData.studentProfile = parsedStudentProfile;
    } else if (role === "client") {
      updateData.clientProfile = parsedClientProfile;
    }

    // === Update user ===
    await User.findByIdAndUpdate(userId, updateData, { new: true });

    // === Return success response ===
    return res.status(200).json({ message: "User profile updated successfully" });
  } catch (error) {
    console.log("Update user profile error:", error);
    return res.status(500).json({ message: "Server error during profile update" });
  }
}

async function handleDeleteUser(req, res) {
  try {
    const { id: userId } = req.params;
    const { _id: currentUserId, role: currentUserRole } = req.user;

    // Ensure the user is deleting their own profile or is an admin
    const isAuthorized =
      currentUserId.toString() === userId.toString() || currentUserRole === "admin";

    if (!isAuthorized) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // === Get the user to be deleted ===
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    const userRole = userToDelete.role;

    // === Delete user ===
    await User.findByIdAndDelete(userId);

    if (userRole === "client") {
      // Fetch all projects created by the client
      const projects = await Project.find({ createdBy: userId });
      const projectIds = projects.map(project => project._id);

      await Project.deleteMany({ createdBy: userId }); // Delete all projects created by the client
      await Review.deleteMany({ reviewer: userId }); // Delete all reviews written by the client
      await Application.deleteMany({ project: { $in: projectIds } }); // Delete all applications for the client's projects
    } else if (userRole === "student") {
      await Review.deleteMany({ reviewee: userId }); // Delete all reviews written for the student
      await Application.deleteMany({ student: userId }); // Delete all applications made by the student
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Delete user error:", error);
    return res.status(500).json({ message: "Server error during user deletion" });
  }
}

async function handleToggleBlockUser(req, res) {
  try {
    const { id: userId } = req.params;
    const { _id: adminId } = req.user;

    // === Validate mongoDB ObjectId ===
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "User not found" });
    }

    // === Fetch user from DB ===
    const dbUser = await User.findById(userId).lean();
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const { action } = req.body; // "block" or "unblock"

    // === Validate action ===
    if (!["block", "unblock"].includes(action)) {
      return res
        .status(400)
        .json({ message: "Invalid action. Must be 'block' or 'unblock'" });
    }

    // === Prevent blocking/unblocking self (admin) ===
    if (userId.toString() === adminId.toString()) {
      return res.status(403).json({ message: "Cannot modify block status for yourself" });
    }

    // === Determine current block status and desired action ===
    const isCurrentlyBlocked = dbUser.isBlocked;
    const shouldBlock = action === "block";

    // === Check if the action is redundant ===
    if (shouldBlock && isCurrentlyBlocked) {
      return res.status(400).json({ message: "User is already blocked" });
    }
    if (!shouldBlock && !isCurrentlyBlocked) {
      return res.status(400).json({ message: "User is not blocked" });
    }

    // === Perform the update ===
    await User.findByIdAndUpdate(userId, { isBlocked: shouldBlock }, { new: true });

    // === If blocking, clean up related data ===
    if (shouldBlock) {
      if (dbUser.role === "student") {
        // Reject all pending applications for the student
        await Application.updateMany(
          { student: userId, status: "pending" },
          { status: "suspended" }
        );
      }

      // If blocking a client, cancel all open/in-progress projects
      if (dbUser.role === "client") {
        // Delete all applications for the client's projects
        const projects = await Project.find({
          createdBy: userId,
          status: { $in: ["open", "in-progress"] },
        });
        const projectIds = projects.map(project => project._id);

        // Suspend all applications for the client's projects
        await Application.updateMany(
          { project: { $in: projectIds } },
          { status: "suspended" }
        );

        // Cancel all open/in-progress projects
        await Project.updateMany(
          {
            createdBy: dbUser._id,
            status: { $in: ["open", "in-progress"] },
          },
          { status: "cancelled" }
        );
      }
    }

    return res
      .status(200)
      .json({ message: `User ${shouldBlock ? "blocked" : "unblocked"} successfully.` });
  } catch (err) {
    console.error("Error toggling block status:", err);
    return res
      .status(500)
      .json({ message: "Server error while toggling user block status." });
  }
}

module.exports = {
  handleRegisterUser,
  handleLoginUser,
  handleGetUserProfile,
  handleUpdateUserProfile,
  handleDeleteUser,
  handleToggleBlockUser,
};
