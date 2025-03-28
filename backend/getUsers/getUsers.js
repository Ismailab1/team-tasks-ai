const { app } = require('@azure/functions');
const { authenticateToken, authorize } = require('../middlewares/auth');
const cos = require('../cosmos0-1');

app.http('getUsers', {
  methods: ['GET'],
  authLevel: 'function',
  handler: async (request, context) => {
    try {
      const user = await authenticateToken(request); // Authenticate user
      authorize(user, ['admin']); // Only admins can access this route

      const users = await cos.readContainer('testdb', 'users');
      const safeUsers = users.map(user => {
        const { password, ...rest } = user;
        return rest;
      });

      return { status: 200, body: safeUsers };
    } catch (error) {
      context.log.error('❌ Error fetching users:', error);
      return { status: 500, body: { error: 'Failed to fetch users' } };
    }
  },
});