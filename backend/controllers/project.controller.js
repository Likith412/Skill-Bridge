const mongoose = require("mongoose");

const Project = require("../models/project.model");
const Review = require("../models/review.model");

const { validateProjectInput } = require("../validators/project.validator");

async function handleCreateProject(req, res) {
  if (!req.body) {
    return res.status(400).json({ message: "Request body is missing" });
  }

  const { _id: currentUserId } = req.user;

  // === Validations ===
  const { error, numericBudget, parsedDeadline } = await validateProjectInput(
    req.body,
    currentUserId
  );

  if (error) return res.status(400).json({ message: error });

  const { title, description, requiredSkills, status } = req.body;

  try {
    // === Project creation ===
    const resultProject = await Project.create({
      title,
      description,
      budget: numericBudget,
      deadline: parsedDeadline,
      requiredSkills,
      status,
      createdBy: currentUserId,
    });

    // === Return success response ===
    return res.status(201).json({
      message: "Project created successfully",
      projectId: resultProject._id,
    });
  } catch (error) {
    console.log("Create project error:", error);
    return res.status(500).json({ message: "Server error while creating project" });
  }
}

async function handleGetProjects(req, res) {
  try {
    const { status, skills, minBudget, maxBudget, beforeDeadline, afterDeadline } =
      req.query;

    const { role, _id: currentUserId } = req.user;

    const filter = {};

    // === Role-based access ===
    if (role === "client") {
      filter.createdBy = currentUserId; // updated here
    } else if (role === "student") {
      if (status && status !== "open") {
        return res.status(403).json({ message: "Students can only view open projects" });
      }
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
      const skillsArray = skills.split(",").map(skill => skill.trim());
      filter.requiredSkills = { $all: skillsArray };
    }

    // === Budget validations ===
    if (minBudget && isNaN(Number(minBudget))) {
      return res.status(400).json({ message: "minBudget must be a valid number" });
    }

    if (maxBudget && isNaN(Number(maxBudget))) {
      return res.status(400).json({ message: "maxBudget must be a valid number" });
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
        return res.status(400).json({ message: "beforeDeadline must be a valid date" });
      }
      filter.deadline = { ...(filter.deadline || {}), $lte: date };
    }

    if (afterDeadline) {
      const date = new Date(afterDeadline);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: "afterDeadline must be a valid date" });
      }
      filter.deadline = { ...(filter.deadline || {}), $gte: date };
    }

    // === Fetch projects sorted by newest first ===
    const projects = await Project.find(filter, { updatedAt: 0 })
      .populate({
        path: "createdBy",
        select: "clientProfile.orgName clientProfile.orgLogoUrl",
      })
      .sort({ createdAt: -1 }) // newest first
      .lean();

    return res.status(200).json({ message: "Projects fetched successfully", projects });
  } catch (error) {
    console.log("Error fetching projects:", error);
    return res.status(500).json({ error: "Server error while fetching projects" });
  }
}

async function handleGetSpecificProject(req, res) {
  const { id: projectId } = req.params;

  // === Validate MongoDB ObjectId ===
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(404).json({ message: "Project not found" });
  }

  try {
    // === Fetch project ===
    const projectDoc = await Project.findById(projectId, { updatedAt: 0 })
      .populate({
        path: "createdBy",
        select: "clientProfile.orgName clientProfile.orgLogoUrl",
      })
      .lean();

    if (!projectDoc) {
      return res.status(404).json({ message: "Project not found" });
    }

    // === If the user is a client, check if they are the owner of the project ===
    const { _id: currentUserId, role } = req.user;
    if (role === "client") {
      const isOwner = projectDoc.createdBy._id.toString() === currentUserId.toString();
      if (!isOwner) {
        return res.status(403).json({ message: "Not Authorized" });
      }
    }

    // === If project is completed, fetch reviews ===
    if (projectDoc.status === "completed") {
      const reviews = await Review.find(
        { project: projectId },
        { _id: 1, rating: 1, comment: 1, createdAt: 1 }
      )
        .populate({
          path: "reviewee",
          select: "username studentProfile.fullName studentProfile.profileImageUrl",
        })
        .lean();

      projectDoc.reviews = reviews;
    }

    // === Return success response ===
    return res.status(200).json({ message: "Project found", project: projectDoc });
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
    return res.status(404).json({ message: "Project not found" });
  }

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // === Check if the logged-in user is the owner of the project ===
    const { _id: currentUserId } = req.user;
    const { createdBy } = project;
    const isOwner = createdBy.toString() === currentUserId.toString();

    if (!isOwner) {
      return res.status(403).json({ message: "Not Authorized" });
    }

    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing" });
    }

    // === validations ===
    const { error, numericBudget, parsedDeadline } = await validateProjectInput(
      req.body,
      currentUserId,
      id
    );

    if (error) return res.status(400).json({ message: error });

    const { title, description, requiredSkills, status } = req.body;

    const updatedData = {
      title,
      description,
      budget: numericBudget,
      deadline: parsedDeadline,
      requiredSkills,
      status,
    };

    await Project.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    return res.status(200).json({
      message: "Project updated successfully",
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
    return res.status(404).json({ message: "Project not found" });
  }

  try {
    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // === Check if the logged-in user is the owner of the project ===
    const { _id: currentUserId } = req.user;
    const { createdBy } = project;
    const isOwner = createdBy.toString() === currentUserId.toString();

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
