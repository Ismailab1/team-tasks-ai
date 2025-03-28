const { app } = require('@azure/functions');
const { authenticateToken } = require('../../../middlewares/auth');
const cos = require('../../../cosmos0-1');
const crypto = require('crypto');

app.http('createTeam', {
  methods: ['POST'],
  authLevel: 'function',
  handler: async (request, context) => {
    try {
      const user = await authenticateToken(request); // Authenticate user
      const { name, description } = await request.json();

      context.log('🔹 DEBUG: Authenticated User', { userId: user.id, role: user.role });

      const team = {
        id: crypto.randomUUID(),
        name,
        description,
        createdBy: user.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        members: [user.id],
        roles: { [user.id]: 'admin' },
      };

      context.log('🔹 DEBUG: Saving team to database', team);
      await cos.createFamilyItem('testdb', 'teams', team);

      return { status: 201, body: { message: 'Team created successfully', team } };
    } catch (error) {
      context.log.error('❌ Error creating team:', error);
      return { status: 500, body: { error: 'Failed to create team' } };
    }
  },
});