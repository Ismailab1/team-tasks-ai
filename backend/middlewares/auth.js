const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

// Helper function to authenticate token
async function authenticateToken(request) {
  const authHeader = request.headers['authorization'];
  console.log("Received Auth Header:", authHeader);

  if (!authHeader) {
    console.log("❌ Authorization header missing");
    throw new Error("Unauthorized: No token provided");
  }

  const token = authHeader.split(" ")[1]; // Extract token
  if (!token) {
    console.log("❌ Bearer token missing in header");
    throw new Error("Unauthorized: Token format invalid");
  }

  try {
    const user = jwt.verify(token, jwtSecret);
    console.log("✅ Authenticated user:", user);
    return user;
  } catch (err) {
    console.log("❌ Token verification failed:", err.message);
    throw new Error("Forbidden: Invalid token");
  }
}

// Helper function to authorize roles
function authorize(user, roles) {
  if (!user || !roles.includes(user.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }
}

module.exports = { authenticateToken, authorize };