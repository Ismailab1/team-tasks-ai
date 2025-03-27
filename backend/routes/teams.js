const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Local database path for teams
const teamsDir = path.join(__dirname, '../local-db/teams');
// Ensure teams directory exists
if (!fs.existsSync(teamsDir)) {
  fs.mkdirSync(teamsDir, { recursive: true });
}

// Get all teams for a user
router.get('/', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;
    
    // Read team files
    const teamFiles = fs.readdirSync(teamsDir);
    const teams = teamFiles
      .map(file => JSON.parse(fs.readFileSync(path.join(teamsDir, file), 'utf8')))
      .filter(team => team.members.includes(userId) || team.ownerId === userId);
    
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Error fetching teams' });
  }
});

// Create a new team
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;
    
    if (!name) {
      return res.status(400).json({ message: 'Team name is required' });
    }
    
    // Create team object
    const teamId = Date.now().toString();
    const team = {
      id: teamId,
      name,
      description: description || '',
      ownerId: userId,
      members: [userId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save team to file
    fs.writeFileSync(
      path.join(teamsDir, `${teamId}.json`),
      JSON.stringify(team, null, 2)
    );
    
    res.status(201).json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Error creating team' });
  }
});

// Get a specific team
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.id;
    
    const teamPath = path.join(teamsDir, `${teamId}.json`);
    
    if (!fs.existsSync(teamPath)) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
    
    // Check if user is member or owner
    if (!team.members.includes(userId) && team.ownerId !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this team' });
    }
    
    res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ message: 'Error fetching team' });
  }
});

// Update a team
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const teamId = req.params.id;
    const { name, description, members } = req.body;
    const userId = req.user.id;
    
    const teamPath = path.join(teamsDir, `${teamId}.json`);
    
    if (!fs.existsSync(teamPath)) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
    
    // Check if user is owner
    if (team.ownerId !== userId) {
      return res.status(403).json({ message: 'Only team owner can update team' });
    }
    
    // Update team
    const updatedTeam = {
      ...team,
      name: name || team.name,
      description: description !== undefined ? description : team.description,
      members: members || team.members,
      updatedAt: new Date().toISOString()
    };
    
    // Save updated team
    fs.writeFileSync(
      teamPath,
      JSON.stringify(updatedTeam, null, 2)
    );
    
    res.json(updatedTeam);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ message: 'Error updating team' });
  }
});

// Delete a team
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const teamId = req.params.id;
    const userId = req.user.id;
    
    const teamPath = path.join(teamsDir, `${teamId}.json`);
    
    if (!fs.existsSync(teamPath)) {
      return res.status(404).json({ message: 'Team not found' });
    }
    
    const team = JSON.parse(fs.readFileSync(teamPath, 'utf8'));
    
    // Check if user is owner
    if (team.ownerId !== userId) {
      return res.status(403).json({ message: 'Only team owner can delete team' });
    }
    
    // Delete team file
    fs.unlinkSync(teamPath);
    
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ message: 'Error deleting team' });
  }
});

module.exports = router;
