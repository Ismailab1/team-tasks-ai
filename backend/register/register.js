const bcrypt = require('bcrypt');
const { app } = require('@azure/functions');
const cos = require('../cosmos0-1');

app.http('register', {
  methods: ['POST'],
  authLevel: 'function',
  handler: async (request, context) => {
    try {
      const { username, password, email } = await request.json();

      // Check if user already exists
      const existingUsers = await cos.queryItems(
        'testdb',
        'users',
        `SELECT * FROM c WHERE c.username = "${username}" OR c.email = "${email}"`
      );
      if (existingUsers.length > 0) {
        return { status: 409, body: { error: 'User already exists' } };
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create the user object
      const user = {
        id: crypto.randomUUID(),
        username,
        password: hashedPassword,
        email,
        role: 'user',
        createdAt: Date.now(),
      };

      // Save the user to the database
      await cos.createFamilyItem('testdb', 'users', user);

      return {
        status: 201,
        body: {
          message: 'User registered successfully',
          user: { id: user.id, username, email },
        },
      };
    } catch (error) {
      context.log.error('Registration error:', error);
      return { status: 500, body: { error: 'Registration failed' } };
    }
  },
});