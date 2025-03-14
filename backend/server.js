const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");
const fs = require("fs");

// Load environment variables
dotenv.config();

// Import routes
const { router: authRoutes } = require("./routes/authRoutes");
const { router: userRoutes } = require("./routes/userRoutes");
const { router: teamRoutes } = require("./routes/teamRoutes");
const { router: taskRoutes } = require("./routes/taskRoutes");
const { router: aiRoutes } = require("./routes/aiRoutes");
const { initializeDatabase } = require("./services/dbService");

// Create Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

// Mount routes
console.log("🔹 Mounting API routes...");
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/ai", aiRoutes);

// Error Handling
app.use((req, res) => res.status(404).json({ error: "Not Found" }));
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
});

// Server initialization
const PORT = process.env.PORT || 3000;

async function startServer() {
  await initializeDatabase();
  return server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

// Prevent starting the server in test mode
if (require.main === module) {
  startServer();
}

module.exports = server;
