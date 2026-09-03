import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { EmitRequestBody, ClientHandshakeAuth } from './types.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const SOCKET_SECRET = process.env.SOCKET_SERVER_SECRET || 'dsams_realtime_secret_key_change_in_production';

// Parse allowed CORS origins
const rawOrigins = process.env.CORS_ORIGIN || 'http://127.0.0.1:8000,http://localhost:8000,http://localhost:5173,http://dsams.test';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim());

const app = express();
const server = http.createServer(app);

// Configure Express Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl / server-to-server)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback permissive for local dev
    }
  },
  credentials: true,
}));

app.use(express.json());

// Initialize Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

/**
 * Middleware: Verify shared secret for incoming Laravel backend requests
 */
function verifyLaravelSecret(req: Request, res: Response, next: NextFunction): void {
  const secretHeader = req.headers['x-socket-secret'];
  if (!secretHeader || secretHeader !== SOCKET_SECRET) {
    res.status(401).json({
      error: 'Unauthorized: Invalid or missing X-Socket-Secret header',
    });
    return;
  }
  next();
}

/**
 * Health Check Endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount,
    uptime: process.uptime(),
  });
});

/**
 * REST Endpoint for Laravel to Emit Real-Time Notifications
 * POST /api/notifications/emit
 */
app.post('/api/notifications/emit', verifyLaravelSecret, (req: Request, res: Response) => {
  try {
    const { room, event = 'notification', data }: EmitRequestBody = req.body;

    if (!data) {
      res.status(400).json({ error: 'Missing notification data payload' });
      return;
    }

    if (room) {
      // Target specific user or role room (e.g. "user_15", "role_admin")
      io.to(room).emit(event, data);
      console.log(`[Socket.IO] Emitted '${event}' to room '${room}' -> Title: "${data.title}"`);
    } else {
      // Broadcast to all connected clients
      io.emit(event, data);
      console.log(`[Socket.IO] Broadcasted '${event}' to all clients -> Title: "${data.title}"`);
    }

    res.json({
      success: true,
      deliveredTo: room || 'all',
      event,
      data,
    });
  } catch (error: any) {
    console.error('[Socket.IO] Error emitting notification:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

/**
 * Socket.IO Connection & Authentication Lifecycle
 */
io.use((socket: Socket, next) => {
  const auth = (socket.handshake.auth || {}) as ClientHandshakeAuth;
  const query = socket.handshake.query;

  const userId = auth.userId || query.userId;
  const role = auth.role || query.role;

  // Attach credentials to socket data
  socket.data.userId = userId ? String(userId) : null;
  socket.data.role = role ? String(role).toLowerCase() : null;

  next();
});

io.on('connection', (socket: Socket) => {
  const { userId, role } = socket.data;

  console.log(`[Socket.IO] Client connected: ${socket.id} (User: ${userId || 'guest'}, Role: ${role || 'none'})`);

  // Join user-specific room
  if (userId) {
    const userRoom = `user_${userId}`;
    socket.join(userRoom);
    console.log(`[Socket.IO] Socket ${socket.id} joined room: ${userRoom}`);
  }

  // Join role-specific room (e.g., "role_admin", "role_student")
  if (role) {
    const roleRoom = `role_${role}`;
    socket.join(roleRoom);
    console.log(`[Socket.IO] Socket ${socket.id} joined room: ${roleRoom}`);
  }

  // Handle client requesting to join a custom room explicitly
  socket.on('join_user_room', (customUserId: string | number) => {
    if (customUserId) {
      const room = `user_${customUserId}`;
      socket.join(room);
      console.log(`[Socket.IO] Socket ${socket.id} manually joined ${room}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id} (Reason: ${reason})`);
  });

  // Handle client ping/heartbeat test
  socket.on('ping_server', (callback) => {
    if (typeof callback === 'function') {
      callback({ status: 'pong', serverTime: new Date().toISOString() });
    }
  });
});

// Start Server
server.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 DSAMS Real-Time Socket.IO Server Running!`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔒 Secret Auth: Enabled`);
  console.log(`🌐 Health: http://localhost:${PORT}/health`);
  console.log('====================================================');
});
