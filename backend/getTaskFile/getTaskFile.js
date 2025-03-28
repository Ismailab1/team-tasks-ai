const { app } = require('@azure/functions');
const { authenticateToken } = require('../middlewares/auth');
const cos = require('../cosmos0-1');
const path = require('path');
const fs = require('fs');

app.http('getTaskFile', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'tasks/file/{id}',
  handler: async (request, context) => {
    try {
      const user = await authenticateToken(request); // Authenticate user
      const { id } = request.params;

      const tasks = await cos.queryItems('testdb', 'tasks', `SELECT * FROM c WHERE c.id = "${id}"`);
      if (tasks.length === 0 || !tasks[0].taskImage) {
        return { status: 404, body: { error: 'File not found' } };
      }

      const task = tasks[0];
      const teams = await cos.queryItems('testdb', 'teams', `SELECT * FROM c WHERE c.id = "${task.teamId}"`);
      if (teams.length === 0) {
        return { status: 404, body: { error: 'Team not found' } };
      }

      const team = teams[0];
      if (!team.members.includes(user.id) && team.createdBy !== user.id && user.role !== 'admin') {
        return { status: 403, body: { error: 'Insufficient permissions' } };
      }

      const filePath = path.join(__dirname, task.taskImage);
      if (!fs.existsSync(filePath)) {
        return { status: 404, body: { error: 'File not found' } };
      }

      context.res = {
        status: 200,
        body: fs.createReadStream(filePath),
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      };
    } catch (error) {
      context.log.error('❌ Error retrieving file:', error);
      return { status: 500, body: { error: 'Failed to retrieve file' } };
    }
  },
});