const express = require("express");
const { authenticateToken } = require("../middlewares/auth");
const { upload } = require("../middlewares/upload");
const cos = require("../cosmos0-1");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// 🔹 POST /tasks - Create a Task
router.post("/", authenticateToken, upload.single("taskImage"), async (req, res) => {
  try {
    console.log("📢 POST /tasks route hit");
    console.log("🔹 Request Body:", req.body);
    console.log("🔹 Authenticated User:", req.user);

    const { teamId, title, description, status, assignedTo, dueDate } = req.body;

    // Check if teamId is provided
    if (!teamId) {
      console.error("❌ Missing teamId in request body.");
      return res.status(400).json({ error: "teamId is required" });
    }

    console.log("🔹 Fetching team by ID:", teamId);
    const teams = await cos.queryItems("testdb", "teams", `SELECT * FROM c WHERE c.id = "${teamId}"`);
    console.log("🔹 Team Query Result:", teams);

    if (teams.length === 0) {
      console.error("❌ Team not found for ID:", teamId);
      return res.status(404).json({ error: "Team not found" });
    }

    const team = teams[0];
    console.log("🔹 Checking permissions for:", req.user.id, "against team members:", team.members);

    if (!team.members.includes(req.user.id) && team.createdBy !== req.user.id && req.user.role !== "admin") {
      console.error("❌ User lacks permissions:", req.user.id);
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const ctime = Date.now();
    const taskImage = req.file ? `/uploads/${req.file.filename}` : null;

    const task = {
      id: crypto.randomUUID(),
      teamId,
      title,
      description,
      taskImage,
      status: status || "pending",
      assignedTo,
      createdBy: req.user.id,
      createdAt: ctime,
      updatedAt: ctime,
      dueDate: dueDate ? new Date(dueDate).getTime() : null,
    };

    console.log("💾 Saving task to database:", task);
    await cos.createFamilyItem("testdb", "tasks", task);

    res.status(201).json({ message: "Task added successfully", task });
  } catch (error) {
    console.error("❌ Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// 🔹 GET /tasks/team/:teamId - Get Tasks for a Team
router.get("/team/:teamId", authenticateToken, async (req, res) => {
  try {
    console.log("📢 GET /tasks/team/:teamId called");
    const { teamId } = req.params;

    if (!teamId) {
      console.error("❌ Missing teamId in request params.");
      return res.status(400).json({ error: "teamId is required" });
    }

    console.log("🔹 Fetching team by ID:", teamId);
    const teams = await cos.queryItems("testdb", "teams", `SELECT * FROM c WHERE c.id = "${teamId}"`);
    if (teams.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }

    const team = teams[0];
    if (!team.members.includes(req.user.id) && team.createdBy !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    console.log("🔹 Fetching tasks for team:", teamId);
    const tasks = await cos.tasksByCreatedDate("testdb", "tasks", teamId);
    console.log("🔹 Tasks Retrieved:", tasks.length);
    
    res.status(200).json(tasks);
  } catch (error) {
    console.error("❌ Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// 🔹 GET /tasks/:id - Get a Task by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📢 GET /tasks/:id called with Task ID:", id);

    const tasks = await cos.queryItems("testdb", "tasks", `SELECT * FROM c WHERE c.id = "${id}"`);
    console.log("🔹 Task Query Result:", tasks);

    if (tasks.length === 0) {
      console.error("❌ Task not found:", id);
      return res.status(404).json({ error: "Task not found" });
    }

    const task = tasks[0];
    console.log("🔹 Found Task:", task);

    res.status(200).json(task);
  } catch (error) {
    console.error("❌ Error fetching task:", error);
    res.status(500).json({ error: "Failed to fetch task" });
  }
});

// 🔹 GET /tasks/file/:id - Get Task File
router.get("/file/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📢 GET /tasks/file/:id called with Task ID:", id);

    const tasks = await cos.queryItems("testdb", "tasks", `SELECT * FROM c WHERE c.id = "${id}"`);
    if (tasks.length === 0 || !tasks[0].taskImage) {
      return res.status(404).json({ error: "File not found" });
    }

    const task = tasks[0];
    console.log("🔹 Found Task for File:", task);

    const teams = await cos.queryItems("testdb", "teams", `SELECT * FROM c WHERE c.id = "${task.teamId}"`);
    if (teams.length === 0) {
      return res.status(404).json({ error: "Team not found" });
    }

    const team = teams[0];
    if (!team.members.includes(req.user.id) && team.createdBy !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    const filePath = path.join(__dirname, task.taskImage);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    console.log("📢 Sending File:", filePath);
    res.sendFile(filePath);
  } catch (error) {
    console.error("❌ Error retrieving file:", error);
    res.status(500).json({ error: "Failed to retrieve file" });
  }
});

module.exports = { router };
