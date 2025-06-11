const Project = require("../models/project.model");

// currentProjectId is only provided during update operations
async function validateProjectInput(data, userId, currentProjectId = null) {
  const { title, description, budget, deadline, requiredSkills, status } = data;

  // === Basic field validations ===
  if (!title || !description || !budget || !deadline || !status) {
    return {
      error: "Title, description, budget, deadline, and status are required",
    };
  }

  // === Budget ===
  const numericBudget = Number(budget);
  if (isNaN(numericBudget) || numericBudget <= 0) {
    return { error: "Budget must be a valid positive number" };
  }

  // === Deadline ===
  const parsedDeadline = new Date(deadline);
  if (isNaN(parsedDeadline.getTime())) {
    return { error: "Invalid deadline date" };
  }
  if (parsedDeadline <= new Date()) {
    return { error: "Deadline must be a future date" };
  }

  // === Skills ===
  if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) {
    return { error: "Required skills must be a non-empty array" };
  }

  // === Status ===
  const allowedStatus = ["open", "in-progress", "completed", "cancelled"];
  if (!allowedStatus.includes(status)) {
    return { error: "Invalid status value" };
  }

  // === Duplicate check ===
  const query = { title, createdBy: userId };
  if (currentProjectId) {
    // Exclude the current project from duplicate title check during update
    query._id = { $ne: currentProjectId };
  }

  const existing = await Project.findOne(query);

  if (existing) {
    return { error: "Project with this title already exists for your account" };
  }

  return { numericBudget, parsedDeadline };
}

module.exports = { validateProjectInput };
