const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const chokidar = require('chokidar');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }
});

// Ensure the images directory exists
const imagesDir = './images';
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

// Ensure the predictions directory exists
const predictionsDir = './predictions';
if (!fs.existsSync(predictionsDir)) {
  fs.mkdirSync(predictionsDir);
}

let waitingUsers = [];

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Watcher to check for new prediction files
const watcher = chokidar.watch(predictionsDir, {
  persistent: true,
  ignoreInitial: true,
  depth: 0
});

watcher.on('add', (filePath) => {
  const fileName = path.basename(filePath, '.txt');
  const socketId = fileName.split('_')[0];
  const prediction = fs.readFileSync(filePath, 'utf-8');
  console.log(`Prediction file detected: ${filePath} for socket: ${socketId} with prediction: ${prediction}`);
  io.to(socketId).emit('prediction', { prediction });
});

io.on('connection', (socket) => {
  console.log(`New user connected: ${socket.id}`);

  socket.on('join', (userData) => {
    console.log(`User joined: ${socket.id}`, userData);

    if (!waitingUsers.some(user => user.socket.id === socket.id)) {
      waitingUsers.push({ socket, userData });
      console.log('Current waiting users:', waitingUsers.map(user => user.socket.id));
    }

    if (waitingUsers.length >= 2) {
      const [user1, user2] = waitingUsers.splice(0, 2);
      console.log(`Pairing users: ${user1.socket.id} and ${user2.socket.id}`);

      user1.socket.emit('paired', { partner: user2.socket.id });
      user2.socket.emit('paired', { partner: user1.socket.id });

      const room = user1.socket.id + '#' + user2.socket.id;
      user1.socket.join(room);
      user2.socket.join(room);

      user1.socket.on('send_message', (data) => {
        console.log(`Message from ${user1.socket.id}: ${data.text}`);
        io.to(room).emit('receive_message', data);
      });
      user2.socket.on('send_message', (data) => {
        console.log(`Message from ${user2.socket.id}: ${data.text}`);
        io.to(room).emit('receive_message', data);
      });

      user1.socket.on('disconnect', () => {
        console.log(`User disconnected: ${user1.socket.id}`);
        io.to(room).emit('partner_disconnected');
      });
      user2.socket.on('disconnect', () => {
        console.log(`User disconnected: ${user2.socket.id}`);
        io.to(room).emit('partner_disconnected');
      });
    }
  });

  socket.on('image', async (data) => {
    const base64Data = data.image.replace(/^data:image\/png;base64,/, "");
    const timestamp = Date.now();
    const fileName = `${socket.id}_${timestamp}.png`;
    const filePath = path.join(imagesDir, fileName);

    fs.writeFile(filePath, base64Data, 'base64', (err) => {
      if (err) {
        console.error(`Error saving image: ${err}`);
        return;
      }
      console.log(`Image saved as ${filePath}`);
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    waitingUsers = waitingUsers.filter(user => user.socket.id !== socket.id);
    console.log('Current waiting users:', waitingUsers.map(user => user.socket.id));
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

