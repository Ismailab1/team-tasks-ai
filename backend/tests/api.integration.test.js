const request = require("supertest");
require("dotenv").config();

const BASE_URL = process.env.BASE_URL; // Azure Functions base URL
const LOGIN_URL = `${BASE_URL}/users?code=${process.env.LOGIN_FUNCTION_CODE}`; // Login function URL
const REGISTER_URL = `${BASE_URL}/register?code=${process.env.REGISTER_FUNCTION_CODE}`; // Register function URL
const CREATE_TEAM_URL = `${BASE_URL}/createTeam?code=${process.env.CREATE_TEAM_FUNCTION_CODE}`; // Create team function URL
const CREATE_TASK_URL = `${BASE_URL}/createTask?code=${process.env.CREATE_TASK_FUNCTION_CODE}`; // Create task function URL
const GET_TASKS_URL = `${BASE_URL}/getTasksForTeam?code=${process.env.GET_TASKS_FUNCTION_CODE}`; // Get tasks for team function URL

let authToken;
let testUserId;
let testTeamId;
let testTaskId;

beforeAll(async () => {
  console.log("🔹 Initializing test setup...");

  try {
    // 🔹 Perform login to get auth token
    const loginResponse = await request(LOGIN_URL)
      .post("")
      .send({ username: "apitestuser", password: "securepassword" })
      .expect(200);

    console.log("🔹 Login Response:", loginResponse.body);
    authToken = loginResponse.body.token;
    testUserId = loginResponse.body.user.id;

    // 🔹 Create a test team
    const teamResponse = await request(CREATE_TEAM_URL)
      .post("")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "Test Team", description: "For API testing" })
      .expect(201);

    testTeamId = teamResponse.body.team.id;
    console.log("🔹 Created Test Team ID:", testTeamId);
  } catch (error) {
    console.error("❌ Failed to initialize test setup:", error.message);
    throw error;
  }
});

afterAll(() => {
  console.log("🛑 Test suite completed.");
});

describe("API Integration Tests", () => {
  test("Should register a user", async () => {
    const response = await request(REGISTER_URL)
      .post("")
      .send({
        username: "newapitestuser",
        email: "newapitest@example.com",
        password: "securepassword",
      })
      .expect([201, 409]); // 201 success, 409 if user already exists

    if (response.status === 201) {
      console.log("🔹 User registered successfully:", response.body.user);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.username).toBe("newapitestuser");
    } else {
      console.log("⚠️ User already exists:", response.body.error);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("User already exists");
    }
  });

  test("Should login user and return JWT", async () => {
    const response = await request(LOGIN_URL)
      .post("")
      .send({ username: "apitestuser", password: "securepassword" })
      .expect(200);

    console.log("🔹 Login Response:", response.body);
    authToken = response.body.token;
    testUserId = response.body.user.id;

    expect(response.body).toHaveProperty("token");
    expect(response.body.user).toHaveProperty("id", testUserId);
  });

  test("Should create a team and assign creator as admin", async () => {
    const response = await request(CREATE_TEAM_URL)
      .post("")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "API Test Team", description: "Testing API Routes" })
      .expect(201);

    console.log("🔹 Team Creation Response:", response.body);
    testTeamId = response.body.team.id;

    expect(response.body.team).toHaveProperty("id");
    expect(response.body.team.roles).toHaveProperty(testUserId, "admin");
  });

  test("Should create a task for the team", async () => {
    const response = await request(CREATE_TASK_URL)
      .post("")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        teamId: testTeamId,
        title: "API Test Task",
        description: "Testing Task Creation",
      })
      .expect(201);

    console.log("🔹 Task Creation Response:", response.body);
    testTaskId = response.body.task.id;

    expect(response.body.task).toHaveProperty("id");
    expect(response.body.task.title).toBe("API Test Task");
  });

  test("Should fetch tasks for the team", async () => {
    const response = await request(GET_TASKS_URL)
      .get(`/${testTeamId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    console.log("🔹 Tasks for Team:", response.body);
    expect(Array.isArray(response.body.tasks)).toBe(true);
    expect(response.body.tasks.some((task) => task.id === testTaskId)).toBe(true);
  });

  test("Should return 401 for unauthorized access", async () => {
    await request(GET_TASKS_URL).get(`/${testTeamId}`).expect(401);
  });

  test("Should return 403 for forbidden action", async () => {
    const fakeToken = "Bearer invalidToken";

    await request(CREATE_TASK_URL)
      .post("")
      .set("Authorization", fakeToken)
      .send({
        teamId: testTeamId,
        title: "Unauthorized Task",
        description: "This should fail",
      })
      .expect(403);
  });
});