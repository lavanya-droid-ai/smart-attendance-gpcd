const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { SOCKET_EVENTS } = require('./config/constants');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// --------------- Socket.io Setup ---------------

const socketOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : ['http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: socketOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on(SOCKET_EVENTS.JOIN_SESSION, (sessionId) => {
    socket.join(`session:${sessionId}`);
    console.log(`Socket ${socket.id} joined session ${sessionId}`);
  });

  socket.on(SOCKET_EVENTS.LEAVE_SESSION, (sessionId) => {
    socket.leave(`session:${sessionId}`);
    console.log(`Socket ${socket.id} left session ${sessionId}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${socket.id} (${reason})`);
  });
});

// Make io accessible to route handlers via app
app.set('io', io);

// --------------- Start Server ---------------

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`  Smart Attendance System API`);
      console.log(`  Govt. Physiotherapy College`);
      console.log(`  Domain: sybpt.gpcd.edu.in`);
      console.log(`========================================`);
      console.log(`  Environment : ${process.env.NODE_ENV}`);
      console.log(`  Port        : ${PORT}`);
      console.log(`  CORS Origin : ${process.env.CORS_ORIGIN}`);
      console.log(`========================================\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  server.close(() => {
    console.log('HTTP server closed.');

    const mongoose = require('mongoose');
    mongoose.connection.close(false).then(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

startServer();
