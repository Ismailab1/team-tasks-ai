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
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY
}));

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

async function summarizeConversation(conversationId) {
  try {
    const chatHistory = await cos.queryItems(
      'chatLogs',
      'chatLogs',
      `SELECT * FROM c WHERE c.conversationId = "${conversationId}" ORDER BY c.timestamp ASC`
    );

    // Only summarize if there's enough data (5 or more messages)
    if (chatHistory.length < 5) return '';

    // 1 topic per 5 messages
    const numTopics = Math.max(1, Math.floor(chatHistory.length / 5));

    const documents = chatHistory.map((chat) => chat.message.split(/\s+/));
    const topics = lda(documents, numTopics, 5); // 5 words per topic

    // Join topics into a single summary string
    return topics.map(topic =>
      topic.map(word => word.term).join(' ')
    ).join('. ');
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
    
    // Check if user already exists
    const existingUsers = await cos.queryItems('users', 'users', 
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
    
    // Remove password from response
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
    const users = await cos.queryItems('users', 'users', 
      `SELECT * FROM c WHERE c.username = "${username}"`
    );
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Remove password from response
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
    const safeUsers = users.map((user) => {
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
    
    // Only admins or the user themselves can access user details
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
    
    // Only admins can update roles
    if (role && req.user.role === 'admin') {
      user.role = role;
    }
    // Update password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    // Update other fields
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
 * TEAM ROUTES (unchanged, for reference)
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
 * TASK ROUTES (unchanged, for reference)
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
router.post('/ai/chat', authenticateToken, async (req, res) => {
  try {
    const { message, teamId, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // If a teamId is provided, check membership (optional)
    if (teamId) {
      const teams = await cos.queryItems('teams', 'teams', `SELECT * FROM c WHERE c.id = "${teamId}"`);
      if (teams.length === 0) {
        return res.status(404).json({ error: 'Team not found' });
      }
      const team = teams[0];
      if (!team.members.includes(req.user.id) && team.createdBy !== req.user.id && req.user.role !== 'admin') {
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

    // Use or create conversation ID
    const convId = conversationId || crypto.randomUUID();

    // Log user message
    const incomingLog = {
      id: crypto.randomUUID(),
      userId: req.user.id,
      teamId: teamId || null,
      conversationId: convId,
      message,
      sentiment,
      role: 'user',
      timestamp: Date.now()
    };
    await cos.createFamilyItem('chatLogs', 'chatLogs', incomingLog);

    // Summarize
    const summary = await summarizeConversation(convId);

    // Tone adjustment
    let systemPrompt = 'You are a helpful assistant for a task management app.';
    if (sentiment === 'negative') {
      systemPrompt = 'You are a supportive and encouraging AI assistant, helping users overcome difficulties.';
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

    // Log AI response
    const aiLog = {
      id: crypto.randomUUID(),
      userId: req.user.id,
      teamId: teamId || null,
      conversationId: convId,
      message: responseText,
      sentiment: 'ai-response',
      role: 'assistant',
      timestamp: Date.now()
    };
    await cos.createFamilyItem('chatLogs', 'chatLogs', aiLog);

    res.status(200).json({
      message: 'AI response generated successfully',
      response: responseText,
      conversationId: convId
    });
  } catch (error) {
    console.error('Error generating AI response:', error);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

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

    // Grab tasks
    const tasks = await cos.tasksByCreatedDate('tasks', 'tasks', teamId);

    // Format for AI
    const taskData = tasks.map((task) => ({
      title: task.title,
      status: task.status,
      createdAt: new Date(task.createdAt).toISOString().split('T')[0],
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split('T')[0]
        : 'Not set'
    }));

    // Prompt
    let prompt = `Generate a ${reportType} report for team "${team.name}" with the following task data:\n`;
    prompt += JSON.stringify(taskData, null, 2);
    prompt += `\nTime range: ${timeRange}`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful assistant for generating team reports.' },
        { role: 'user', content: prompt }
      ]
    });

    const report = completion.data.choices[0].message.content;

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

  // 1) Authenticate the socket via JWT
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

    // NEW: Private check-in rooms
    // The client calls: socket.emit('joinCheckIn', conversationId)
    socket.on('joinCheckIn', (conversationId) => {
      const roomName = `checkin-${conversationId}`;
      socket.join(roomName);
      console.log(`${socket.user.username} joined ${roomName}`);
    });

    // Real-time chat for check-in
    // The client calls: socket.emit('chatMessage', { conversationId, message })
    socket.on('chatMessage', async (data) => {
      try {
        const { conversationId, message } = data;
        const userId = socket.user.id;
        const roomName = `checkin-${conversationId}`;

        // 1) Analyze sentiment
        let sentiment = 'neutral';
        try {
          sentiment = await analyzeSentiment(message);
        } catch (err) {
          console.warn('Sentiment analysis failed:', err.message);
        }

        // 2) Log user message
        const userLog = {
          id: crypto.randomUUID(),
          userId,
          conversationId,
          message,
          sentiment,
          role: 'user',
          timestamp: Date.now()
        };
        await cos.createFamilyItem('chatLogs', 'chatLogs', userLog);

        // 3) Summarize
        const summary = await summarizeConversation(conversationId);

        // 4) Tone adjustment
        let systemPrompt = 'You are a helpful AI assistant for user check-ins.';
        if (sentiment === 'negative') {
          systemPrompt =
            'You are a supportive and encouraging AI assistant, helping users overcome difficulties.';
        }

        // 5) GPT-4 response
        const completion = await openai.createChatCompletion({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Here is a summary of past chats: ${summary}` },
            { role: 'user', content: message }
          ]
        });
        const responseText = completion.data.choices[0].message.content;

        // 6) Log AI response
        const aiLog = {
          id: crypto.randomUUID(),
          userId,
          conversationId,
          message: responseText,
          sentiment: 'ai-response',
          role: 'assistant',
          timestamp: Date.now()
        };
        await cos.createFamilyItem('chatLogs', 'chatLogs', aiLog);

        // 7) Broadcast result to the private check-in room
        io.to(roomName).emit('newMessage', {
          userId,
          username: socket.user.username,
          message,
          aiResponse: responseText,
          sentiment,
          conversationId,
          timestamp: Date.now()
        });
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

// Export the Express router + Socket.io setup
module.exports = { router, setupSocketIO };
// END