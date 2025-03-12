/**
 * server.js
 * Main server entry point for the team task management application
 */

// Core dependencies
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import application routes and socket setup
const { router: appRouter, setupSocketIO } = require('./appv1.js');
const cos = require('./cosmos0-1.js');

// Create Express application
const app = express();

// Initialize server
const server = http.createServer(app);

// Setup logging
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'logs', 'access.log'),
  { flags: 'a' }
);

// Create logs directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, 'logs'))) {
  fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });
}

// Configure middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS support
app.use(morgan(logFormat, { stream: accessLogStream })); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize CosmosDB connection
async function initializeDatabase() {
  try {
    // Ensure all required containers exist
    const containers = [
      { id: 'users', partitionKey: 'id' },
      { id: 'teams', partitionKey: 'id' },
      { id: 'tasks', partitionKey: 'id' },
      { id: 'chatLogs', partitionKey: 'conversationId' },
      { id: 'checkins', partitionKey: 'userId' },
      { id: 'reports', partitionKey: 'teamId' }
    ];

    for (const container of containers) {
      await cos.createContainerIfNotExists(container.id, container.partitionKey);
    }
    
    console.log('Database initialization successful');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// API Routes
app.use('/api', appRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', version: '1.0', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler for 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Setup Socket.IO
const io = setupSocketIO(server);

// Server initialization
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize database after server starts
  await initializeDatabase();
  
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Socket.IO initialized and ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

module.exports = { app, server };