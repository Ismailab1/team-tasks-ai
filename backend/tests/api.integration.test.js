// tests/api.integration.test.js
const request = require('supertest');
const app = require('../appv1'); // Import your actual Express app
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Test user data
const TEST_USER = {
  username: `testuser_${Date.now()}`,
  password: 'TestPassword123!',
  email: `test_${Date.now()}@example.com`,
  fullName: 'Test User'
};

let authToken, userId, teamId, taskId;

describe('API Integration Tests', () => {
  // Register and authenticate first
  test('Should register a new user', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send(TEST_USER)
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    userId = response.body.id;
  });

  test('Should authenticate and get a token', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        username: TEST_USER.username,
        password: TEST_USER.password
      })
      .expect(200);
    
    expect(response.body).toHaveProperty('token');
    authToken = response.body.token;
  });

  // Team tests
  test('Should create a new team', async () => {
    const teamData = {
      name: `Test Team ${Date.now()}`,
      description: 'Created for integration testing'
    };
    
    const response = await request(app)
      .post('/teams')
      .set('Authorization', `Bearer ${authToken}`)
      .send(teamData)
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    teamId = response.body.id;
    expect(response.body.name).toBe(teamData.name);
    expect(response.body.members).toContain(userId);
  });

  test('Should get teams for the user', async () => {
    const response = await request(app)
      .get('/teams')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.some(team => team.id === teamId)).toBe(true);
  });

  test('Should get team details', async () => {
    const response = await request(app)
      .get(`/teams/${teamId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(response.body).toHaveProperty('id', teamId);
    expect(response.body).toHaveProperty('members');
    expect(response.body.members).toContain(userId);
  });

  // Task tests
  test('Should create a new task', async () => {
    const taskData = {
      teamId: teamId,
      title: `Test Task ${Date.now()}`,
      description: 'Created for integration testing',
      status: 'New',
      dueDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
    };
    
    const response = await request(app)
      .post('/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send(taskData)
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    taskId = response.body.id;
    expect(response.body.title).toBe(taskData.title);
    expect(response.body.createdBy).toBe(userId);
  });

  test('Should get tasks for the team', async () => {
    const response = await request(app)
      .get(`/tasks/team/${teamId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.some(task => task.id === taskId)).toBe(true);
  });

  test('Should get task details', async () => {
    const response = await request(app)
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(response.body).toHaveProperty('id', taskId);
    expect(response.body).toHaveProperty('teamId', teamId);
  });

  test('Should update task details', async () => {
    const updateData = {
      status: 'InProgress',
      description: 'Updated for testing'
    };
    
    const response = await request(app)
      .put(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData)
      .expect(200);
    
    expect(response.body).toHaveProperty('id', taskId);
    expect(response.body.status).toBe(updateData.status);
    expect(response.body.description).toBe(updateData.description);
  });

  // AI chat tests
  test('Should handle AI chat request', async () => {
    const chatData = {
      message: 'Hello AI assistant',
      conversationId: uuidv4()
    };
    
    const response = await request(app)
      .post('/ai/chat')
      .set('Authorization', `Bearer ${authToken}`)
      .send(chatData)
      .expect(200);
    
    expect(response.body).toHaveProperty('response');
    expect(response.body).toHaveProperty('conversationId', chatData.conversationId);
  });

  // Report generation test
  test('Should generate AI report for team', async () => {
    const reportData = {
      teamId: teamId,
      reportType: 'progress',
      timeRange: 'week'
    };
    
    const response = await request(app)
      .post('/ai/report')
      .set('Authorization', `Bearer ${authToken}`)
      .send(reportData)
      .expect(200);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('content');
    expect(response.body.teamId).toBe(teamId);
    expect(response.body.reportType).toBe(reportData.reportType);
  });

  // Cleanup - can optionally delete test data
  test('Should delete the task', async () => {
    await request(app)
      .delete(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    // Verify deletion
    const response = await request(app)
      .get(`/tasks/${taskId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });

  test('Should delete the team', async () => {
    await request(app)
      .delete(`/teams/${teamId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    // Verify deletion
    const response = await request(app)
      .get(`/teams/${teamId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(404);
  });
});