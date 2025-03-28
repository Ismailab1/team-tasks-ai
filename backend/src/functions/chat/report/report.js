const { app } = require('@azure/functions');
const { authenticateToken } = require('../../../middlewares/auth');
const { createChatCompletion } = require('../../../services/openaiService');
const cos = require('../../../cosmos0-1');
const crypto = require('crypto');

app.http('report', {
  methods: ['POST'],
  authLevel: 'function',
  handler: async (request, context) => {
    try {
      const user = await authenticateToken(request); // Authenticate user
      const { teamId, reportType, timeRange } = await request.json();
      const userId = user.id;

      // Check team permissions
      const teams = await cos.queryItems("testdb", "teams", `SELECT * FROM c WHERE c.id = "${teamId}"`);
      if (!teams.length) {
        return { status: 404, body: { error: "Team not found" } };
      }
      const team = teams[0];
      if (!team.members.includes(userId) && team.createdBy !== userId && user.role !== "admin") {
        return { status: 403, body: { error: "Insufficient permissions" } };
      }

      // Fetch tasks for the team
      const tasks = await cos.tasksByCreatedDate("testdb", "tasks", teamId);
      const taskData = tasks.map(task => ({
        title: task.title,
        status: task.status,
        createdAt: new Date(task.createdAt).toISOString().split("T")[0],
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "Not set",
      }));

      // Generate AI report
      const prompt = `Generate a ${reportType} report for team "${team.name}" with the following task data:\n${JSON.stringify(taskData, null, 2)}\nTime range: ${timeRange}`;
      const report = await createChatCompletion([
        { role: "system", content: "You are a helpful assistant for generating team reports." },
        { role: "user", content: prompt },
      ]);

      // Save report to database
      const reportData = {
        id: crypto.randomUUID(),
        teamId,
        reportType,
        timeRange,
        content: report,
        generatedBy: userId,
        generatedAt: Date.now(),
      };
      await cos.createFamilyItem("testdb", "reports", reportData);

      return { status: 200, body: { message: "Report generated successfully", report: reportData } };
    } catch (error) {
      context.log.error("❌ Error generating AI report:", error);
      return { status: 500, body: { error: "Failed to generate report" } };
    }
  }
});