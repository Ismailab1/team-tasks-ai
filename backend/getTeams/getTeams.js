const { app } = require('@azure/functions');
const { authenticateToken } = require('../middlewares/auth');
const cos = require('../cosmos0-1');

app.http('getTeams', {
  methods: ['GET'],
  authLevel: 'function',
  handler: async (request, context) => {
    try {
      const user = await authenticateToken(request); // Authenticate user
      const userId = user.id;

      const query = `SELECT * FROM c WHERE ARRAY_CONTAINS(c.members, "${userId}") OR c.createdBy = "${userId}"`;
      const teams = await cos.queryItems('testdb', 'teams', query);

      return { status: 200, body: teams };
    } catch (error) {
      context.log.error('❌ Error fetching teams:', error);
      return { status: 500, body: { error: 'Failed to fetch teams' } };
    }
  },
});