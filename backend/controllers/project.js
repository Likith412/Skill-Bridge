
const Project = require("../models/project");
const User = require("../models/user");
const mongoose = require("mongoose");

async function handleCreateProject(req, res) {
    if (!req.body) {
        return res.status(400).json({ message: "Request body is missing." });
    }
    const { title, description, budget, deadline, requiredSkills, status } = req.body;
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
        console.error("Create project error:", error);
        return res.status(500).json({ message: "Server error while creating project." });
    }
}

