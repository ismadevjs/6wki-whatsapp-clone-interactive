const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3001',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const rooms = {};

io.on('connection', (socket) => {
    const token = socket.handshake.query.token;
    console.log(`User ${token} connected`);

    socket.on('join room', (room) => {
        console.log(`User ${token} trying to join room ${room}`);

        if (!rooms[room]) {
            rooms[room] = { users: [token], messages: [] };
            socket.join(room);
            socket.emit('room joined', { room, messages: rooms[room].messages });
            console.log(`User ${token} joined room ${room}`);
        } else if (rooms[room].users.length === 1) {
            rooms[room].users.push(token);
            socket.join(room);
            io.to(room).emit('start chat');
            socket.emit('room joined', { room, messages: rooms[room].messages });
            console.log(`User ${token} joined room ${room}`);
        } else {
            socket.emit('room full');
            console.log(`Room ${room} is full.`);
        }
    });

    socket.on('send message', (data) => {
        if (rooms[data.room]) {
            const message = { ...data.message, id: rooms[data.room].messages.length + 1 };
            rooms[data.room].messages.push(message);
            io.to(data.room).emit('receive message', message);
        } else {
            console.log(`Room ${data.room} does not exist.`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User ${token} disconnected`);
        for (const room in rooms) {
            const index = rooms[room].users.indexOf(token);
            if (index !== -1) {
                rooms[room].users.splice(index, 1);
            }
        }
    });
});

server.listen(4000, () => {
    console.log('listening on *:4000');
});
