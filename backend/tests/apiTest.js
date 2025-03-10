/**
 * tests/apitest.js
 * 
 * Supertest-based tests for the "tasks" routes in appv1.js.
 * Uses "should" library for additional assertions.
 */

const request = require('supertest');
const should = require('should');
// If you have a separate server file exporting 'app', import that.
// Otherwise, if appv1.js exports an Express instance, use that.
// Example if "app" is exported from "server.js":
// const { app, server } = require('../server');

// Or if "appv1.js" is your main file exporting the Express app:
const { router } = require('../appv1'); // If you only export router, you need a small Express app to mount it:
const express = require('express');
const app = express();
app.use(express.json());
app.use('/api', router);

// For demonstration, we wrap the app in a small test server:
let testServer;

beforeAll((done) => {
  testServer = app.listen(0, () => { // 0 => ephemeral port
    console.log('Test server started');
    done();
  });
});

afterAll((done) => {
  testServer.close(() => {
    console.log('Test server closed');
    done();
  });
});

/**
 * 
 * NOTE: If your "POST /api/tasks" route requires JWT authentication,
 * you must either:
 *   1) Provide a valid token in the .set('Authorization', `Bearer ${token}`)
 *   2) Or remove authentication in dev environment for testing
 * 
 * For this example, let's assume the route doesn't require auth, or 
 * you have turned off authentication for the sake of demonstration.
 * If it DOES require auth, you'll need to log in first and store the token.
 * 
 */

// Example test data
const testTeamId = '23456';

describe('POST /api/tasks', () => {
  it('should create a new task and return the task details', async () => {
    const response = await request(app)
      .post('/api/tasks')
      // .set('Authorization', 'Bearer <YOUR_TEST_TOKEN>') // if needed
      .field('teamId', testTeamId)
      .field('title', 'Learn how to code')
      .field('description', 'I really hate farming, I would rather debug JavaScript!')
      .field('status', 'pending')
      .field('assignedTo', '65432')
      .field('dueDate', '1740987500');
      // .attach('taskImage', './path/to/testfile.png') // if you want to test image upload

    // If your route returns 201 on success:
    should(response.status).eql(201);
    response.body.should.have.property('message', 'Task added successfully');
    response.body.should.have.property('task');
    response.body.task.should.have.property('id');
    response.body.task.should.have.property('teamId', testTeamId);
  });
});

describe('GET /api/tasks/team/:teamId', () => {
  it('should return tasks for the specified team', async () => {
    const response = await request(app)
      .get(`/api/tasks/team/${testTeamId}`)
      // .set('Authorization', 'Bearer <YOUR_TEST_TOKEN>') // if needed
      .expect(200);

    response.body.should.be.an.Array();
    // Optionally check if one of the tasks has the correct data
    // For demonstration, we just print them:
    console.log('Tasks for team:', response.body);
  });
});
