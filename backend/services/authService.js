const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// This would be in the database, not just like this
const users = [];

// JWT secret key (Untested and haven't defined one)
const JWT_SECRET = process.env.JWT_SECRET || 'wtv';

// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      name: user.name
    }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );
};

const register = async (name, email, password) => {
  const userExists = users.find(user => user.email === email);
  if (userExists) {
    throw new Error('User already exists');
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = {
    id: Date.now().toString(),
    name,
    email,
    password: hashedPassword
  };

  users.push(user);

  // Generate JWT again
  const token = generateToken(user);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    token
  };
};

const login = async (email, password) => {
  const user = users.find(user => user.email === email);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  // Generate another JWT
  const token = generateToken(user);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    token
  };
};

module.exports = {
  register,
  login,
  generateToken
};