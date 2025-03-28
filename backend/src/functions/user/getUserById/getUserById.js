const { app } = require('@azure/functions');
const { authenticateToken } = require('../../../middlewares/auth');
const cos = require('../../../cosmos0-1');

app.http('getUserById', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'users/{id}',
  handler: async (request, context) => {
    try {
      const user = await authenticateToken(request); // Authenticate user
      const { id } = request.params;

      // Check permissions: Admins or the user themselves can access this route
      if (user.role !== 'admin' && user.id !== id) {
        return { status: 403, body: { error: 'Insufficient permissions' } };
      }

      const users = await cos.queryItems('testdb', 'users', `SELECT * FROM c WHERE c.id = "${id}"`);
      if (users.length === 0) {
        return { status: 404, body: { error: 'User not found' } };
      }

      const { password, ...userWithoutPassword } = users[0];
      return { status: 200, body: userWithoutPassword };
    } catch (error) {
      context.log.error('❌ Error fetching user:', error);
      return { status: 500, body: { error: 'Failed to fetch user' } };
    }
  },
});