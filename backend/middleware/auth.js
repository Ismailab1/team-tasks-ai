const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const usersDir = path.join(__dirname, '../local-db/users');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('Authorization')?.split(' ')[1]; // Bearer TOKEN
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists
    const userPath = path.join(usersDir, `${decoded.id}.json`);
    if (!fs.existsSync(userPath)) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};