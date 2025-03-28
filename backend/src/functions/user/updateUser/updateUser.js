const { app } = require('@azure/functions');
const { authenticateToken } = require('../../../middlewares/auth');
const cos = require('../../../cosmos0-1');
const bcrypt = require('bcrypt');

app.http('updateUser', {
  methods: ['PUT'],
  authLevel: 'function',
  route: 'users/{id}',
  handler: async (request, context) => {
    try {
      const user = await authenticateToken(request); // Authenticate user
      const { id } = request.params;
      const updateData = await request.json();

      // Check permissions: Admins or the user themselves can update
      if (user.role !== 'admin' && user.id !== id) {
        return { status: 403, body: { error: 'Insufficient permissions' } };
      }

      const users = await cos.queryItems('testdb', 'users', `SELECT * FROM c WHERE c.id = "${id}"`);
      if (users.length === 0) {
        return { status: 404, body: { error: 'User not found' } };
      }

      const existingUser = users[0];
      const { password, role, ...otherUpdates } = updateData;

      // Only admins can update roles
      if (role && user.role === 'admin') {
        existingUser.role = role;
      }

      // If password is provided, hash it
      if (password) {
        existingUser.password = await bcrypt.hash(password, 10);
      }

      // Merge updates
      Object.assign(existingUser, otherUpdates, { updatedAt: Date.now() });

      await cos.createFamilyItem('testdb', 'users', existingUser);

      const { password: _, ...userWithoutPassword } = existingUser;
      return {
        status: 200,
        body: {
          message: 'User updated successfully',
          user: userWithoutPassword,
        },
      };
    } catch (error) {
      context.log.error('❌ Error updating user:', error);
      return { status: 500, body: { error: 'Failed to update user' } };
    }
  },
});