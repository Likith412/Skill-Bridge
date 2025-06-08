const Project = require("../models/project");
const mongoose = require("mongoose");

async function handleCreateProject(req, res) {
  if (!req.body) {
    return res.status(400).json({ message: "Request body is missing" });
  }
  const { title, description, budget, deadline, requiredSkills, status } =
    req.body;
  const { _id: userId } = req.user;

  // === Basic Field validations ===
  if (!title || !description || !budget || !deadline || !status) {
    return res.status(400).json({
      message: "Title, description, budget, deadline, and status are required",
    });
  }

  // === Budget validation ===
  const numericBudget = Number(budget);
  if (isNaN(numericBudget) || numericBudget <= 0) {
    return res
      .status(400)
      .json({ message: "Budget must be a valid positive number" });
  }

  // === Date Validation ===
  const parsedDeadline = new Date(deadline); // Convert string to Date object
  if (isNaN(parsedDeadline.getTime())) {
    // Validate it's a real date
    return res.status(400).json({ message: "Invalid deadline date" });
  }
  if (parsedDeadline <= new Date()) {
    // Ensure it's a future date
    return res.status(400).json({ message: "Deadline must be a future date" });
  }

  // === Required skills validation ===
  if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) {
    return res.status(400).json({
      message: "Required skills must be a non-empty array",
    });
  }

  // === Status validation ===
  const allowedStatus = ["open", "in-progress", "completed", "cancelled"];
  if (!allowedStatus.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  // === Uniqueness check ===
  const existingProject = await Project.findOne({ title, clientId: userId });
  if (existingProject) {
    return res.status(400).json({
      message: "Project with this title already exists for your account",
    });
  }

  // === Project creation ===
  try {
    const resultProject = await Project.create({
      title,
      description,
      budget: numericBudget,
      deadline: parsedDeadline,
      requiredSkills,
      status,
      clientId: userId,
    });
    return res.status(201).json({
      message: "Project created successfully",
      projectId: resultProject._id,
    });
  } catch (error) {
    console.log("Create project error:", error);
    return res
      .status(500)
      .json({ message: "Server error while creating project" });
  }
}

async function handleGetProjects(req, res) {
  try {
    const {
      status,
      skills,
      minBudget,
      maxBudget,
      beforeDeadline,
      afterDeadline,
    } = req.query;

    const { role, _id: userId } = req.user;

    const filter = {};

    // === Role-based access ===
    if (role === "client") {
      filter.clientId = userId;
    } else if (role === "student") {
      filter.status = "open"; // Students can only view open projects
    }

    // === Validate status for non-student roles ===
    if (role !== "student" && status) {
      const allowedStatus = ["open", "in-progress", "completed", "cancelled"];
      if (!allowedStatus.includes(status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      filter.status = status;
    }

    // === Skills validation ===
    if (skills) {
      if (typeof skills !== "string") {
        return res
          .status(400)
          .json({ message: "Skills must be a comma-separated string" });
      }
      const skillsArray = skills.split(",").map((skill) => skill.trim());
      filter.requiredSkills = { $all: skillsArray };
    }

    // === Budget validations ===
    if (minBudget && isNaN(Number(minBudget))) {
      return res
        .status(400)
        .json({ message: "minBudget must be a valid number" });
    }

    if (maxBudget && isNaN(Number(maxBudget))) {
      return res
        .status(400)
        .json({ message: "maxBudget must be a valid number" });
    }

    if (minBudget || maxBudget) {
      filter.budget = {};
      if (minBudget) filter.budget.$gte = Number(minBudget);
      if (maxBudget) filter.budget.$lte = Number(maxBudget);
    }

    // === Deadline validations ===
    if (beforeDeadline) {
      const date = new Date(beforeDeadline);
      if (isNaN(date.getTime())) {
        return res
          .status(400)
          .json({ message: "beforeDeadline must be a valid date" });
      }
      filter.deadline = { ...(filter.deadline || {}), $lte: date };
    }

    if (afterDeadline) {
      const date = new Date(afterDeadline);
      if (isNaN(date.getTime())) {
        return res
          .status(400)
          .json({ message: "afterDeadline must be a valid date" });
      }
      filter.deadline = { ...(filter.deadline || {}), $gte: date };
    }

    // === Fetch projects ===
    const projects = await Project.find(filter).populate("clientId", "orgName");

    return res
      .status(200)
      .json({ message: "Projects fetched successfully", projects });
  } catch (error) {
    console.log("Error fetching projects:", error);
    return res
      .status(500)
      .json({ error: "Server error while fetching projects" });
  }
}

async function handleGetSpecificProject(req, res) {
  const { id } = req.params;

  // === Validate MongoDB ObjectId ===
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Project not found" });
  }

  try {
    // === Fetch project ===
    const project = await Project.findById(id).lean();

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    return res.status(200).json({ message: "Project found", project });
  } catch (error) {
    console.log("Get specific project error:", error);
    return res
      .status(500)
      .json({ message: "Server error while fetching specific project" });
  }
}

async function handleUpdateSpecificProject(req, res) {
  const { id } = req.params;

  // === Validate MongoDB ObjectId ===
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid project ID" });
  }

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // === Check if the logged-in user is the owner of the project ===
    const { _id: userId } = req.user;
    const { clientId } = project;
    const isOwner = clientId.toString() === userId.toString();

    if (!isOwner) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    const { title, description, budget, deadline, requiredSkills, status } =
      req.body;

    // === Basic Field validations ===
    if (!title || !description || !budget || !deadline || !status) {
      return res.status(400).json({
        message: "Title, description, budget, deadline and status are required",
      });
    }

    // === Budget validation ===
    const numericBudget = Number(budget);
    if (isNaN(numericBudget) || numericBudget <= 0) {
      return res
        .status(400)
        .json({ message: "Budget must be a valid positive number" });
    }

    // === Date Validation ===
    const parsedDeadline = new Date(deadline); // Convert string to Date object
    if (isNaN(parsedDeadline.getTime())) {
      // Validate it's a real date
      return res.status(400).json({ message: "Invalid deadline date" });
    }
    if (parsedDeadline <= new Date()) {
      // Ensure it's a future date
      return res
        .status(400)
        .json({ message: "Deadline must be a future date" });
    }

    // === Required skills validation ===
    if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return res.status(400).json({
        message: "Required skills must be a non-empty array",
      });
    }

    // === Status validation ===
    const allowedStatus = ["open", "in-progress", "completed", "cancelled"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // === Uniqueness check ===
    const existingProject = await Project.findOne({
      title,
      clientId: userId,
      _id: { $ne: id }, // Exclude current project
    });
    if (existingProject) {
      return res.status(400).json({
        message: "Project with this title already exists for your account",
      });
    }

    const updatedData = {
      title,
      description,
      budget: numericBudget,
      deadline: parsedDeadline,
      requiredSkills,
      status,
    };

    // === Perform update ===
    const updatedProject = await Project.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    return res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    console.log("Update error:", error);
    return res.status(500).json({ message: "Server error during update" });
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

    // === Check if the logged-in user is the owner of the project ===
    const { _id: userId } = req.user;
    const { clientId } = project;
    const isOwner = clientId.toString() === userId.toString();

    if (!isOwner) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    // === Project Deletion ===
    await Project.findByIdAndDelete(id);
    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.log("Delete error:", error);
    return res.status(500).json({ message: "Server error during deletion" });
  }
}

module.exports = {
  handleCreateProject,
  handleGetProjects,
  handleGetSpecificProject,
  handleUpdateSpecificProject,
  handleDeleteSpecificProject,
};
