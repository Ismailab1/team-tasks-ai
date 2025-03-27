const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Apply auth middleware to all task routes
router.use(protect);

// Get all tasks
router.get('/', async (req, res) => {
  try {
    const container = req.database.container('tasks');
    const userId = req.user.id;
    
    // Get all tasks accessible to the user (either assigned or team member)
    const { resources: tasks } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE ARRAY_CONTAINS(c.assigned_to, @userId) 
          OR c.created_by = @userId
          OR EXISTS(
            SELECT VALUE t FROM t IN @teamIds
            WHERE c.team_id = t
          )
        `,
        parameters: [
          { name: '@userId', value: userId },
          { name: '@teamIds', value: req.user.teamIds || [] }
        ]
      })
      .fetchAll();
    
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const { title, description, status, priority, assigned_to, due_date, team_id } = req.body;
    
    if (!title || !team_id) {
      return res.status(400).json({ message: 'Title and team_id are required' });
    }
    
    // Verify team membership
    const teamsContainer = req.database.container('teams');
    const { resources: teams } = await teamsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @teamId AND (ARRAY_CONTAINS(c.member_ids, @userId) OR c.created_by = @userId)",
        parameters: [
          { name: "@teamId", value: team_id },
          { name: "@userId", value: req.user.id }
        ]
      })
      .fetchAll();
    
    if (teams.length === 0) {
      return res.status(403).json({ message: 'Team not found or access denied' });
    }
    
    const container = req.database.container('tasks');
    const now = new Date().toISOString();
    
    const newTask = {
      id: Date.now().toString(),
      title,
      description: description || '',
      status: status || 'To Do',
      priority: priority || 'Medium',
      assigned_to: assigned_to || [req.user.id],
      due_date: due_date || null,
      team_id,
      created_by: req.user.id,
      created_at: now,
      updated_at: now
    };
    
    const { resource: createdTask } = await container.items.create(newTask);
    
    res.status(201).json(createdTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single task
router.get('/:id', async (req, res) => {
  try {
    const container = req.database.container('tasks');
    const taskId = req.params.id;
    const userId = req.user.id;
    
    // Get task by ID where user has access
    const { resources: tasks } = await container.items
      .query({
        query: `
          SELECT * FROM c 
          WHERE c.id = @id
          AND (
            ARRAY_CONTAINS(c.assigned_to, @userId) 
            OR c.created_by = @userId
            OR EXISTS(
              SELECT VALUE t FROM t IN @teamIds
              WHERE c.team_id = t
            )
          )
        `,
        parameters: [
          { name: '@id', value: taskId },
          { name: '@userId', value: userId },
          { name: '@teamIds', value: req.user.teamIds || [] }
        ]
      })
      .fetchAll();
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }
    
    res.status(200).json(tasks[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const { title, description, status, priority, assigned_to, due_date } = req.body;
    const container = req.database.container('tasks');
    const taskId = req.params.id;
    
    // Get task by ID
    const { resources: tasks } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: taskId }]
      })
      .fetchAll();
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const task = tasks[0];
    
    // Verify team membership
    const teamsContainer = req.database.container('teams');
    const { resources: teams } = await teamsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @teamId AND (ARRAY_CONTAINS(c.member_ids, @userId) OR c.created_by = @userId)",
        parameters: [
          { name: "@teamId", value: task.team_id },
          { name: "@userId", value: req.user.id }
        ]
      })
      .fetchAll();
    
    if (teams.length === 0) {
      return res.status(403).json({ message: 'Team not found or access denied' });
    }
    
    // Update task properties
    task.title = title || task.title;
    task.description = description !== undefined ? description : task.description;
    task.status = status || task.status;
    task.priority = priority || task.priority;
    task.assigned_to = assigned_to || task.assigned_to;
    task.due_date = due_date !== undefined ? due_date : task.due_date;
    task.updated_at = new Date().toISOString();
    
    // Update task in DB
    const { resource: updatedTask } = await container.item(taskId).replace(task);
    
    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const container = req.database.container('tasks');
    const taskId = req.params.id;
    
    // Get task by ID
    const { resources: tasks } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: taskId }]
      })
      .fetchAll();
    
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const task = tasks[0];
    
    // Verify team membership and permissions
    const teamsContainer = req.database.container('teams');
    const { resources: teams } = await teamsContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @teamId AND (c.created_by = @userId OR EXISTS(SELECT VALUE m FROM m IN c.members WHERE m.id = @userId AND m.role = 'admin'))",
        parameters: [
          { name: "@teamId", value: task.team_id },
          { name: "@userId", value: req.user.id }
        ]
      })
      .fetchAll();
    
    // Allow task creator or team admin to delete
    if (teams.length === 0 && task.created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You must be task creator or team admin' });
    }
    
    // Delete task
    await container.item(taskId).delete();
    
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
