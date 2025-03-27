require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { CosmosClient } = require('@azure/cosmos');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const teamRoutes = require('./routes/teams');
const taskRoutes = require('./routes/tasks');
const reportRoutes = require('./routes/reports');
const userRoutes = require('./routes/users');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Database setup
const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const databaseId = process.env.COSMOS_DB_DATABASE;

// Initialize Cosmos client
const client = new CosmosClient({ 
  endpoint, 
  key,
  connectionPolicy: {
    requestTimeout: 30000
  }
});

// Setup database context for routes
app.use((req, res, next) => {
  req.dbClient = client;
  req.database = client.database(databaseId);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong',
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database endpoint: ${endpoint}`);
});

module.exports = app; // For testing