const express = require('express');
const router = express.Router();
const { register, login } = require('../services/authService');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const user = await register(name, email, password);
    
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await login(email, password);
    
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get current user (protected route sample test WILL BE MODIFIED ONCE WE HAVE MOCK DATA)
router.get('/me', protect, (req, res) => {
  res.json(req.user);
});

module.exports = router;