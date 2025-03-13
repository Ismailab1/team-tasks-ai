// tests/cosmos.test.js
const request = require('supertest');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const cosmosModule = require('../cosmos0-1');
require('dotenv').config();

// Mock database and container names for testing
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

// Create a simple Express app for API testing
const app = express();
app.use(express.json());

// Sample route that uses our cosmos module
app.get('/test-cosmos-query', async (req, res) => {
  try {
    const users = await cosmosModule.readContainer(TEST_DB, 'users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user route for testing
app.post('/test-create-user', async (req, res) => {
  try {
    const user = req.body;
    const { resource: createdUser } = await cosmosModule.createFamilyItem(TEST_DB, 'users', user);
    res.status(201).json(createdUser); // Send just the resource data
  } catch (error) {
    console.error("Error creating user via API:", error);
    res.status(500).json({ error: error.message });
  }
});

describe('Cosmos DB Module Tests', () => {
  // Setup - run once before all tests
  beforeAll(async () => {
    // Initialize test database with required containers
    try {
      await cosmosModule.initializeDatabase(TEST_DB);
      console.log('Test database initialized');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error; // Fail the tests if we can't set up the database
    }
  });

  // Clean up - run after all tests complete
  afterAll(async () => {
    // Optionally delete test data here if needed
    console.log('Tests completed, cleanup if necessary');
  });

  // Test database initialization
  test('Should initialize database with all required containers', async () => {
    const containers = ['users', 'teams', 'tasks', 'chatLogs', 'checkins', 'reports'];
    for (const container of containers) {
      const items = await cosmosModule.readContainer(TEST_DB, container);
      expect(Array.isArray(items)).toBe(true);
    }
  });

  // Direct module test for user creation
  test('Should create a user directly with the module', async () => {
    const testUser = { ...TEST_USER, username: `user_${Date.now()}` };
    const result = await cosmosModule.createFamilyItem(TEST_DB, 'users', testUser);
    expect(result).toHaveProperty('id');
    expect(result.username).toBe(testUser.username);
  });
  

  // API test for user creation using Supertest
  test('Should create a user via API endpoint', async () => {
    const testUser = { username: `apiuser_${Date.now()}`, email: 'api@test.com' };
    const response = await request(app)
      .post('/test-create-user')
      .send(testUser)
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.username).toBe(testUser.username);
  });

  // Test querying users
  test('Should query users by username', async () => {
    // First create a unique user
    const uniqueUsername = `querytest_${Date.now()}`;
    const testUser = { ...TEST_USER, id: uuidv4(), username: uniqueUsername };
    await cosmosModule.createFamilyItem(TEST_DB, 'users', testUser);
    
    // Then try to query for it
    const result = await cosmosModule.getUserByUsername(TEST_DB, uniqueUsername);
    expect(result).not.toBeNull();
    expect(result.username).toBe(uniqueUsername);
  });

  // Test team creation and membership
  test('Should create a team and add members', async () => {
    // Create test user
    const userId = uuidv4();
    const testUser = { ...TEST_USER, id: userId, username: `teamuser_${Date.now()}` };
    await cosmosModule.createFamilyItem(TEST_DB, 'users', testUser);
    
    // Create a team with this user as creator and member
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
    
    // Test if the user is indeed a member of this team
    const userTeams = await cosmosModule.getUserTeams(TEST_DB, userId);
    expect(userTeams.length).toBeGreaterThan(0);
    expect(userTeams.some(t => t.id === teamId)).toBe(true);
    
    // Test getting team members
    const members = await cosmosModule.getTeamMembers(TEST_DB, teamId);
    expect(members.length).toBeGreaterThan(0);
    expect(members.some(m => m.id === userId)).toBe(true);
  });

  // Test task creation and queries
  test('Should create and query tasks by team', async () => {
    // Create a team
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
    
    // Create tasks for this team
    const task1 = {
      id: uuidv4(),
      teamId: teamId,
      title: 'Test Task 1',
      description: 'First test task',
      status: 'New',
      assignedTo: TEST_USER.id,
      createdBy: TEST_USER.id,
      createdAt: new Date(Date.now() - 1000).toISOString(),
      dueDate: new Date(Date.now() + 86400000).toISOString()
    };
    
    const task2 = {
      id: uuidv4(),
      teamId: teamId,
      title: 'Test Task 2',
      description: 'Second test task',
      status: 'InProgress',
      assignedTo: TEST_USER.id,
      createdBy: TEST_USER.id,
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 86400000*2).toISOString()
    };
    
    await cosmosModule.createFamilyItem(TEST_DB, 'tasks', task1);
    await cosmosModule.createFamilyItem(TEST_DB, 'tasks', task2);
    
    // Test tasksByCreatedDate function
    const teamTasks = await cosmosModule.tasksByCreatedDate(TEST_DB, 'tasks', teamId);
    expect(teamTasks.length).toBe(2);
    expect(teamTasks[0].title).toBe('Test Task 1'); // Should be first due to earlier creation date
    
    // Test getUserTasks function
    const userTasks = await cosmosModule.getUserTasks(TEST_DB, TEST_USER.id);
    expect(userTasks.length).toBeGreaterThan(0);
  });

  // Test chat log functionality  
  test('Should create and query conversation history', async () => {
    const conversationId = uuidv4();
    
    // Create chat messages
    const message1 = {
      id: uuidv4(),
      userId: TEST_USER.id,
      conversationId: conversationId,
      message: 'Hello world',
      sentiment: 'positive',
      role: 'user',
      timestamp: new Date(Date.now() - 1000).toISOString()
    };
    
    const message2 = {
      id: uuidv4(),
      userId: 'system',
      conversationId: conversationId,
      message: 'Hello user',
      sentiment: 'neutral',
      role: 'assistant',
      timestamp: new Date().toISOString()
    };
    
    await cosmosModule.createFamilyItem(TEST_DB, 'chatLogs', message1);
    await cosmosModule.createFamilyItem(TEST_DB, 'chatLogs', message2);
    
    // Test conversation history retrieval
    const history = await cosmosModule.getConversationHistory(TEST_DB, conversationId);
    expect(history.length).toBe(2);
    expect(history[0].message).toBe('Hello world'); // First message
    expect(history[1].message).toBe('Hello user'); // Second message
  });

  // Test API endpoint with Supertest
  test('Should retrieve users via API endpoint', async () => {
    const response = await request(app)
      .get('/test-cosmos-query')
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
  });
});

// Don't actually listen, this is just for testing
module.exports = app;