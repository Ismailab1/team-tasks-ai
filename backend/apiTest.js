const request = require('supertest');
const app = require('./apiv1.js');  // Import your app here
const should = require('should');

describe('POST /tasks/add', () => {
  it('should add a task and return a message', (done) => {
    request(app)
      .post('/tasks/add')
      .send({
        teamId: '23456',
        title: 'Learn how to code',
        description: 'I really hate farming, I would rather debug javascript!',
        taskImage: 'Who has a link for tasks?',
        status: 'pending',
        assignedTo: ['65432'],
        dueDate: '1740987500'
      })
      .expect(200)
      .expect((res) => {
        // Test that the response includes the expected content
        res.body.should.have.property('taskId');
        res.body.should.have.property('teamId');
        res.body.should.have.property('assignedTo');
      })
      .end(done);
  });
});

// test the GET /tasks/:teamId route
describe('GET /tasks/:teamId', () => {
  it('should return tasks for a team', (done) => {
    request(app)
      .get('/tasks/23456')
      .expect(200)
      .expect((res) => {
        // Test that the response includes the expected content
        res.body.should.be.Object();
        console.log(res.body);
      })
      .end(done);
  });
});