const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const {createServer} = require('http');
const {Server} = require('socket.io');
require('./src/config/db');
const auth = require('./src/routes/authRouter');
const post = require('./src/routes/postRouter');
const convo = require('./src/routes/convoRouter');
const settings = require('./src/routes/settingsRouter');
const userActivities = require('./src/routes/userActivities');
const passport = require('./src/config/passportConfig');
const questionRouter = require('./src/routes/questionRouter');
const session = require('express-session');

dotenv.config();

app.use(express.json());
// app.use(cors({
//   origin: ["*"],
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   credentials: true
// }));
app.use(cors());
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    message: 'Backend server is running'
  });
});

// You can also add a root endpoint that provides helpful information
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Blunt API server is running',
    apiDocs: '/api-docs', // If you add API documentation in the future
    healthCheck: '/api/health',
    endpoints: [
      { path: '/api/auth', description: 'Authentication endpoints' },
      { path: '/api/post', description: 'Post management endpoints' },
      { path: '/api/convo', description: 'Conversation endpoints' },
      { path: '/api/settings', description: 'User settings endpoints' }
    ]
  });
});

app.use('/api/auth', auth);
app.use(passport.initialize());
app.use('/api/post', post);
app.use('/api/convo', convo);
app.use('/api/settings', settings);
app.use('/api', userActivities);
app.use('/api/assessment', questionRouter);
app.use(passport.session());

// Create an HTTP server and integrate it with your Express app
const httpServer = createServer(app);

// Create a Socket.IO server and attach it to the HTTP server
const io = new Server(httpServer, {
    cors: {
        origin: ["*"],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Enhanced tracking for debugging
const activeUsers = new Map();
const roomParticipants = new Map();

io.on('connection', (socket) => {
  console.log(`New client connected with socket ID: ${socket.id}`);

  socket.on('setup', (userId) => {
    // Store user in active users map with socket id
    activeUsers.set(socket.id, userId);
    
    socket.join(userId);
    socket.emit('connected');
    console.log(`User setup completed - UserID: ${userId}, SocketID: ${socket.id}`);
    console.log(`Active users: ${activeUsers.size}`);
    
    // Log all active connections
    console.log('Current active users:');
    activeUsers.forEach((id, socketId) => {
      console.log(`Socket: ${socketId} - User: ${id}`);
    });
  });

  socket.on('join chat', (room) => {
    socket.join(room);
    
    // Track room participants
    if (!roomParticipants.has(room)) {
      roomParticipants.set(room, new Set());
    }
    
    const userId = activeUsers.get(socket.id);
    roomParticipants.get(room).add(userId);
    
    console.log(`User ${userId} (Socket: ${socket.id}) joined room: ${room}`);
    console.log(`Room ${room} participants: ${Array.from(roomParticipants.get(room)).join(', ')}`);
    
    // Get all clients in the room
    io.in(room).fetchSockets().then(sockets => {
      console.log(`Number of clients in room ${room}: ${sockets.length}`);
    }).catch(err => {
      console.error(`Error fetching sockets in room ${room}:`, err);
    });
  });

  socket.on('leave chat', (room) => {
    socket.leave(room);
    
    // Update room participants
    if (roomParticipants.has(room)) {
      const userId = activeUsers.get(socket.id);
      roomParticipants.get(room).delete(userId);
      console.log(`User ${userId} (Socket: ${socket.id}) left room: ${room}`);
      
      if (roomParticipants.get(room).size === 0) {
        roomParticipants.delete(room);
        console.log(`Room ${room} is now empty and has been removed`);
      } else {
        console.log(`Room ${room} participants: ${Array.from(roomParticipants.get(room)).join(', ')}`);
      }
    }
  });

  socket.on('new message', (newMessageReceived) => {
    var chat = newMessageReceived.chat;

    if (!chat.users) {
      console.log('ERROR: chat.users not defined in message:', JSON.stringify(newMessageReceived, null, 2));
      return;
    }

    console.log(`New message in chat ${chat._id} from ${newMessageReceived.sender._id}`);
    console.log(`Broadcasting to ${chat.users.length} users`);

    chat.users.forEach((user) => {
      if (user._id !== newMessageReceived.sender._id) {
        console.log(`Emitting message to user: ${user._id}`);
        socket.in(user._id).emit('message received', newMessageReceived);
      }
    });
    
    // Emit the message to the chat room
    console.log(`Emitting message to room: ${chat._id}`);
    socket.to(chat._id).emit('message received', newMessageReceived);
  });

  socket.on('new message request', (messageRequest) => {
    console.log(`New message request from ${messageRequest.sender} to ${messageRequest.receiver}`);
    socket.to(messageRequest.receiver).emit('message request received', messageRequest);
  });

  socket.on('message request handled', (updatedRequest) => {
    console.log(`Message request handled: ${updatedRequest.status} (from ${updatedRequest.sender})`);
    socket.to(updatedRequest.sender).emit('message request status updated', updatedRequest);
  });

  socket.on('disconnect', () => {
    const userId = activeUsers.get(socket.id);
    console.log(`User disconnected - UserID: ${userId}, SocketID: ${socket.id}`);
    
    // Clean up rooms this user was in
    roomParticipants.forEach((participants, room) => {
      if (participants.has(userId)) {
        participants.delete(userId);
        console.log(`User ${userId} removed from room ${room}`);
        
        if (participants.size === 0) {
          roomParticipants.delete(room);
          console.log(`Room ${room} is now empty and has been removed`);
        }
      }
    });
    
    // Remove from active users
    activeUsers.delete(socket.id);
    console.log(`Remaining active users: ${activeUsers.size}`);
  });
});

// Start the HTTP server
httpServer.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
    console.log('Socket.IO server is running...');
});

// app.listen(process.env.PORT, () => {
//     console.log(`Server is running on port ${process.env.PORT}`);
// })



