const express = require("express");
const { authenticateToken, authorize } = require("../middlewares/auth");
const cos = require("../cosmos0-1");

const router = express.Router();

const debugLog = (message, data = null) => {
  console.log(`🔹 DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : "");
};

// Create a Team
router.post("/", authenticateToken, async (req, res) => {
  try {
    debugLog("Received request to create team", req.body);
    const { name, description } = req.body;
    const userId = req.user.id;

    debugLog("Authenticated User", { userId, role: req.user.role });

    const team = {
      id: crypto.randomUUID(),
      name,
      description,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      members: [userId],
      roles: { [userId]: "admin" }
    };

    debugLog("Saving team to database", team);
    await cos.createFamilyItem("testdb", "teams", team);

    res.status(201).json({ message: "Team created successfully", team });
  } catch (error) {
    console.error("❌ Error creating team:", error);
    res.status(500).json({ error: "Failed to create team" });
  }
});

// Get All Teams
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    debugLog("Fetching teams for user", { userId });

    const query = `SELECT * FROM c WHERE ARRAY_CONTAINS(c.members, "${userId}") OR c.createdBy = "${userId}"`;
    debugLog("CosmosDB Query", { query });

    const teams = await cos.queryItems("testdb", "teams", query);
    debugLog("Teams Retrieved", teams);

    res.status(200).json(teams);
  } catch (error) {
    console.error("❌ Error fetching teams:", error);
    res.status(500).json({ error: "Failed to fetch teams" });
  }
});

module.exports = { router };
