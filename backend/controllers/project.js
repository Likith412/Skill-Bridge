const Project = require("../models/project");
const mongoose = require("mongoose");

async function handleCreateProject(req, res) {
  if (!req.body) {
    return res.status(400).json({ message: "Request body is missing." });
  }

  const {
    title,
    description,
    budget,
    deadline,
    requiredSkills,
    status,
    clientId,
  } = req.body;

  if (!title || !description || !budget || !deadline || !clientId) {
    return res.status(400).json({
      message:
        "Title, description, budget, deadline, and client ID are required.",
    });
  }

  if (isNaN(budget)) {
    return res.status(400).json({ message: "Budget must be a valid number." });
  }

  if (isNaN(Date.parse(deadline))) {
    return res.status(400).json({ message: "Invalid deadline format." });
  }

  if (
    status &&
    !["open", "in-progress", "completed", "cancelled"].includes(status)
  ) {
    return res.status(400).json({ message: "Invalid project status." });
  }

  try {
    // Check if project with same title already exists
    const existingProject = await Project.findOne({ title });
    if (existingProject) {
      return res
        .status(400)
        .json({ message: "Project with this title already exists." });
    }

    // Create new project
    const resultProject = await Project.create({
      title,
      description,
      budget,
      deadline,
      requiredSkills: requiredSkills || [],
      status: status || "open",
      clientId,
    });

    res.status(201).json({
      message: "Project created successfully!",
      id: resultProject._id,
    });
  } catch (err) {
    console.log("Project creation error:", err);
    res.status(500).json({ message: "Server error during project creation." });
  }
}

async function handleGetProjects(req, res) {
  try {
    // Optional: Validate if filtering by id in query
    if (req.query.id) {
      if (!mongoose.Types.ObjectId.isValid(req.query.id)) {
        return res.status(400).json({ message: "Invalid project ID format." });
      }
      const project = await Project.findById(req.query.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found." });
      }
      return res.status(200).json([project]);
    }

    const projects = await Project.find();
    res.status(200).json(projects);
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ message: "Server error while fetching projects." });
  }
}

async function handleGetSpecificProject(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid project ID format." });
  }
  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }
    res.status(200).json(project);
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({ message: "Server error while fetching project." });
  }
}

async function handleUpdateSpecificProject(req, res) {
  if (!req.body) {
    return res.status(400).json({ message: "Request body is missing." });
  }

  const { title, description, budget, deadline, requiredSkills, status } = req.body;

  // Validate id
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid project ID format." });
  }

  // Basic field validations
  if (budget && isNaN(budget)) {
    return res.status(400).json({ message: "Budget must be a valid number." });
  }

  if (deadline && isNaN(Date.parse(deadline))) {
    return res.status(400).json({ message: "Invalid deadline format." });
  }

  if (status && !["open", "in-progress", "completed", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid project status." });
  }

  try {
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found." });
    }

    res.status(200).json({
      message: "Project updated successfully!",
      project: updatedProject,
    });
  } catch (err) {
    console.log("Project update error:", err);
    res.status(500).json({ message: "Server error during project update." });
  }
}

async function handleDeleteSpecificProject(req, res) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid project ID format." });
  }
  try {
    const deletedProject = await Project.findByIdAndDelete(id);
    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found." });
    }
    res.status(200).json({ message: "Project deleted successfully." });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ message: "Server error while deleting project." });
  }
}

module.exports = {
  handleCreateProject,
  handleGetProjects,
  handleGetSpecificProject,
  handleUpdateSpecificProject,
  handleDeleteSpecificProject,
};
