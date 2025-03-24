const request = require("supertest");
const server = require("../server"); // Ensure correct server import
const jwt = require("jsonwebtoken");
const cos = require("../cosmos0-1");
require("dotenv").config();

beforeAll(async () => {
  console.log("🔹 Initializing test database...");
  await cos.initializeDatabase("testdb");
  console.log("✅ Test database initialized");

  console.log("🚀 Starting server for tests...");
  global.testServer = server.listen(4001, () => console.log("✅ Test server running on port 4001"));

  // 🔹 Perform login and dynamically store credentials
  const loginResponse = await request(server)
    .post("/api/auth/login")
    .send({ username: "apitestuser", password: "securepassword" })
    .expect(200);

  console.log("🔹 Login Response:", loginResponse.body);
  global.authToken = loginResponse.body.token;
  global.TEST_USER_ID = loginResponse.body.user.id;

  // 🔹 Store credentials in environment variables (mimicking frontend caching)
  process.env.TEST_AUTH_TOKEN = global.authToken;
  process.env.TEST_USER_ID = global.TEST_USER_ID;

  // 🔹 Create a test team and store the ID dynamically
  const teamResponse = await request(server)
    .post("/api/teams")
    .set("Authorization", `Bearer ${global.authToken}`)
    .send({ name: "Test Team", description: "For API testing" })
    .expect(201);

  global.TEST_TEAM_ID = teamResponse.body.team.id;
  process.env.TEST_TEAM_ID = global.TEST_TEAM_ID;

  console.log("🔹 Stored TEST_TEAM_ID:", global.TEST_TEAM_ID);
});

afterAll(async () => {
  console.log("🛑 Closing test server...");
  global.testServer.close();
});

describe("API Integration Tests", () => {
  test("Should register a user", async () => {
    const response = await request(server)
      .post("/api/auth/register")
      .send({
        username: "apitestuser",
        email: "apitest@example.com",
        password: "securepassword",
      });

    expect([201, 409]).toContain(response.status); // 201 success, 409 if user exists

    if (response.status === 201) {
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.username).toBe("apitestuser");
    } else {
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toBe("User already exists");
    }
  });

  test("Should login user and return JWT dynamically", async () => {
    const response = await request(server)
      .post("/api/auth/login")
      .send({ username: "apitestuser", password: "securepassword" })
      .expect(200);

    console.log("🔹 Login Response:", response.body);
    global.authToken = response.body.token;
    global.TEST_USER_ID = response.body.user.id;

    // Store dynamically for reuse
    process.env.TEST_AUTH_TOKEN = response.body.token;
    process.env.TEST_USER_ID = response.body.user.id;

    expect(response.body).toHaveProperty("token");
  });

  test("Should create a team and assign creator as team admin dynamically", async () => {
    const response = await request(server)
      .post("/api/teams")
      .set("Authorization", `Bearer ${global.authToken}`)
      .send({ name: "API Test Team", description: "Testing API Routes" })
      .expect(201);

    console.log("🔹 Team Creation Response:", response.body);
    global.TEST_TEAM_ID = response.body.team.id; // Capture team ID dynamically

    // Store in env variable for consistency
    process.env.TEST_TEAM_ID = response.body.team.id;

    expect(response.body.team).toHaveProperty("id");
    expect(response.body.team.roles).toHaveProperty(global.TEST_USER_ID, "admin");
  });

  test("Should create a task dynamically", async () => {
    const response = await request(server)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${global.authToken}`)
      .send({
        teamId: global.TEST_TEAM_ID, // Ensure latest team ID is used
        title: "API Test Task",
        description: "Testing Task Creation",
      })
      .expect(201);

    console.log("🔹 Task Creation Response:", response.body);
    global.TEST_TASK_ID = response.body.task.id; // Capture task ID dynamically

    // Store task ID in env variable for later use
    process.env.TEST_TASK_ID = response.body.task.id;

    expect(response.body.task).toHaveProperty("id");
    expect(response.body.task.title).toBe("API Test Task");
  });

  test("Should return 401 for unauthorized access", async () => {
    await request(server).get("/api/teams").expect(401);
  });

  test("Should return 403 for forbidden action dynamically", async () => {
    const fakeToken = jwt.sign({ id: "fakeUserId" }, process.env.JWT_SECRET, { expiresIn: "1h" });

    await request(server)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${fakeToken}`)
      .send({
        teamId: global.TEST_TEAM_ID, // Use latest dynamically captured team ID
        title: "API Test Task",
        description: "Testing Task Creation",
      })
      .expect(403);
  });
});
