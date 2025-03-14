const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const { createChatCompletion, analyzeSentiment } = require('../services/openaiService');
const cos = require('../cosmos0-1');

const router = express.Router();

const checkinStates = {};

router.post("/chat", authenticateToken, async (req, res) => {
  try {
    console.log("📢 AI Chat API Called");
    console.log("🔹 Request Body:", req.body);

    const { message, teamId, taskId, conversationId } = req.body;
    const userId = req.user.id;

    if (!message) {
      console.warn("⚠️ Missing message in request");
      return res.status(400).json({ error: "Message is required" });
    }

    // ✅ FIX: Check if the user has permission to chat in this team
    const team = await cos.queryItems("testdb", "teams", `SELECT * FROM c WHERE c.id = "${teamId}"`);
    if (!team.length) {
      return res.status(404).json({ error: "Team not found" });
    }
    
    if (!team[0].members.includes(userId) && team[0].createdBy !== userId) {
      console.warn("⚠️ User does not have permission to chat");
      return res.status(403).json({ error: "Forbidden: You do not have access to this team's chat." });
    }

    const convId = conversationId || crypto.randomUUID();
    console.log(`🔹 User ${userId} started chat in conversation ${convId}`);

    // Save user message to chatLogs
    const userLog = {
      id: crypto.randomUUID(),
      userId,
      teamId,
      taskId,
      conversationId: convId,
      message,
      role: "user",
      timestamp: Date.now()
    };
    await cos.createFamilyItem("testdb", "chatLogs", userLog);

    console.log("📨 Sending message to Azure OpenAI...");
    const responseText = await createChatCompletion([
      { role: "system", content: "You are a helpful assistant for task management." },
      { role: "user", content: message }
    ]);

    console.log("🔹 AI Response:", responseText);

    // Save AI response to chatLogs
    const aiLog = {
      id: crypto.randomUUID(),
      userId,
      teamId,
      taskId,
      conversationId: convId,
      message: responseText,
      role: "assistant",
      timestamp: Date.now()
    };
    await cos.createFamilyItem("testdb", "chatLogs", aiLog);

    res.status(200).json({ message: responseText, conversationId: convId, taskId });
  } catch (error) {
    console.error("❌ AI Chat Error:", error);
    res.status(500).json({ error: "Failed to generate AI response" });
  }
});


// Helper function to validate task access
async function validateTaskAccess(taskId, userId) {
  try {
    // Find the task
    const tasks = await cos.queryItems('testdb', 'tasks', `SELECT * FROM c WHERE c.id = "${taskId}"`);
    if (tasks.length === 0) {
      return { success: false, status: 404, error: 'Task not found' };
    }
    
    const task = tasks[0];
    
    // Find the team associated with the task
    const teams = await cos.queryItems('testdb', 'teams', `SELECT * FROM c WHERE c.id = "${task.teamId}"`);
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
          await cos.createFamilyItem('testdb', 'checkins', {
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
    await cos.createFamilyItem('testdb', 'chatLogs', userLog);

    // Get task context if taskId is available
    let taskContext = '';
    if (taskId) {
      const tasks = await cos.queryItems('testdb', 'tasks', `SELECT * FROM c WHERE c.id = "${taskId}"`);
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
    await cos.createFamilyItem('testdb', 'chatLogs', aiLog);

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
      const teams = await cos.queryItems('testdb', 'teams', `SELECT * FROM c WHERE c.id = "${teamId}"`);
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
    await cos.createFamilyItem('testdb', 'chatLogs', incomingLog);

    // Get task details if taskId is provided
    let taskContext = '';
    if (taskId) {
      const tasks = await cos.queryItems('testdb', 'tasks', `SELECT * FROM c WHERE c.id = "${taskId}"`);
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
    await cos.createFamilyItem('testdb', 'chatLogs', aiLog);

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

router.post("/report", authenticateToken, async (req, res) => {
  try {
    console.log("📢 AI Report API Called");
    console.log("🔹 Request Body:", req.body);

    const { teamId, reportType, timeRange } = req.body;
    const userId = req.user.id;

    console.log(`🔹 Fetching team by ID: ${teamId}`);
    const teams = await cos.queryItems("testdb", "teams", `SELECT * FROM c WHERE c.id = "${teamId}"`);

    if (teams.length === 0) {
      console.warn("⚠️ Team not found:", teamId);
      return res.status(404).json({ error: "Team not found" });
    }

    const team = teams[0];
    console.log("🔹 Team Query Result:", team);

    if (!team.members.includes(userId) && team.createdBy !== userId && req.user.role !== "admin") {
      console.warn("⚠️ User lacks permissions:", userId);
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    console.log("🔹 Fetching tasks for team...");
    const tasks = await cos.tasksByCreatedDate("testdb", "tasks", teamId);

    const taskData = tasks.map((task) => ({
      title: task.title,
      status: task.status,
      createdAt: new Date(task.createdAt).toISOString().split("T")[0],
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "Not set",
    }));

    console.log("📨 Generating AI report...");
    const prompt = `Generate a ${reportType} report for team "${team.name}" with the following task data:\n${JSON.stringify(taskData, null, 2)}\nTime range: ${timeRange}`;

    // ✅ FIX: Use createChatCompletion instead of openai.createChatCompletion
    const report = await createChatCompletion([
      { role: "system", content: "You are a helpful assistant for generating team reports." },
      { role: "user", content: prompt },
    ]);

    console.log("🔹 AI Report Generated:", report);

    const reportData = {
      id: crypto.randomUUID(),
      teamId,
      reportType,
      timeRange,
      content: report,
      generatedBy: userId,
      generatedAt: Date.now(),
    };

    console.log("💾 Saving report to database...");
    await cos.createFamilyItem("testdb", "reports", reportData);

    res.status(200).json({ message: "Report generated successfully", report: reportData });
  } catch (error) {
    console.error("❌ Error generating AI report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});


module.exports = { router };
