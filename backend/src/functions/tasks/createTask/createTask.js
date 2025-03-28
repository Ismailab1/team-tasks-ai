const { app } = require('@azure/functions');
const { authenticateToken } = require('../../../middlewares/auth');
const { uploadToBlobStorage } = require('../../../middlewares/upload');
const cos = require('../../../cosmos0-1');
const crypto = require('crypto');

app.http('createTask', {
  methods: ['POST'],
  authLevel: 'function',
  handler: async (request, context) => {
    try {
      const user = await authenticateToken(request); // Authenticate user
      const { teamId, title, description, status, assignedTo, dueDate } = request.body;

      if (!teamId) {
        context.log.error('❌ Missing teamId in request body.');
        return { status: 400, body: { error: 'teamId is required' } };
      }

      const teams = await cos.queryItems('testdb', 'teams', `SELECT * FROM c WHERE c.id = "${teamId}"`);
      if (teams.length === 0) {
        context.log.error('❌ Team not found for ID:', teamId);
        return { status: 404, body: { error: 'Team not found' } };
      }

      const team = teams[0];
      if (!team.members.includes(user.id) && team.createdBy !== user.id && user.role !== 'admin') {
        context.log.error('❌ User lacks permissions:', user.id);
        return { status: 403, body: { error: 'Insufficient permissions' } };
      }

      const ctime = Date.now();
      const taskImage = request.file ? await uploadToBlobStorage(request.file) : null;

      const task = {
        id: crypto.randomUUID(),
        teamId,
        title,
        description,
        taskImage,
        status: status || 'pending',
        assignedTo,
        createdBy: user.id,
        createdAt: ctime,
        updatedAt: ctime,
        dueDate: dueDate ? new Date(dueDate).getTime() : null,
      };

      await cos.createFamilyItem('testdb', 'tasks', task);

      return { status: 201, body: { message: 'Task added successfully', task } };
    } catch (error) {
      context.log.error('❌ Error creating task:', error);
      return { status: 500, body: { error: 'Failed to create task' } };
    }
  },
});