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
const userActivities = require('./src/routes/userActivities');
const passport = require('./src/config/passportConfig');
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

app.use('/api/auth', auth);
app.use(passport.initialize());
app.use('/api/post', post);
app.use('/api/convo', convo);
app.use('/api', userActivities);
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

const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('setup', (userId) => {
    socket.join(userId);
    socket.emit('connected');
    console.log('User setup completed:', userId);
  });

  socket.on('join chat', (room) => {
    socket.join(room);
    console.log('User joined room: ', room);
  });

  socket.on('leave chat', (room) => {
    socket.leave(room);
    console.log('User left room: ', room);
  });

  socket.on('new message', (newMessageReceived) => {
    var chat = newMessageReceived.chat;

    if (!chat.users) return console.log('chat.users not defined');

    chat.users.forEach((user) => {
      if (user._id !== newMessageReceived.sender._id) {
        socket.in(user._id).emit('message received', newMessageReceived);
      }
    });
    // Emit the message to the chat room instead of individual users
    socket.to(chat._id).emit('message received', newMessageReceived);
  });

  socket.on('new message request', (messageRequest) => {
    socket.to(messageRequest.receiver).emit('message request received', messageRequest);
  });

  socket.on('message request handled', (updatedRequest) => {
    socket.to(updatedRequest.sender).emit('message request status updated', updatedRequest);
  });

  socket.on('disconnect', () => {
    console.log('USER DISCONNECTED');
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



