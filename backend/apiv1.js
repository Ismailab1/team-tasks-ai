const express = require('express');
const app = express();
const port = 3000;
const cos = require('./cosmos0-1.js');

const crypto = require('crypto');

  app.use(express.json());

// Define the route for adding a task
  app.post('/tasks/add', (req, res) => {
    const ctime = Date.now();

    // Use req.body to access data from the request body
    const t = {
        id: crypto.randomUUID(),
        teamId: req.body.teamId,        // Change from req.params to req.body
        title: req.body.title,          // Change from req.params to req.body
        description: req.body.description,  // Change from req.params to req.body
        taskImage: req.body.taskImage,  // Change from req.params to req.body
        status: req.body.status,        // Change from req.params to req.body
        assignedTo: req.body.assignedTo,  // Change from req.params to req.body
        createdAt: ctime,
        updatedAt: ctime,
        dueDate: req.body.dueDate       // Change from req.params to req.body
    };

    // Call your function to create the family item
    cos.createFamilyItem("tasks", "tasks", t);

    // Respond with the task details
    res.status(200).json({
        message: `Task added with taskId ${t.id} & teamId ${t.teamId}`,
        taskId: t.id,
        teamId: t.teamId,
        assignedTo: t.assignedTo,
        dueDate: t.dueDate
    });
});

// Define the route for getting tasks for team
app.get('/tasks/:teamId', (req, res) => {
    // Use req.params to access data from the request URL
    const teamId = req.params.teamId;
    // Call your function to get the tasks for the team
    const tasks = cos.tasksByCreatedDate(teamId);
    // Respond with the tasks
    res.status(200).json(tasks);
})

// generic error handler from ChatGPT
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack trace to the console
    res.status(500).send('Something went wrong!'); // Send a generic 500 response
  });
  
// app.listen(port, () => {
//     console.log(`Example app listening on port ${port}`)
//   })

module.exports = app;