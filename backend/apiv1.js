const express = require('express');
const { router: authRoutes } = require('./routes/authRoutes');
const { router: userRoutes } = require('./routes/userRoutes');
const { router: teamRoutes } = require('./routes/teamRoutes');
const { router: taskRoutes } = require('./routes/taskRoutes');
const { router: aiRoutes } = require('./routes/aiRoutes');
const { setupSocketIO } = require('./sockets/socketHandler');

const http = require('http');
const app = express();
const server = http.createServer(app);
const io = setupSocketIO(server);

app.use(express.json());
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/teams', teamRoutes);
app.use('/tasks', taskRoutes);
app.use('/ai', aiRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
