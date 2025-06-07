const Project = require("../models/project");
const User = require("../models/user");
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
  } = req.body;

  // Get clientId from authenticated user instead of request body
  const clientId = req.user._id;

  if (!title || !description || !budget || !deadline) {
    return res.status(400).json({
      message: "Title, description, budget, and deadline are required.",
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
    // Verify the user exists and is a client
    const user = await User.findById(clientId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (user.role !== "client") {
      return res.status(403).json({ message: "Only clients can create projects." });
    }

    // Check if project with same title already exists for this client
    const existingProject = await Project.findOne({ title, clientId });
    if (existingProject) {
      return res
        .status(400)
        .json({ message: "Project with this title already exists for your account." });
    }

    // Create new project
    const resultProject = await Project.create({
      title,
      description,
      budget,
      deadline,
      requiredSkills: requiredSkills || [],
      status: status || "open",
      clientId, // Now using the authenticated user's ID
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
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    
    const { id } = req.params;
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid project ID format." });
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
    if (title) filters.title = new RegExp(title, 'i'); // case-insensitive search

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
    return res.status(500).json({ message: "Server error while fetching projects." });
  }
}




async function handleGetSpecificProject(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ 
      message: "Invalid project ID format" 
    });
  }

  try {
    const project = await Project.findById(id).lean();
    
    if (!project) {
      return res.status(404).json({ 
        message: "Project not found" 
      });
    }

    return res.status(200).json(project);

  } catch (error) {
    console.error("Get project error:", error);
    return res.status(500).json({ 
      message: "Server error while fetching project" 
    });
  }
}




async function handleDeleteSpecificProject(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid project ID" });
  }

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isAdmin = req.user.role === 'admin';
    const isOwner = project.clientId.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    await Project.findByIdAndDelete(id);
    return res.status(204).end();

  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ message: "Server error during deletion" });
  }
}



// UPDATE Project
async function handleUpdateSpecificProject(req, res) {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid project ID" });
  }

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }


    const isAdmin = req.user.role === 'admin';
    const isOwner = project.clientId.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    const { clientId, ...updateData } = req.body;
    
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      updateData,

    );

    return res.status(200).json(updatedProject);

  } catch (error) {
    console.error("Update error:", error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: "Validation failed", errors });
    }

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
