const mongoose = require("mongoose");
const Application = require("../models/application.model");
const Project = require("../models/project.model");
const cloudinary = require("../configs/cloudinary.config");
const fs = require("fs");

const createApplication = async (req, res) => {
  try {
    const { projectId } = req.body;
    const studentId = req.user._id;

    // 1. Validate projectId format
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid project ID format" });
    }

    // 2. Ensure project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // 3. Ensure resume file is present (middleware silently drops bad files)
    if (!req.file) {
      return res.status(400).json({ message: "Resume must be a PDF and under 5MB" });
    }

    // 4. Check if already applied
    const existing = await Application.findOne({ projectId, studentId });
    if (existing) {
      if (existing.status === "approved") {
        return res.status(400).json({ message: "You are already approved for this project." });
      }
      return res.status(400).json({ message: "You have already applied to this project." });
    }

    // 5. Upload to Cloudinary
    const cloudinaryUpload = await cloudinary.uploader.upload(req.file.path, {
      folder: "resumes",
      resource_type: "raw",
    });

    // 6. Check if upload succeeded
    if (!cloudinaryUpload || !cloudinaryUpload.secure_url) {
      fs.unlinkSync(req.file.path); // Clean up local file
      return res.status(500).json({ message: "Resume upload failed" });
    }

    fs.unlinkSync(req.file.path); // Clean up local file after successful upload

    // 7. Create application
    const application = await Application.create({
      projectId,
      studentId,
      resume: cloudinaryUpload.secure_url,
      status: "pending",
    });

    return res.status(201).json(application);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};



// 2. Delete Application (Student)
const deleteApplication = async (req, res) => {
  try {
    const applicationId = req.params.id;

    // 1. Validate application ID format
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application ID format" });
    }

    // 2. Check if application exists
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // 3. Check if user is the owner (student)
    if (application.studentId.toString() !== req.user._id) {
      return res.status(403).json({ message: "Not authorized to delete this application" });
    }

    // 4. Delete application
    await application.deleteOne();

    res.json({ message: "Application deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//3 accept application

const acceptApplication = async (req, res) => {
  try {
    const applicationId = req.params.id;

    // 1. Validate application ID format
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return res.status(400).json({ message: "Invalid application ID format" });
    }

    // 2. Check if application exists
    const application = await Application.findById(applicationId).populate("projectId");
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // 3. Ensure project exists and has `createdBy` field
    if (!application.projectId || !application.projectId.createdBy) {
      return res.status(500).json({ message: "Project data is incomplete" });
    }

    // 4. Check if current user is the project owner (client)
    const projectOwnerId = application.projectId.createdBy.toString();
    if (projectOwnerId !== req.user._id) {
      return res.status(403).json({ message: "Not authorized to accept this application" });
    }

    // 5. Prevent re-approving already approved
    if (application.status === "approved") {
      return res.status(400).json({ message: "Application is already approved" });
    }

    // 6. Approve the application
    application.status = "approved";
    await application.save();

    res.json({ message: "Application approved successfully", application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {createApplication,deleteApplication,acceptApplication}
