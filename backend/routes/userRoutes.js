const express = require('express');
const { authenticateToken, authorize } = require('../middlewares/auth');
const cos = require('../cosmos0-1');

const router = express.Router();

router.get('/users', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    const users = await cos.readContainer('testdb', 'users');
    const safeUsers = users.map(user => {
      const { password, ...rest } = user;
      return rest;
    });
    res.status(200).json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const users = await cos.queryItems('testdb', 'users',
      `SELECT * FROM c WHERE c.id = "${id}"`
    );
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = users[0];
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const users = await cos.queryItems('testdb', 'users',
      `SELECT * FROM c WHERE c.id = "${id}"`
    );
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    const { password, role, ...updateData } = req.body;

    // Only admin can update roles
    if (role && req.user.role === 'admin') {
      user.role = role;
    }
    // If password provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    // Merge updates
    Object.assign(user, updateData, { updatedAt: Date.now() });

    await cos.createFamilyItem('testdb', 'users', user);

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({
      message: 'User updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

module.exports = { router };
