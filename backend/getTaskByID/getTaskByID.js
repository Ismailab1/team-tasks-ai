const { app } = require('@azure/functions');
const { authenticateToken } = require('../middlewares/auth');
const cos = require('../cosmos0-1');

app.http('getTaskById', {
  methods: ['GET'],
  authLevel: 'function',
  route: 'tasks/{id}',
  handler: async (request, context) => {
    try {
      const user = await authenticateToken(request); // Authenticate user
      const { id } = request.params;

      const tasks = await cos.queryItems('testdb', 'tasks', `SELECT * FROM c WHERE c.id = "${id}"`);
      if (tasks.length === 0) {
        return { status: 404, body: { error: 'Task not found' } };
      }

      return { status: 200, body: tasks[0] };
    } catch (error) {
      context.log.error('❌ Error fetching task:', error);
      return { status: 500, body: { error: 'Failed to fetch task' } };
    }
  },
});