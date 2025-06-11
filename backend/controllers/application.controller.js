const mongoose = require("mongoose");

const Application = require("../models/application.model");
const Project = require("../models/project.model");
const { streamUpload } = require("../utils/fileUpload");
const cloudinary = require("../configs/cloudinary.config");
const User = require("../models/user.model");


const handleCreateApplication = async (req, res) => {
  const { projectId } = req.body;
  const { _id: studentId } = req.user;

  // === Validate MongoDB ObjectId ===
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ message: "Invalid project ID format" });
  }

  try {
    // === Ensure project exists ===
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // === Check if already applied ===
    const existing = await Application.findOne({ projectId, studentId });
    if (existing) {
      let invalidMsg = "";
      if (existing.status === "approved") {
        invalidMsg = "Your application for this project has already been approved";
      } else if (existing.status === "rejected") {
        invalidMsg = "Your application for this project was rejected";
      } else {
        invalidMsg =
          "You have already applied for this project and your application is pending";
      }
      return res.status(400).json({ message: invalidMsg });
    }

    // Ensure resume file is present (middleware silently drops bad files)
    if (!req.file) {
      return res.status(400).json({ message: "Resume must be a PDF and under 5MB" });
    }

    // === Upload to Cloudinary ===
    const cloudinaryUpload = await streamUpload(req.file.buffer, {
      folder: "skillbridge/resumes",
      resource_type: "raw",
    });

    // === Create application ===
    const resultApplication = await Application.create({
      projectId,
      studentId,
      resume: cloudinaryUpload.secure_url,
      status: "pending",
    });

    return res.status(201).json({
      message: "Application created successfully",
      applicationId: resultApplication._id,
    });
  } catch (err) {
    console.log("Create application error: ", err);
    return res.status(500).json({ message: "Server error while creating application" });
  }
};

const handleDeleteApplication = async (req, res) => {
  const { id: applicationId } = req.params;

  // === Validate MongoDB ObjectId ===
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    return res.status(404).json({ message: "Application not found" });
  }

  try {
    // === Ensure application exists ===
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // === Check if user is the owner (student) ===
    const { _id: currentUserId } = req.user;
    if (application.studentId.toString() !== currentUserId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this application" });
    }

    // === Delete application ===

    // Extract public_id from Cloudinary URL
    const cloudinaryUrl = application.resume;
    console.log(cloudinaryUrl);
    const parts = cloudinaryUrl.split("/");
    const filename = parts[parts.length - 1];
    const publicId = `skillbridge/resumes/${filename.split(".")[0]}`;

    // Delete file from cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Delete application from DB
    await Application.findByIdAndDelete(applicationId);

    res.status(200).json({ message: "Application deleted successfully" });
  } catch (err) {
    console.log("Delete application error: ", err);
    res.status(500).json({ message: "Server error during deletion" });
  }
};

const handleUpdateApplicationStatus = async (req, res) => {
  const { id: applicationId } = req.params;
  const { status } = req.body;

  // === Validate MongoDB ObjectId ===
  if (!mongoose.Types.ObjectId.isValid(applicationId)) {
    return res.status(404).json({ message: "Application not found" });
  }

  // === Validate status ===
  const allowedStatuses = ["approved", "pending", "rejected"];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid application status" });
  }

  try {
    // === Ensure application exists ===
    const application = await Application.findById(applicationId).populate("projectId");
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // === Ensure only the project owner (client) can update ===
    const projectOwnerId = application.projectId.createdBy;
    const { _id: currentUserId } = req.user;
    if (projectOwnerId.toString() !== currentUserId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this application" });
    }

    // Allow status update only if project is 'open'
    if (application.projectId.status !== "open") {
      return res
        .status(400)
        .json({ message: "Cannot change application status. Project is not open" });
    }

    // Avoid re-updating with the same status
    if (application.status === status) {
      return res.status(400).json({ message: `Application is already ${status}` });
    }

    // === Update application status ===
    const updatedApplication = await Application.findByIdAndUpdate(
      applicationId,
      { status },
      { new: true }
    );

    res.json({
      message: `Application ${status} successfully`,
      application: updatedApplication,
    });
  } catch (err) {
    console.error("Update application status error:", err);
    res.status(500).json({ message: "Server error while updating application status" });
  }
};

const handleGetMyApplications = async (req, res) => {
  const studentId = req.user._id;

  try {
    // Ensure the user exists and is a student
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(401).json({ message: "User not found" });
    }

    if (student.role !== "student") {
      return res.status(403).json({ message: "Only students can access their applications" });
    }

    const applications = await Application.find({ studentId })
      .populate({
        path: "projectId",
        select: "title description status",
      })
      .sort({ createdAt: -1 });

    if (!applications || applications.length === 0) {
      return res.status(404).json({ message: "No applications found for this student" });
    }

    return res.status(200).json({ applications });
  } catch (err) {
    console.error("Get my applications error:", err);
    return res.status(500).json({ message: "Server error fetching applications" });
  }
};




const handleGetApplicationsByProject = async (req, res) => {
  const { projectId } = req.params;
  const currentUserId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ message: "Invalid project ID" });
  }

  try {
    // Check if user exists and get role
    const user = await User.findById(currentUserId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Authorization: either project owner or admin
    const isOwner = project.createdBy.toString() === currentUserId.toString();
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Not authorized to view applications for this project",
      });
    }

    const applications = await Application.find({ projectId })
      .populate({
        path: "studentId",
        select: "name email phone college",
      })
      .sort({ createdAt: -1 });

    if (!applications || applications.length === 0) {
      return res.status(404).json({
        message: "No applications submitted for this project",
      });
    }

    return res.status(200).json({ projectTitle: project.title, applications });
  } catch (err) {
    console.error("Get applications by project error:", err);
    return res.status(500).json({ message: "Server error fetching applications" });
  }
};




module.exports = {
  handleCreateApplication,
  handleDeleteApplication,
  handleUpdateApplicationStatus,
  handleGetMyApplications,
  handleGetApplicationsByProject
};
