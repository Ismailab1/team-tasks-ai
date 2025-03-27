const express = require('express');
const bcrypt = require('bcryptjs');
const authService = require('../services/authService');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all user routes
router.use(protect);

// @route  GET /api/users/:id
// @desc   Get user profile
// @access Private
router.get('/:id', async (req, res) => {
  try {
    // Check if user is requesting their own data or is an admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access this user data' });
    }
    
    const user = await authService.getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// @route  PUT /api/users/:id
// @desc   Update user profile
// @access Private
router.put('/:id', async (req, res) => {
  try {
    // Check if user is updating their own data or is an admin
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }
    
    const updatedUser = await authService.updateProfile(req.params.id, req.body);
    res.json({ user: updatedUser });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route  PUT /api/users/:id/password
// @desc   Change user password
// @access Private
router.put('/:id/password', async (req, res) => {
  try {
    // Check if user is changing their own password
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to change this password' });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }
    
    await authService.changePassword(req.params.id, { currentPassword, newPassword });
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @route  GET /api/users/:id/tasks
// @desc   Get user tasks
// @access Private
router.get('/:id/tasks', async (req, res) => {
  try {
    // In a real app, this would get tasks from a task service or database
    // For now, just return a mock success response
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
