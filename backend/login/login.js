const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { app } = require('@azure/functions');
const cos = require('../cosmos0-1');

app.http('login', {
  methods: ['POST'],
  authLevel: 'function',
  handler: async (request, context) => {
    try {
      const { username, password } = await request.json();

      // Fetch user by username
      const users = await cos.queryItems(
        'testdb',
        'users',
        `SELECT * FROM c WHERE c.username = "${username}"`
      );
      if (users.length === 0) {
        return { status: 401, body: { error: 'Invalid credentials' } };
      }

      const user = users[0];

      // Verify the password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { status: 401, body: { error: 'Invalid credentials' } };
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        status: 200,
        body: {
          message: 'Login successful',
          token,
          user: { id: user.id, username: user.username },
        },
      };
    } catch (error) {
      context.log.error('Login error:', error);
      return { status: 500, body: { error: 'Login failed' } };
    }
  },
});