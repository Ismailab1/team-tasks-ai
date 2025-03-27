const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { CosmosClient } = require('@azure/cosmos');

// Get environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

// Cosmos DB setup
const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const databaseId = process.env.COSMOS_DB_DATABASE;
const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);
const usersContainer = database.container('users');

// Register a new user
async function register(userData) {
  try {
    // Check if user already exists
    const { resources: existingUsers } = await usersContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: userData.email }]
      })
      .fetchAll();

    if (existingUsers.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Create user object
    const user = {
      id: generateId(),
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save user to database
    const { resource: createdUser } = await usersContainer.items.create(user);

    // Remove password from response
    const { password, ...userWithoutPassword } = createdUser;

    // Generate JWT token
    const token = generateToken(userWithoutPassword);

    return {
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

// Login user
async function login(credentials) {
  try {
    // Find user by email
    const { resources: users } = await usersContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: credentials.email }]
      })
      .fetchAll();

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    // Generate JWT token
    const token = generateToken(userWithoutPassword);

    return {
      user: userWithoutPassword,
      token
    };
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

// Validate token
async function validateToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user still exists
    const { resources: users } = await usersContainer.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: decoded.id }]
      })
      .fetchAll();

    if (users.length === 0) {
      throw new Error('User not found');
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = users[0];
    
    return userWithoutPassword;
  } catch (error) {
    console.error('Error validating token:', error);
    throw new Error('Invalid token');
  }
}

// Helper function to generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Helper function to generate unique ID
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

module.exports = {
  register,
  login,
  validateToken
};