const Project = require("../models/project");
const User = require("../models/user");
const mongoose = require("mongoose");

async function handleCreateProject(req, res) {
  if (!req.body) {
    return res.status(400).json({ message: "Request body is missing." });
  }
  const { title, description, budget, deadline, requiredSkills, status } =
    req.body;
  const clientId = req.user._id;

  // === Basic Field validations ===
  if (!title || !description || !budget || !deadline) {
    return res.status(400).json({
      message: "Title, description, budget, and deadline are required.",
    });
  }

  // === Budget validation ===
  if (isNaN(budget) || budget <= 0) {
    return res
      .status(400)
      .json({ message: "Budget must be a valid positive number." });
  }

  // === Date Validation ===
  const parsedDeadline = new Date(deadline); // Convert string to Date object
  if (isNaN(parsedDeadline.getTime())) {
    // Validate it's a real date
    return res.status(400).json({ message: "Invalid deadline date." });
  }
  if (parsedDeadline <= new Date()) {
    // Ensure it's a future date
    return res.status(400).json({ message: "Deadline must be a future date." });
  }

  // === Status validation ===
  if (
    status &&
    !["open", "in-progress", "completed", "cancelled"].includes(status)
  ) {
    return res.status(400).json({ message: "Invalid status value." });
  }

  // === Uniqueness check ===
  const existingProject = await Project.findOne({ title, clientId });
  if (existingProject) {
    return res.status(400).json({
      message: "Project with this title already exists for your account.",
    });
  }

  // === Project creation ===
  try {
    const resultProject = await Project.create({
      title,
      description,
      budget,
      deadline: parsedDeadline,
      requiredSkills,
      status: status || "open",
      clientId,
    });
    return res.status(201).json(resultProject);
  } catch (error) {
    console.log("Create project error:", error);
    return res
      .status(500)
      .json({ message: "Server error while creating project." });
  }
}

// Need some changes in handleGetProjects
async function handleGetProjects(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const { id } = req.params;
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "project not found" });
      }

      const project = await Project.findById(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found." });
      }

      return res.status(200).json([project]);
    }

    // Base filters
    const { status, category, title } = req.query;
    const filters = {};

    if (status) filters.status = status;
    if (category) filters.category = category;
    if (title) filters.title = new RegExp(title, "i"); // case-insensitive search

    // Role-based restrictions
    if (user.role === "client") {
      filters.clientId = req.user._id;
    } else if (user.role === "student") {
      filters.status = "open"; // students can only see open projects
    } else if (user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized role." });
    }

    const projects = await Project.find(filters);
    return res.status(200).json(projects);
  } catch (error) {
    console.error("Get projects error:", error);
    return res
      .status(500)
      .json({ message: "Server error while fetching projects." });
  }
}

async function handleGetSpecificProject(req, res) {
  const { id } = req.params;

  // === Validate MongoDB ObjectId ===
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Project not found" });
  }

  try {
    const project = await Project.findById(id).lean();

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res
      .status(200)
      .json({ message: "Project found", projectDetails: project });
  } catch (error) {
    console.log("Get specific project error:", error);
    return res
      .status(500)
      .json({ message: "Server error while fetching specific project" });
  }
}

async function handleDeleteSpecificProject(req, res) {
  const { id } = req.params;

  // === Validate MongoDB ObjectId ===
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Project not found" });
  }

  try {
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isOwner = project.clientId.toString() === req.user._id.toString();

    if (!isOwner) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    await Project.findByIdAndDelete(id);
    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.log("Delete error:", error);
    return res.status(500).json({ message: "Server error during deletion" });
  }
}

async function handleUpdateSpecificProject(req, res) {
  const { id } = req.params;

  // === Validate MongoDB ObjectId ===
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Project not found" });
  }

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isOwner = project.clientId.toString() === req.user._id.toString();

    if (!isOwner) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    const { ...newData } = req.body;

    const updatedProject = await Project.findByIdAndUpdate(id, newData);

    return res
      .status(200)
      .json({ message: "Project updated successfully", updatedProject });
  } catch (error) {
    console.log("Update error:", error);
    return res.status(500).json({ message: "Server error during update" });
  }
}

module.exports = {
  handleCreateProject,
  handleGetProjects,
  handleGetSpecificProject,
  handleUpdateSpecificProject,
  handleDeleteSpecificProject,
};
