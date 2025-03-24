const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

const setupSocketIO = (server) => {
  const io = socketIo(server, { cors: { origin: '*' } });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) return next(new Error('Authentication error'));
      socket.user = user;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`);
  });

  return io;
};

module.exports = { setupSocketIO };
