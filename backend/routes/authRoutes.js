const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middlewares/auth');
const cos = require('../cosmos0-1');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const existingUsers = await cos.queryItems('testdb', 'users', `SELECT * FROM c WHERE c.username = "${username}" OR c.email = "${email}"`);
    if (existingUsers.length > 0) return res.status(409).json({ error: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { id: crypto.randomUUID(), username, password: hashedPassword, email, role: 'user', createdAt: Date.now() };
    await cos.createFamilyItem('testdb', 'users', user);
    res.status(201).json({ message: 'User registered successfully', user: { id: user.id, username, email } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = await cos.queryItems('testdb', 'users', `SELECT * FROM c WHERE c.username = "${username}"`);
    if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(200).json({ message: 'Login successful', token, user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = { router };
