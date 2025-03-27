const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');

// Import the express app
const app = require('../../server');

// Sample test data
const testUser = {
  id: 'test123',
  email: 'test@example.com',
  role: 'user'
};

const testToken = jwt.sign(testUser, process.env.JWT_SECRET || 'your-secret-key');

describe('Team Routes', () => {
  let mockContainer;
  let mockItems;
  let mockDatabase;

  beforeEach(() => {
    // Create mocks for CosmosDB
    mockItems = {
      query: sinon.stub(),
      create: sinon.stub(),
      fetchAll: sinon.stub()
    };
    
    mockContainer = {
      items: mockItems,
      item: sinon.stub().returns({
        replace: sinon.stub().resolves({ resource: {} }),
        delete: sinon.stub().resolves({})
      })
    };
    
    mockDatabase = {
      container: sinon.stub().returns(mockContainer)
    };
    
    // Override req.database in the middleware
    const originalUse = app.use;
    sinon.stub(app, 'use').callsFake(function(middleware) {
      if (middleware.toString().includes('req.database')) {
        return originalUse.call(this, (req, res, next) => {
          req.database = mockDatabase;
          next();
        });
      }
      return originalUse.apply(this, arguments);
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('GET /api/teams', () => {
    it('should return all teams for the authenticated user', async () => {
      // Mock data
      const mockTeams = [
        {
          id: '1',
          name: 'Team 1',
          description: 'Test team 1',
          created_by: testUser.id,
          member_ids: [testUser.id]
        },
        {
          id: '2',
          name: 'Team 2',
          description: 'Test team 2',
          created_by: 'other-user',
          member_ids: [testUser.id, 'other-user']
        }
      ];

      // Setup mocks
      mockItems.query.returns({
        fetchAll: sinon.stub().resolves({ resources: mockTeams })
      });

      // Make request
      const response = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${testToken}`);

      // Assertions
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body).to.have.length(2);
      expect(mockDatabase.container.calledWith('teams')).to.be.true;
      expect(mockItems.query.calledOnce).to.be.true;
    });
  });

  describe('POST /api/teams', () => {
    it('should create a new team', async () => {
      // Mock data
      const newTeam = {
        name: 'New Team',
        description: 'Test description'
      };
      
      const createdTeam = {
        id: '3',
        name: 'New Team',
        description: 'Test description',
        created_by: testUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        member_ids: [testUser.id],
        members: [{ id: testUser.id, role: 'admin' }]
      };

      // Setup mocks
      mockItems.create.resolves({ resource: createdTeam });

      // Make request
      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${testToken}`)
        .send(newTeam);

      // Assertions
      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('id');
      expect(response.body.name).to.equal(newTeam.name);
      expect(response.body.description).to.equal(newTeam.description);
      expect(mockDatabase.container.calledWith('teams')).to.be.true;
      expect(mockItems.create.calledOnce).to.be.true;
    });

    it('should return 400 if name is not provided', async () => {
      // Make request without name
      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ description: 'Test description' });

      // Assertions
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('message', 'Team name is required');
    });
  });

  // Additional tests for other routes can be added here
  // For example:
  // - GET /api/teams/:id
  // - PUT /api/teams/:id
  // - DELETE /api/teams/:id
  // - POST /api/teams/:id/members
  // - DELETE /api/teams/:id/members/:userId
  // - GET /api/teams/:id/tasks
});
