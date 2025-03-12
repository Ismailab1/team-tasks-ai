/*************************************************************
 * appv1.js
 * 
 * Demonstrates:
 * 1) Authentication & Role-based access
 * 2) User, Team, Task routes
 * 3) AI check-in flow with subflow (same conversationId)
 * 4) Socket.io real-time setup
 *************************************************************/

const express = require('express');
const router = express.Router();
const cos = require('./cosmos0-1.js');
const crypto = require('crypto');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const socketIo = require('socket.io');
const { Configuration, OpenAIApi } = require('openai');

// Additional dependencies for AI enhancements
const axios = require('axios');
const natural = require('natural'); // if you want advanced NLP
const lda = require('lda'); // for LDA summarization

/*************************************************************
 * File Uploads (Multer)
 *************************************************************/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

/*************************************************************
 * Authentication Middleware
 *************************************************************/
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

/*************************************************************
 * OpenAI + Azure Setup
 *************************************************************/
const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

async function analyzeSentiment(text) {
  const sentimentApiUrl = process.env.AZURE_SENTIMENT_ENDPOINT;

  const response = await axios.post(
    sentimentApiUrl,
    {
      documents: [
        { id: '1', text }
      ]
    },
    {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_SENTIMENT_ANALYTICS_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  // Returns 'positive', 'neutral', or 'negative'
  return response.data.documents[0].sentiment;
}

async function summarizeConversation(conversationId, taskId = null) {
  try {
    let query = `SELECT * FROM c WHERE c.conversationId = "${conversationId}" ORDER BY c.timestamp ASC`;
    
    // If taskId is provided, filter by that as well
    if (taskId) {
      query = `SELECT * FROM c WHERE c.conversationId = "${conversationId}" AND c.taskId = "${taskId}" ORDER BY c.timestamp ASC`;
    }
    
    const chatHistory = await cos.queryItems(
      'chatLogs',
      'chatLogs',
      query
    );

    // Only summarize if there's enough data (5 or more messages)
    if (chatHistory.length < 5) return '';

    // 1 topic per 5 messages
    const numTopics = Math.max(1, Math.floor(chatHistory.length / 5));

    const documents = chatHistory.map((chat) => chat.message.split(/\s+/));
    const topics = lda(documents, numTopics, 5); // 5 words per topic

    // Join topics into a single summary string
    return topics
      .map(topic => topic.map(word => word.term).join(' '))
      .join('. ');
  } catch (error) {
    console.error('Error summarizing conversation:', error);
    return '';
  }
}

/*************************************************************
 * AUTHENTICATION ROUTES
 *************************************************************/
router.post('/auth/register', async (req, res) => {
  try {
    const { username, password, email, fullName } = req.body;

    // Check if user exists
    const existingUsers = await cos.queryItems(
      'users',
      'users',
      `SELECT * FROM c WHERE c.username = "${username}" OR c.email = "${email}"`
    );
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: crypto.randomUUID(),
      username,
      password: hashedPassword,
      email,
      fullName,
      role: 'user',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await cos.createFamilyItem('users', 'users', user);

    // Omit password from response
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const users = await cos.queryItems(
      'users',
      'users',
      `SELECT * FROM c WHERE c.username = "${username}"`
    );
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Omit password
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/*************************************************************
 * USER ROUTES
 *************************************************************/
router.get('/users', authenticateToken, authorize(['admin']), async (req, res) => {
  try {
    const users = await cos.readContainer('users', 'users');
    const safeUsers = users.map(user => {
      const { password, ...rest } = user;
      return rest;
    });
    res.status(200).json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const users = await cos.queryItems('users', 'users',
      `SELECT * FROM c WHERE c.id = "${id}"`
    );
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = users[0];
    res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const users = await cos.queryItems('users', 'users',
      `SELECT * FROM c WHERE c.id = "${id}"`
    );
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    const { password, role, ...updateData } = req.body;

    // Only admin can update roles
    if (role && req.user.role === 'admin') {
      user.role = role;
    }
    // If password provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    // Merge updates
    Object.assign(user, updateData, { updatedAt: Date.now() });

    await cos.createFamilyItem('users', 'users', user);

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({
      message: 'User updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/*************************************************************
 * TEAM ROUTES
 *************************************************************/
router.post('/teams', authenticateToken, authorize(['admin', 'manager']), async (req, res) => {
  try {
    const { name, description } = req.body;
    const team = {
      id: crypto.randomUUID(),
      name,
      description,
      createdBy: req.user.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      members: [req.user.id]
    };
    await cos.createFamilyItem('teams', 'teams', team);
    res.status(201).json({
      message: 'Team created successfully',
      team
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

router.get('/teams', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const teams = await cos.queryItems('teams', 'teams',
      `SELECT * FROM c WHERE ARRAY_CONTAINS(c.members, "${userId}") OR c.createdBy = "${userId}"`
    );
    res.status(200).json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

router.get('/teams/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const teams = await cos.queryItems('teams', 'teams', `SELECT * FROM c WHERE c.id = "${id}"`);
    if (teams.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    const team = teams[0];
    const userId = req.user.id;
    if (!team.members.includes(userId) && team.createdBy !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    res.status(200).json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

router.post('/teams/:id/members', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const teams = await cos.queryItems('teams', 'teams', `SELECT * FROM c WHERE c.id = "${id}"`);
    if (teams.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    const team = teams[0];

    if (team.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    const users = await cos.queryItems('users', 'users', `SELECT * FROM c WHERE c.id = "${userId}"`);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!team.members.includes(userId)) {
      team.members.push(userId);
      team.updatedAt = Date.now();
      await cos.createFamilyItem('teams', 'teams', team);
    }
    res.status(200).json({
      message: 'User added to team successfully',
      team
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ error: 'Failed to add team member' });
  }
});

/*************************************************************
 * TASK ROUTES
 *************************************************************/
router.post('/tasks', authenticateToken, upload.single('taskImage'), async (req, res) => {
  try {
    const { teamId, title, description, status, assignedTo, dueDate } = req.body;
    const teams = await cos.queryItems('teams', 'teams', `SELECT * FROM c WHERE c.id = "${teamId}"`);
    if (teams.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    const team = teams[0];
    if (!team.members.includes(req.user.id) && team.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    const ctime = Date.now();
    const taskImage = req.file ? `/uploads/${req.file.filename}` : null;
    const task = {
      id: crypto.randomUUID(),
      teamId,
      title,
      description,
      taskImage,
      status: status || 'pending',
      assignedTo,
      createdBy: req.user.id,
      createdAt: ctime,
      updatedAt: ctime,
      dueDate: dueDate ? new Date(dueDate).getTime() : null
    };
    await cos.createFamilyItem('tasks', 'tasks', task);
    res.status(201).json({ message: 'Task added successfully', task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.get('/tasks/team/:teamId', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const teams = await cos.queryItems('teams', 'teams', `SELECT * FROM c WHERE c.id = "${teamId}"`);
    if (teams.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    const team = teams[0];
    if (!team.members.includes(req.user.id) && team.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    const tasks = await cos.tasksByCreatedDate('tasks', 'tasks', teamId);
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.get('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const tasks = await cos.queryItems('tasks', 'tasks', `SELECT * FROM c WHERE c.id = "${id}"`);
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const task = tasks[0];
    const teams = await cos.queryItems('teams', 'teams', `SELECT * FROM c WHERE c.id = "${task.teamId}"`);
    if (teams.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    const team = teams[0];
    if (!team.members.includes(req.user.id) && team.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    res.status(200).json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

router.put('/tasks/:id', authenticateToken, upload.single('taskImage'), async (req, res) => {
  try {
    const { id } = req.params;
    const tasks = await cos.queryItems('tasks', 'tasks', `SELECT * FROM c WHERE c.id = "${id}"`);
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const task = tasks[0];
    if (task.assignedTo !== req.user.id && task.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    const { teamId, title, description, status, assignedTo, dueDate } = req.body;
    if (title) task.title = title;
    if (description) task.description = description;
    if (status) task.status = status;
    if (assignedTo) task.assignedTo = assignedTo;
    if (dueDate) task.dueDate = new Date(dueDate).getTime();
    if (req.file) {
      // Remove old image if needed
      if (task.taskImage) {
        const oldImagePath = path.join(__dirname, task.taskImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      task.taskImage = `/uploads/${req.file.filename}`;
    }
    task.updatedAt = Date.now();
    await cos.createFamilyItem('tasks', 'tasks', task);
    res.status(200).json({ message: 'Task updated successfully', task });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.get('/tasks/file/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const tasks = await cos.queryItems('tasks', 'tasks', `SELECT * FROM c WHERE c.id = "${id}"`);
    if (tasks.length === 0 || !tasks[0].taskImage) {
      return res.status(404).json({ error: 'File not found' });
    }
    const task = tasks[0];
    const teams = await cos.queryItems('teams', 'teams', `SELECT * FROM c WHERE c.id = "${task.teamId}"`);
    if (teams.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    const team = teams[0];
    if (!team.members.includes(req.user.id) && team.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    const filePath = path.join(__dirname, task.taskImage);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error retrieving file:', error);
    res.status(500).json({ error: 'Failed to retrieve file' });
  }
});

/*************************************************************
 * AI ROUTES (HTTP-based)
 *************************************************************/

// In-memory states for check-ins
const checkinStates = {};

router.post('/ai/chat', authenticateToken, async (req, res) => {
  try {
    const { message, teamId, taskId, conversationId } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Validate task access if taskId is provided
    if (taskId) {
      const taskValidation = await validateTaskAccess(taskId, userId);
      if (!taskValidation.success) {
        return res.status(taskValidation.status).json({ error: taskValidation.error });
      }
    }

    // If this user doesn't have a check-in state yet
    if (!checkinStates[userId]) {
      // Possibly user typed "start check-in"
      if (message.toLowerCase().includes('start check-in')) {
        checkinStates[userId] = {
          step: 'greeting',
          subConversation: null,
          progress: '',
          challenges: '',
          nextSteps: '',
          conversationId: conversationId || crypto.randomUUID(), // Single conversation for main + subflow
          taskId: taskId || null // Store taskId in the check-in state
        };
        return res.status(200).json({
          message: "Sure! Let's begin your check-in. How has your day been so far?"
        });
      } else {
        // No check-in => standard AI chat
        return handleStandardAiChat(userId, message, teamId, taskId, conversationId, res);
      }
    } else {
      // Store taskId in current check-in state if not already set
      if (taskId && !checkinStates[userId].taskId) {
        checkinStates[userId].taskId = taskId;
      }
      
      // If user has a check-in in progress
      return handleStructuredCheckIn(userId, message, res);
    }

  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

// Helper function to validate task access
async function validateTaskAccess(taskId, userId) {
  try {
    // Find the task
    const tasks = await cos.queryItems('tasks', 'tasks', `SELECT * FROM c WHERE c.id = "${taskId}"`);
    if (tasks.length === 0) {
      return { success: false, status: 404, error: 'Task not found' };
    }
    
    const task = tasks[0];
    
    // Find the team associated with the task
    const teams = await cos.queryItems('teams', 'teams', `SELECT * FROM c WHERE c.id = "${task.teamId}"`);
    if (teams.length === 0) {
      return { success: false, status: 404, error: 'Team not found' };
    }
    
    const team = teams[0];
    
    // Check if user has access to this task via team membership
    if (!team.members.includes(userId) && team.createdBy !== userId) {
      // Additional check for task creator or assignee
      if (task.createdBy !== userId && task.assignedTo !== userId) {
        return { success: false, status: 403, error: 'Insufficient permissions to access this task' };
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error validating task access:', error);
    return { success: false, status: 500, error: 'Error validating task access' };
  }
}

async function handleStructuredCheckIn(userId, message, res) {
  const currentState = checkinStates[userId];

  // If user is in subflow
  if (currentState.subConversation === 'free_form') {
    // if user says "i would like to return to the check-in"
    if (message.toLowerCase().includes('i would like to return to the check-in')) {
      currentState.subConversation = null;
      return res.status(200).json({
        message: "Got it. Let's resume your check-in now. Please continue."
      });
    }
    // else handle free-form in the same conversation
    return handleSubFlowFreeForm(
      userId,
      message,
      currentState.conversationId, // reuse same conversation
      res
    );
  }

  try {
    let responseText = 'Something went wrong. Let’s start again. How has your day been so far?';

    switch (currentState.step) {
      case 'greeting':
        responseText = 'Great! How has your day been so far?';
        currentState.step = 'progress';
        break;

      case 'progress':
        if (message.toLowerCase().includes('question') || message.toLowerCase().includes('bug')) {
          currentState.subConversation = 'free_form';
          return res.status(200).json({
            message: "Let's chat about that in free-form mode. Type 'i would like to return to the check-in' when you're done."
          });
        }
        if (message.length < 10) {
          responseText = "That’s okay! Even small progress counts. Did you run into any challenges today?";
          currentState.step = "challenges";
        } else {
          currentState.progress = message;
          responseText = "That’s awesome! Any challenges you faced today?";
          currentState.step = "challenges";
        }
        break;

      case 'challenges':
        if (message.toLowerCase().includes('question') || message.toLowerCase().includes('help') || message.toLowerCase().includes('bug')) {
          currentState.subConversation = 'free_form';
          return res.status(200).json({
            message: "Sure, let's address that in free-form. Type 'i would like to return to the check-in' when finished."
          });
        }
        if (message.toLowerCase().includes('no') || message.toLowerCase().includes('none')) {
          currentState.challenges = "No major issues reported.";
          responseText = "Alright! What’s the next thing you’ll be working on?";
          currentState.step = "next_steps";
        } else {
          currentState.challenges = message;
          responseText = "Got it. Would you like a suggestion or would you prefer to handle it later?";
          currentState.step = "follow_up";
        }
        break;

      case 'follow_up':
        if (
          message.toLowerCase().includes('not sure') ||
          message.toLowerCase().includes('idk') ||
          message.toLowerCase().includes('help') ||
          message.toLowerCase().includes('question')
        ) {
          currentState.subConversation = 'free_form';
          return res.status(200).json({
            message: "No worries, let's figure it out in free-form mode! Type 'i would like to return to the check-in' to resume."
          });
        }
        responseText = "Noted! What's the next thing you'll be working on?";
        currentState.step = "next_steps";
        break;

        case 'next_steps':
          currentState.nextSteps = message;
          responseText = `Sounds like a plan! Here's a summary of today's check-in:\n
  ✅ Progress: ${currentState.progress || 'Not provided'}
  ⚠️ Issues: ${currentState.challenges}
  🔜 Next Steps: ${currentState.nextSteps}
  ${currentState.taskId ? '🔗 Associated Task: Yes' : ''}
  
  Thank you for checking in and keep up the good work!`;
  
          // Save summary in 'checkins' with taskId
          await cos.createFamilyItem('checkins', 'checkins', {
            id: crypto.randomUUID(),
            userId,
            taskId: currentState.taskId || null, // Store taskId in check-in records
            progress: currentState.progress,
            challenges: currentState.challenges,
            nextSteps: currentState.nextSteps,
            timestamp: Date.now()
          });
  
          delete checkinStates[userId];
          break;

      default:
        currentState.step = 'progress';
        responseText = "Let's start again. How has your day been so far?";
        break;
    }

    return res.status(200).json({ 
      message: responseText,
      taskId: currentState.taskId || null // Return taskId in response
    });
  } catch (error) {
    console.error('Error in structured check-in flow:', error);
    return res.status(500).json({ error: 'Check-in flow failed' });
  }
}

/**
 * handleSubFlowFreeForm
 * 
 * Reuse the *same conversation ID* so that LDA sees everything
 */
async function handleSubFlowFreeForm(userId, userMessage, mainConversationId, res) {
  try {
    // We'll reuse mainConversationId here:
    const convId = mainConversationId;
    
    // Get the taskId from the check-in state if it exists
    const taskId = checkinStates[userId]?.taskId || null;

    // 1) Sentiment
    let sentiment = 'neutral';
    try {
      sentiment = await analyzeSentiment(userMessage);
    } catch (err) {
      console.warn('Sentiment analysis failed:', err.message);
    }

    // 2) Log user message in chatLogs with taskId
    const userLog = {
      id: crypto.randomUUID(),
      userId,
      taskId, // Include taskId in the log
      conversationId: convId,
      message: userMessage,
      sentiment,
      role: 'user',
      timestamp: Date.now()
    };
    await cos.createFamilyItem('chatLogs', 'chatLogs', userLog);

    // Get task context if taskId is available
    let taskContext = '';
    if (taskId) {
      const tasks = await cos.queryItems('tasks', 'tasks', `SELECT * FROM c WHERE c.id = "${taskId}"`);
      if (tasks.length > 0) {
        const task = tasks[0];
        taskContext = `You are assisting with task "${task.title}". Task description: ${task.description}. Current status: ${task.status}.`;
      }
    }

    // 3) Summarize entire conversation so far
    const summary = await summarizeConversation(convId);

    // 4) GPT-4 response
    let systemPrompt = 'You are a helpful AI assistant for subflow discussions.';
    if (taskId) {
      systemPrompt += ' ' + taskContext;
    }
    if (sentiment === 'negative') {
      systemPrompt = 'You are a supportive and encouraging AI assistant, helping users overcome difficulties. ' + (taskContext || '');
    }

    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Here is a summary so far: ${summary}` },
        { role: 'user', content: userMessage }
      ]
    });

    const responseText = completion.data.choices[0].message.content;

    // 5) Log AI response with taskId
    const aiLog = {
      id: crypto.randomUUID(),
      userId,
      taskId, // Include taskId in the log
      conversationId: convId,
      message: responseText,
      sentiment: 'ai-response',
      role: 'assistant',
      timestamp: Date.now()
    };
    await cos.createFamilyItem('chatLogs', 'chatLogs', aiLog);

    return res.status(200).json({
      message: 'Free-form subflow response',
      response: responseText,
      taskId: taskId || null // Return taskId in response
    });

  } catch (error) {
    console.error('Error in free-form subflow:', error);
    return res.status(500).json({ error: 'Subflow chat failed' });
  }
}

/**
 * handleStandardAiChat
 * 
 * If the user is not in a check-in state at all
 */
async function handleStandardAiChat(userId, message, teamId, taskId, conversationId, res) {
  try {
    // Optional team membership check
    if (teamId) {
      const teams = await cos.queryItems('teams', 'teams', `SELECT * FROM c WHERE c.id = "${teamId}"`);
      if (teams.length === 0) {
        return res.status(404).json({ error: 'Team not found' });
      }
      const team = teams[0];
      if (!team.members.includes(userId) && team.createdBy !== userId) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    // Sentiment
    let sentiment = 'neutral';
    try {
      sentiment = await analyzeSentiment(message);
    } catch (err) {
      console.warn('Sentiment analysis failed:', err.message);
    }

    // If no conversationId provided, generate one
    const convId = conversationId || crypto.randomUUID();

    // Log user message with taskId
    const incomingLog = {
      id: crypto.randomUUID(),
      userId,
      teamId: teamId || null,
      taskId: taskId || null, // Store taskId in chat logs
      conversationId: convId,
      message,
      sentiment,
      role: 'user',
      timestamp: Date.now()
    };
    await cos.createFamilyItem('chatLogs', 'chatLogs', incomingLog);

    // Get task details if taskId is provided
    let taskContext = '';
    if (taskId) {
      const tasks = await cos.queryItems('tasks', 'tasks', `SELECT * FROM c WHERE c.id = "${taskId}"`);
      if (tasks.length > 0) {
        const task = tasks[0];
        taskContext = `You are assisting with task "${task.title}". Task description: ${task.description}. Current status: ${task.status}.`;
      }
    }

    // Summarize - now we can filter by both conversationId and taskId if needed
    let summary = await summarizeConversation(convId);
    
    // Tone adjustment
    let systemPrompt = 'You are a helpful assistant for a task management app.';
    if (taskId) {
      systemPrompt += ' ' + taskContext;
    }
    if (sentiment === 'negative') {
      systemPrompt = 'You are a supportive and encouraging AI assistant, helping users overcome difficulties. ' + (taskContext || '');
    }

    // GPT-4
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Here is a summary of past chats: ${summary}` },
        { role: 'user', content: message }
      ]
    });

    const responseText = completion.data.choices[0].message.content;

    // Log AI response with taskId
    const aiLog = {
      id: crypto.randomUUID(),
      userId,
      teamId: teamId || null,
      taskId: taskId || null, // Store taskId in AI response
      conversationId: convId,
      message: responseText,
      sentiment: 'ai-response',
      role: 'assistant',
      timestamp: Date.now()
    };
    await cos.createFamilyItem('chatLogs', 'chatLogs', aiLog);

    return res.status(200).json({
      message: 'AI response generated successfully',
      response: responseText,
      conversationId: convId,
      taskId: taskId || null // Return taskId in response
    });

  } catch (error) {
    console.error('Error handling standard AI chat:', error);
    return res.status(500).json({ error: 'Failed to generate AI response' });
  }
}

router.post('/ai/report', authenticateToken, async (req, res) => {
  try {
    const { teamId, reportType, timeRange } = req.body;
    const teams = await cos.queryItems('teams', 'teams', `SELECT * FROM c WHERE c.id = "${teamId}"`);
    if (teams.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    const team = teams[0];
    if (!team.members.includes(req.user.id) && team.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Get tasks
    const tasks = await cos.tasksByCreatedDate('tasks', 'tasks', teamId);

    // Format data
    const taskData = tasks.map((task) => ({
      title: task.title,
      status: task.status,
      createdAt: new Date(task.createdAt).toISOString().split('T')[0],
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split('T')[0]
        : 'Not set'
    }));

    // Build prompt
    let prompt = `Generate a ${reportType} report for team "${team.name}" with the following task data:\n`;
    prompt += JSON.stringify(taskData, null, 2);
    prompt += `\nTime range: ${timeRange}`;

    // GPT-4
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful assistant for generating team reports.' },
        { role: 'user', content: prompt }
      ]
    });

    const report = completion.data.choices[0].message.content;

    // Save in `reports`
    const reportData = {
      id: crypto.randomUUID(),
      teamId,
      reportType,
      timeRange,
      content: report,
      generatedBy: req.user.id,
      generatedAt: Date.now()
    };
    await cos.createFamilyItem('reports', 'reports', reportData);

    res.status(200).json({
      message: 'Report generated successfully',
      report: reportData
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

/*************************************************************
 * Error Handler
 *************************************************************/
router.use((err, req, res, next) => {
  console.error('API Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

/*************************************************************
 * Socket.io Setup for Private Check-Ins
 *************************************************************/
const setupSocketIO = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: '*'
    }
  });

  // Socket.io middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return next(new Error('Authentication error'));
      socket.user = user;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    // Update to include taskId in room name if provided
    socket.on('joinCheckIn', (data) => {
      const { conversationId, taskId } = typeof data === 'object' ? data : { conversationId: data, taskId: null };
      
      // Join conversation room
      const conversationRoom = `checkin-${conversationId}`;
      socket.join(conversationRoom);
      console.log(`${socket.user.username} joined ${conversationRoom}`);
      
      // Optionally join task-specific room
      if (taskId) {
        const taskRoom = `task-${taskId}`;
        socket.join(taskRoom);
        console.log(`${socket.user.username} joined ${taskRoom}`);
      }
    });

    // Update chatMessage event to handle taskId
    socket.on('chatMessage', async (data) => {
      try {
        const { conversationId, message, taskId } = data;
        const userId = socket.user.id;
        const roomName = `checkin-${conversationId}`;

        // Validate task access if taskId is provided
        if (taskId) {
          const taskValidation = await validateTaskAccess(taskId, userId);
          if (!taskValidation.success) {
            socket.emit('error', { message: taskValidation.error });
            return;
          }
        }

        let sentiment = 'neutral';
        try {
          sentiment = await analyzeSentiment(message);
        } catch (err) {
          console.warn('Sentiment analysis failed:', err.message);
        }

        // Log user message in same conversation with taskId
        const userLog = {
          id: crypto.randomUUID(),
          userId,
          conversationId,
          taskId: taskId || null, // Store taskId
          message,
          sentiment,
          role: 'user',
          timestamp: Date.now()
        };
        await cos.createFamilyItem('chatLogs', 'chatLogs', userLog);

        // Get task context if available
        let taskContext = '';
        if (taskId) {
          const tasks = await cos.queryItems('tasks', 'tasks', `SELECT * FROM c WHERE c.id = "${taskId}"`);
          if (tasks.length > 0) {
            const task = tasks[0];
            taskContext = `You are assisting with task "${task.title}". Task description: ${task.description}. Current status: ${task.status}.`;
          }
        }

        // Summarize - can be filtered by conversationId and taskId
        const summary = await summarizeConversation(conversationId, taskId);

        let systemPrompt = 'You are a helpful AI assistant for user check-ins.';
        if (taskId) {
          systemPrompt += ' ' + taskContext;
        }
        if (sentiment === 'negative') {
          systemPrompt = 'You are a supportive and encouraging AI assistant, helping users overcome difficulties. ' + (taskContext || '');
        }

        // GPT-4
        const completion = await openai.createChatCompletion({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Here is a summary of past chats: ${summary}` },
            { role: 'user', content: message }
          ]
        });
        const responseText = completion.data.choices[0].message.content;

        // Log AI response with taskId
        const aiLog = {
          id: crypto.randomUUID(),
          userId,
          conversationId,
          taskId: taskId || null, // Store taskId
          message: responseText,
          sentiment: 'ai-response',
          role: 'assistant',
          timestamp: Date.now()
        };
        await cos.createFamilyItem('chatLogs', 'chatLogs', aiLog);

        // Emit to conversation room
        io.to(roomName).emit('newMessage', {
          userId,
          username: socket.user.username,
          message,
          aiResponse: responseText,
          sentiment,
          conversationId,
          taskId: taskId || null, // Include taskId in response
          timestamp: Date.now()
        });
        
        // Also emit to task-specific room if available
        if (taskId) {
          const taskRoom = `task-${taskId}`;
          io.to(taskRoom).emit('taskUpdate', {
            taskId,
            conversationId,
            hasNewMessage: true,
            lastMessage: {
              userId,
              username: socket.user.username,
              message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
              timestamp: Date.now()
            }
          });
        }
      } catch (error) {
        console.error('Error handling chatMessage:', error);
        socket.emit('error', { message: 'Error handling chat message' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });

  return io;
};

module.exports = { router, setupSocketIO };
