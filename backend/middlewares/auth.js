const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log("Received Auth Header:", authHeader);

  if (!authHeader) {
    console.log("❌ Authorization header missing");
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Extract token
  if (!token) {
    console.log("❌ Bearer token missing in header");
    return res.status(401).json({ error: "Unauthorized: Token format invalid" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log("❌ Token verification failed:", err.message);
      return res.status(403).json({ error: "Forbidden: Invalid token" });
    }

    console.log("✅ Authenticated user:", user);
    req.user = user;
    next();
  });
}

const authorize = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

module.exports = { authenticateToken, authorize };
