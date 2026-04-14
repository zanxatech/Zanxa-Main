const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (user: ${socket.userId})`);

    // ── JOIN MEETING ROOM ────────────────────────────────────────────────────
    socket.on('meeting:join', ({ meetingCode, userName }) => {
      socket.join(`meeting:${meetingCode}`);
      socket.meetingCode = meetingCode;
      socket.userName = userName;

      // Notify others
      socket.to(`meeting:${meetingCode}`).emit('meeting:user-joined', {
        socketId: socket.id,
        userId: socket.userId,
        userName
      });

      // Send existing participants list
      const room = io.sockets.adapter.rooms.get(`meeting:${meetingCode}`);
      const participants = [];
      if (room) {
        room.forEach((socketId) => {
          const s = io.sockets.sockets.get(socketId);
          if (s && s.id !== socket.id) {
            participants.push({ socketId: s.id, userId: s.userId, userName: s.userName });
          }
        });
      }
      socket.emit('meeting:participants', participants);

      console.log(`👥 User ${socket.userId} joined meeting ${meetingCode}`);
    });

    // ── WebRTC SIGNALING ─────────────────────────────────────────────────────
    socket.on('webrtc:offer', ({ to, offer }) => {
      io.to(to).emit('webrtc:offer', { from: socket.id, offer });
    });

    socket.on('webrtc:answer', ({ to, answer }) => {
      io.to(to).emit('webrtc:answer', { from: socket.id, answer });
    });

    socket.on('webrtc:ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('webrtc:ice-candidate', { from: socket.id, candidate });
    });

    // ── MEETING CONTROLS ─────────────────────────────────────────────────────
    socket.on('meeting:toggle-audio', ({ meetingCode, muted }) => {
      socket.to(`meeting:${meetingCode}`).emit('meeting:audio-toggle', {
        socketId: socket.id, muted
      });
    });

    socket.on('meeting:toggle-video', ({ meetingCode, videoOff }) => {
      socket.to(`meeting:${meetingCode}`).emit('meeting:video-toggle', {
        socketId: socket.id, videoOff
      });
    });

    socket.on('meeting:chat', ({ meetingCode, message }) => {
      io.to(`meeting:${meetingCode}`).emit('meeting:chat-message', {
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.userName,
        message,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('meeting:end', ({ meetingCode }) => {
      io.to(`meeting:${meetingCode}`).emit('meeting:ended');
    });

    // ── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on('disconnecting', () => {
      if (socket.meetingCode) {
        socket.to(`meeting:${socket.meetingCode}`).emit('meeting:user-left', {
          socketId: socket.id,
          userId: socket.userId,
          userName: socket.userName
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO };
