const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Apply auth middleware to all report routes
router.use(protect);

// Get all reports
router.get('/', async (req, res) => {
  try {
    const container = req.database.container('reports');
    const userId = req.user.id;
    
    // Get all reports for teams the user is a member of
    const { resources: reports } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.created_by = @userId
          OR EXISTS(
            SELECT VALUE t FROM t IN @teamIds
            WHERE c.team_id = t
          )
        `,
        parameters: [
          { name: '@userId', value: userId },
          { name: '@teamIds', value: req.user.teamIds || [] }
        ]
      })
      .fetchAll();
    
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create report
router.post('/', async (req, res) => {
  try {
    const { content, team_id } = req.body;
    
    if (!content || !team_id) {
      return res.status(400).json({ message: 'Content and team_id are required' });
    }
    
    // Verify team membership
    const teamsContainer = req.database.container('teams');
    const { resources: teams } = await teamsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @teamId AND (ARRAY_CONTAINS(c.member_ids, @userId) OR c.created_by = @userId)",
        parameters: [
          { name: "@teamId", value: team_id },
          { name: "@userId", value: req.user.id }
        ]
      })
      .fetchAll();
    
    if (teams.length === 0) {
      return res.status(403).json({ message: 'Team not found or access denied' });
    }
    
    const container = req.database.container('reports');
    const now = new Date().toISOString();
    
    const newReport = {
      id: Date.now().toString(),
      content,
      team_id,
      created_by: req.user.id,
      created_at: now,
      updated_at: now
    };
    
    const { resource: createdReport } = await container.items.create(newReport);
    
    res.status(201).json(createdReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single report
router.get('/:id', async (req, res) => {
  try {
    const container = req.database.container('reports');
    const reportId = req.params.id;
    const userId = req.user.id;
    
    // Get report by ID where user has access
    const { resources: reports } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.id = @id
          AND (
            c.created_by = @userId
            OR EXISTS(
              SELECT VALUE t FROM t IN @teamIds
              WHERE c.team_id = t
            )
          )
        `,
        parameters: [
          { name: '@id', value: reportId },
          { name: '@userId', value: userId },
          { name: '@teamIds', value: req.user.teamIds || [] }
        ]
      })
      .fetchAll();
    
    if (reports.length === 0) {
      return res.status(404).json({ message: 'Report not found or access denied' });
    }
    
    res.status(200).json(reports[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update report (only creator can update)
router.put('/:id', async (req, res) => {
  try {
    const { content } = req.body;
    const container = req.database.container('reports');
    const reportId = req.params.id;
    
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }
    
    // Get report by ID
    const { resources: reports } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id AND c.created_by = @userId",
        parameters: [
          { name: "@id", value: reportId },
          { name: "@userId", value: req.user.id }
        ]
      })
      .fetchAll();
    
    if (reports.length === 0) {
      return res.status(404).json({ message: 'Report not found or you are not the creator' });
    }
    
    const report = reports[0];
    
    // Update report properties
    report.content = content;
    report.updated_at = new Date().toISOString();
    
    // Update report in DB
    const { resource: updatedReport } = await container.item(reportId).replace(report);
    
    res.status(200).json(updatedReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete report (only creator or team admin can delete)
router.delete('/:id', async (req, res) => {
  try {
    const container = req.database.container('reports');
    const reportId = req.params.id;
    
    // Get report by ID
    const { resources: reports } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: reportId }]
      })
      .fetchAll();
    
    if (reports.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    const report = reports[0];
    
    // Verify permission (creator or team admin)
    const teamsContainer = req.database.container('teams');
    const { resources: teams } = await teamsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @teamId AND (c.created_by = @userId OR EXISTS(SELECT VALUE m FROM m IN c.members WHERE m.id = @userId AND m.role = 'admin'))",
        parameters: [
          { name: "@teamId", value: report.team_id },
          { name: "@userId", value: req.user.id }
        ]
      })
      .fetchAll();
    
    // Allow report creator or team admin to delete
    if (teams.length === 0 && report.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You must be report creator or team admin' });
    }
    
    // Delete report
    await container.item(reportId).delete();
    
    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get team reports
router.get('/team/:teamId', async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const userId = req.user.id;
    
    // Verify team access
    const teamsContainer = req.database.container('teams');
    const { resources: teams } = await teamsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @teamId AND (ARRAY_CONTAINS(c.member_ids, @userId) OR c.created_by = @userId)",
        parameters: [
          { name: "@teamId", value: teamId },
          { name: "@userId", value: userId }
        ]
      })
      .fetchAll();
    
    if (teams.length === 0) {
      return res.status(403).json({ message: 'Team not found or access denied' });
    }
    
    // Get reports for the team
    const reportsContainer = req.database.container('reports');
    const { resources: reports } = await reportsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.team_id = @teamId ORDER BY c.created_at DESC",
        parameters: [{ name: "@teamId", value: teamId }]
      })
      .fetchAll();
    
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
