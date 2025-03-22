const jwt = require('jsonwebtoken');

// JWT secret key (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const protect = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Set user data from token payload
    req.user = decoded;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };