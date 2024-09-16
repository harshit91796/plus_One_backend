const io = require('socket.io-client');
const socket = io('http://localhost:3007'); // Replace PORT with your server's port number

socket.on('connect', () => {
    console.log('Connected to server:', socket.id);

    // Send a message to the server
    socket.emit('sendMessage', { content: 'Hello from Node.js client!', sender: 'TestUser' });

    // Listen for broadcasted messages
    socket.on('receiveMessage', (data) => {
        console.log('Message from server:', data);
    });
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});
