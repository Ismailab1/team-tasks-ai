const jwt = require('jsonwebtoken');

// Get JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Protect routes middleware
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check if auth header exists and has correct format
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      // Or try to get token from cookies
      token = req.cookies.jwt;
    }
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get user from database (or just use decoded data)
      const usersContainer = req.database.container('users');
      const { resources: users } = await usersContainer.items
        .query({
          query: "SELECT * FROM c WHERE c.id = @id",
          parameters: [{ name: "@id", value: decoded.id }]
        })
        .fetchAll();
      
      if (users.length === 0) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      const user = users[0];
      
      // Add user to request object (without the password)
      const { password, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;
      
      // Get user teams for convenience in routes
      const teamsContainer = req.database.container('teams');
      const { resources: teams } = await teamsContainer.items
        .query({
          query: "SELECT c.id FROM c WHERE ARRAY_CONTAINS(c.member_ids, @userId) OR c.created_by = @userId",
          parameters: [{ name: "@userId", value: user.id }]
        })
        .fetchAll();
      
      // Add team IDs to user object
      req.user.teamIds = teams.map(team => team.id);
      
      next();
    } catch (error) {
      console.error('JWT Verification Error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed verification' });
    }
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({ message: 'Server error during authentication' });
  }
};

// Admin-only routes middleware
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized, admin access required' });
  }
};

module.exports = { protect, admin };