const Project = require("../models/project");
const User = require("../models/user"); // Import User model
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
    // 1. First validate the requesting user exists
    if (!req.user?._id) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // 2. Handle single project request by ID
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
    // 3. Handle all projects request with role-based filtering
    let projects;
    if (user.role === "client") {
      // Clients only see their own projects
      projects = await Project.find({ clientId: req.user._id });
    } else if (user.role === "student") {
      // Students see open projects
      projects = await Project.find({ status: "open" });
    } else if (user.role === "admin") {
      // Admins see all projects
      projects = await Project.find();
    } else {
      return res.status(403).json({ message: "Unauthorized role." });
    }

    res.status(200).json(projects);
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ message: "Server error while fetching projects." });
  }
}







async function handleGetSpecificProject(req, res) {
  const { id } = req.params;

  // Validate project ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false,
      message: "Invalid project ID format." 
    });
  }

  try {
    // Find the project
    const project = await Project.findById(id).lean();
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: "Project not found." 
      });
    }

    // Authorization check
    const user = await User.findById(req.user._id);
    
    // Admin can access any project
    if (user.role === "admin") {
      return res.status(200).json({ 
        success: true,
        data: project 
      });
    }

    // Client can only access their own projects
    if (user.role === "client") {
      if (project.clientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ 
          success: false,
          message: "Unauthorized to access this project." 
        });
      }
      return res.status(200).json({ 
        success: true,
        data: project 
      });
    }

    // Student can only access open projects
    if (user.role === "student") {
      if (project.status !== "open") {
        return res.status(403).json({ 
          success: false,
          message: "Only open projects are visible to students." 
        });
      }
      return res.status(200).json({ 
        success: true,
        data: project 
      });
    }

    // Default deny for unknown roles
    return res.status(403).json({ 
      success: false,
      message: "Unauthorized role." 
    });

  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching project." 
    });
  }
}






async function handleUpdateSpecificProject(req, res) {
  const { id } = req.params;

  // Validate project ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false,
      message: "Invalid project ID format." 
    });
  }

  // Validate request body
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ 
      success: false,
      message: "Request body is missing or empty." 
    });
  }

  const { title, description, budget, deadline, requiredSkills, status } = req.body;

  try {
    // 1. Get the existing project
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: "Project not found." 
      });
    }

    // 2. Verify authorization
    const user = await User.findById(req.user._id);
    
    // Only allow client owners or admins to update
    if (user.role !== "admin" && project.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized to update this project." 
      });
    }

    // 3. Additional validations
    if (budget && (isNaN(budget) || budget < 0)) {
      return res.status(400).json({ 
        success: false,
        message: "Budget must be a positive number." 
      });
    }

    if (deadline && (isNaN(Date.parse(deadline)) || new Date(deadline) < new Date())) {
      return res.status(400).json({ 
        success: false,
        message: "Deadline must be a valid future date." 
      });
    }

    if (status && !["open", "in-progress", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid project status." 
      });
    }

    // 4. Prepare update data (prevent unwanted field updates)
    const updateData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(budget && { budget }),
      ...(deadline && { deadline }),
      ...(requiredSkills && { requiredSkills }),
      ...(status && { status })
    };

    // 5. Perform update
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Project updated successfully!",
      data: updatedProject
    });

  } catch (error) {
    console.error("Project update error:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({ 
      success: false,
      message: "Server error during project update." 
    });
  }
}




async function handleDeleteSpecificProject(req, res) {
  const { id } = req.params;

  // Validate project ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ 
      success: false,
      message: "Invalid project ID format." 
    });
  }

  try {
    // 1. Get the project first for authorization check
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: "Project not found." 
      });
    }

    // 2. Verify authorization
    const user = await User.findById(req.user._id);
    
    // Only allow client owners or admins to delete
    if (user.role !== "admin" && project.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: "Unauthorized to delete this project." 
      });
    }

    // 3. Perform deletion
    const deletedProject = await Project.findByIdAndDelete(id);

    res.status(200).json({ 
      success: true,
      message: "Project deleted successfully.",
      data: { id: deletedProject._id } 
    });

  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error while deleting project." 
    });
  }
}





async function handleDeleteSpecificProject(req, res) {
  const { id } = req.params;

  // Validate project ID format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid project ID format",
      error: "PROJECT_ID_INVALID"
    });
  }

  try {
    // First find the project to verify ownership
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
        error: "PROJECT_NOT_FOUND"
      });
    }

    // Verify requesting user is either:
    // 1. The client who owns the project, or
    // 2. An admin
    const isOwner = project.clientId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this project",
        error: "UNAUTHORIZED_ACCESS"
      });
    }

    // Perform deletion
    const deletedProject = await Project.findByIdAndDelete(id);

    // Verify deletion was successful
    if (!deletedProject) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete project",
        error: "DELETE_FAILED"
      });
    }

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
      data: {
        id: deletedProject._id,
        title: deletedProject.title
      }
    });

  } catch (error) {
    console.error("Delete project error:", error);
    
    // Handle specific error types
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID",
        error: "INVALID_ID_FORMAT"
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error while deleting project",
      error: "SERVER_ERROR"
    });
  }
}





module.exports = {
  handleCreateProject,
  handleGetProjects,
  handleGetSpecificProject,
  handleUpdateSpecificProject,
  handleDeleteSpecificProject,
};
