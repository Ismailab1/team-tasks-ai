const express = require('express');
const authService = require('../services/authService');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    const result = await authService.register({ name, email, password });
    res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Failed to register user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const result = await authService.login({ email, password });
    res.status(200).json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ message: error.message || 'Invalid credentials' });
  }
});

// Refresh token
router.post('/refresh', protect, async (req, res) => {
  try {
    // User is already authenticated from the protect middleware
    const user = req.user;
    
    // Generate new token
    const token = authService.generateToken(user);
    
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset password request
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }
    
    // Here you would implement a real password reset flow with emails
    // For now, just return success
    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Confirm password reset
router.post('/reset-password/confirm', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Here you would implement the actual password reset
    // For now, just return success
    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Validate token (for protected routes)
router.get('/validate', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const user = await authService.validateToken(token);
    res.status(200).json({ valid: true, user });
  } catch (error) {
    res.status(401).json({ valid: false, message: error.message || 'Invalid token' });
  }
});

// Validate token (useful for client-side auth checking)
router.post('/validate-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ valid: false });
    }
    
    const isValid = await authService.validateToken(token);
    res.status(200).json({ valid: isValid });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;