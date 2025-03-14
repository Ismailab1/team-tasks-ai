const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const cosmosModule = require('../cosmos0-1');
require('dotenv').config();

const TEST_DB = 'testdb';
const TEST_USER = {
  id: uuidv4(),
  username: 'testuser',
  password: 'hashedpassword',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'user',
  createdAt: new Date().toISOString()
};

const app = express();
app.use(express.json());

app.get('/test-cosmos-query', async (req, res) => {
  try {
    const users = await cosmosModule.queryItems(TEST_DB, 'users', 'SELECT * FROM c');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/test-create-user', async (req, res) => {
  try {
    const user = req.body;
    const createdUser = await cosmosModule.createFamilyItem(TEST_DB, 'users', user);
    res.status(201).json(createdUser); // ✅ Now correctly returning a serializable object
  } catch (error) {
    console.error("Error creating user via API:", error);
    res.status(500).json({ error: error.message });
  }
});

describe('Cosmos DB Module Tests', () => {
  beforeAll(async () => {
    try {
      await cosmosModule.initializeDatabase(TEST_DB);
      console.log('Test database initialized');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  });

  afterAll(() => {
    console.log('Tests completed, cleanup if necessary');
  });

  test('Should initialize database with all required containers', async () => {
    const containers = ['users', 'teams', 'tasks', 'chatLogs', 'checkins', 'reports'];
    for (const container of containers) {
      const items = await cosmosModule.queryItems(TEST_DB, container, 'SELECT * FROM c');
      expect(Array.isArray(items)).toBe(true);
    }
  });

  test('Should create a user and retrieve by username', async () => {
    const testUser = { ...TEST_USER, username: `user_${Date.now()}` };
    await cosmosModule.createFamilyItem(TEST_DB, 'users', testUser);
    const result = await cosmosModule.getUserByUsername(TEST_DB, testUser.username);
    expect(result).toHaveProperty('id');
    expect(result.username).toBe(testUser.username);
  });

  test('Should create a user via API', async () => {
    const testUser = { username: `apiuser_${Date.now()}`, email: 'api@test.com' };
    const response = await request(app).post('/test-create-user').send(testUser).expect(201);
    const result = await cosmosModule.getUserByUsername(TEST_DB, testUser.username);
    expect(result).toHaveProperty('id');
    expect(result.username).toBe(testUser.username);
  });

  test('Should create a team and verify membership', async () => {
    const userId = uuidv4();
    const testUser = { ...TEST_USER, id: userId, username: `teamuser_${Date.now()}` };
    await cosmosModule.createFamilyItem(TEST_DB, 'users', testUser);

    const teamId = uuidv4();
    const team = {
      id: teamId,
      name: 'Test Team',
      description: 'Created for testing',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      members: [userId]
    };
    await cosmosModule.createFamilyItem(TEST_DB, 'teams', team);

    const userTeams = await cosmosModule.getUserTeams(TEST_DB, userId);
    expect(userTeams.some(t => t.id === teamId)).toBe(true);
  });

  test('Should create and fetch tasks by team', async () => {
    const teamId = uuidv4();
    const team = {
      id: teamId,
      name: 'Task Test Team',
      description: 'For testing tasks',
      createdBy: TEST_USER.id,
      createdAt: new Date().toISOString(),
      members: [TEST_USER.id]
    };
    await cosmosModule.createFamilyItem(TEST_DB, 'teams', team);

    const task = {
      id: uuidv4(),
      teamId: teamId,
      title: 'Test Task',
      status: 'New',
      assignedTo: TEST_USER.id,
      createdBy: TEST_USER.id,
      createdAt: new Date().toISOString()
    };
    await cosmosModule.createFamilyItem(TEST_DB, 'tasks', task);

    const teamTasks = await cosmosModule.tasksByCreatedDate(TEST_DB, 'tasks', teamId);
    expect(teamTasks.length).toBeGreaterThan(0);
    expect(teamTasks[0].title).toBe('Test Task');
  });

  test('Should create and retrieve conversation history', async () => {
    const conversationId = uuidv4();
    const message = {
      id: uuidv4(),
      userId: TEST_USER.id,
      conversationId: conversationId,
      message: 'Hello AI',
      sentiment: 'neutral',
      role: 'user',
      timestamp: new Date().toISOString()
    };
    await cosmosModule.createFamilyItem(TEST_DB, 'chatLogs', message);
    const history = await cosmosModule.getConversationHistory(TEST_DB, conversationId);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].message).toBe('Hello AI');
  });

  test('Should retrieve users via API endpoint', async () => {
    const response = await request(app).get('/test-cosmos-query').expect(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

module.exports = app;
