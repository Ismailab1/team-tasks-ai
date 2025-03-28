const request = require("supertest");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const BASE_URL = "https://team-tasks-ai.azurewebsites.net/api"; // Azure Functions base URL

let authToken, conversationId, taskId, teamId, userId;

beforeAll(async () => {
  console.log("🔹 Initializing test setup...");

  // 🔹 Perform login and dynamically store credentials
  const loginResponse = await request(BASE_URL)
    .post("/auth/login")
    .send({ username: "apitestuser", password: "securepassword" })
    .expect(200);

  console.log("🔹 Login Response:", loginResponse.body);
  authToken = loginResponse.body.token;
  userId = loginResponse.body.user.id;

  // Store in environment variables (simulating frontend caching)
  process.env.TEST_AUTH_TOKEN = authToken;
  process.env.TEST_USER_ID = userId;

  // 🔹 Create a test team dynamically
  const teamResponse = await request(BASE_URL)
    .post("/teams")
    .set("Authorization", `Bearer ${authToken}`)
    .send({ name: "API Test Team", description: "Testing AI Features" })
    .expect(201);

  teamId = teamResponse.body.team.id;
  process.env.TEST_TEAM_ID = teamId;

  console.log("🔹 Stored TEST_TEAM_ID:", teamId);

  // 🔹 Create a test task dynamically
  const taskResponse = await request(BASE_URL)
    .post("/tasks")
    .set("Authorization", `Bearer ${authToken}`)
    .send({ teamId, title: "AI Test Task", description: "Testing AI Chat" })
    .expect(201);

  taskId = taskResponse.body.task.id;
  process.env.TEST_TASK_ID = taskId;

  console.log("🔹 Stored TEST_TASK_ID:", taskId);
});

afterAll(() => {
  console.log("🛑 Test suite completed.");
});

describe("AI API Integration Tests", () => {
  test("Should generate an AI chat response", async () => {
    const response = await request(BASE_URL)
      .post("/ai/chat")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        message: "What tasks do I have today?",
        teamId,
        taskId,
      })
      .expect(200);

    console.log("🔹 AI Chat Response:", response.body);
    conversationId = response.body.conversationId; // Capture conversation ID dynamically

    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("conversationId");
  });

  test("Should continue AI chat conversation", async () => {
    const response = await request(BASE_URL)
      .post("/ai/chat")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        message: "Can you summarize my task?",
        conversationId,
        teamId,
        taskId,
      })
      .expect(200);

    console.log("🔹 AI Follow-up Chat Response:", response.body);
    expect(response.body).toHaveProperty("message");
  });

  test("Should start a structured check-in session", async () => {
    const response = await request(BASE_URL)
      .post("/ai/chat")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        message: "I want to do a check-in",
        teamId,
        taskId,
      })
      .expect(200);

    console.log("🔹 Check-in Start Response:", response.body);
    conversationId = response.body.conversationId; // Store conversation ID for structured check-in

    expect(response.body).toHaveProperty("message");
  });

  test("Should proceed with structured check-in", async () => {
    const response = await request(BASE_URL)
      .post("/ai/chat")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        message: "I made progress on my task",
        conversationId,
        teamId,
        taskId,
      })
      .expect(200);

    console.log("🔹 Check-in Progress Response:", response.body);
    expect(response.body).toHaveProperty("message");
  });

  test("Should generate an AI report", async () => {
    jest.setTimeout(15000); // Increase timeout for report generation

    const response = await request(BASE_URL)
      .post("/ai/report")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        teamId,
        reportType: "task_summary",
        timeRange: "last 7 days",
      })
      .expect(200);

    console.log("🔹 AI Report Response:", response.body);
    expect(response.body).toHaveProperty("report");
  });

  test("Should return 401 for unauthorized AI chat", async () => {
    await request(BASE_URL)
      .post("/ai/chat")
      .send({
        message: "This should fail",
        teamId,
        taskId,
      })
      .expect(401);
  });

  test("Should return 403 for forbidden AI chat", async () => {
    const fakeToken = jwt.sign({ id: "fakeUserId" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    await request(BASE_URL)
      .post("/ai/chat")
      .set("Authorization", `Bearer ${fakeToken}`)
      .send({
        message: "Unauthorized message",
        teamId,
        taskId,
      })
      .expect(403);
  });
});