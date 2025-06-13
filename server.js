const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();
require('./firebase-config');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', 
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const ownerRoutes = require('./routes/ownerRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const messageRoutes = require('./routes/messageRoutes');

app.use('/api/owner', ownerRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/message', messageRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    message: 'Server is running and connected to Firebase!'
  });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_room', ({ groupId }) => {
    socket.join(groupId);
    console.log(`User ${socket.id} joined group ${groupId}`);
  });

  socket.on('send_message', async (data) => {
    const { sender, message: content, senderId, groupId } = data;
    try {
      const messageRef = await admin
        .firestore()
        .collection('messages')
        .add({
          sender,
          message: content,
          senderId,
          groupId,
          messageId: `msg_${Date.now()}`,
          isRead: false,
          readAt: null,
          status: 'sent',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

      const message = {
        id: messageRef.id,
        sender,
        message: content,
        senderId,
        groupId,
        messageId: `msg_${Date.now()}`,
        isRead: false,
        readAt: null,
        status: 'sent',
        timestamp: new Date().toISOString(),
      };

      io.to(groupId).emit('receive_message', message);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });

  socket.on('read_message', async ({ messageId, groupId }) => {
    try {
      const messageRef = await admin.firestore().collection('messages').doc(messageId);
      const messageDoc = await messageRef.get();
      if (messageDoc.exists) {
        const readAt = admin.firestore.FieldValue.serverTimestamp();
        await messageRef.update({
          isRead: true,
          readAt,
          status: 'read',
        });

        io.to(groupId).emit('message_read', {
          messageId,
          isRead: true,
          readAt: new Date().toISOString(),
          status: 'read',
        });
      }
    } catch (error) {
      console.error('Error updating read status:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});