const { app } = require('@azure/functions');
const { authenticateToken } = require('../middlewares/auth');
const cos = require('../cosmos0-1');

app.http('getTasksForTeam', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'tasks/team/{teamId}',
  handler: async (request, context) => {
    try {
      const user = await authenticateToken(request); // Authenticate user
      const { teamId } = request.params;

      if (!teamId) {
        context.log.error('❌ Missing teamId in request params.');
        return { status: 400, body: { error: 'teamId is required' } };
      }

      const teams = await cos.queryItems('testdb', 'teams', `SELECT * FROM c WHERE c.id = "${teamId}"`);
      if (teams.length === 0) {
        return { status: 404, body: { error: 'Team not found' } };
      }

      const team = teams[0];
      if (!team.members.includes(user.id) && team.createdBy !== user.id && user.role !== 'admin') {
        return { status: 403, body: { error: 'Insufficient permissions' } };
      }

      const tasks = await cos.tasksByCreatedDate('testdb', 'tasks', teamId);
      return { status: 200, body: tasks };
    } catch (error) {
      context.log.error('❌ Error fetching tasks:', error);
      return { status: 500, body: { error: 'Failed to fetch tasks' } };
    }
  },
});