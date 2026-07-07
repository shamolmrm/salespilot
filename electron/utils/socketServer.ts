import { createServer } from 'http';
import { Server as SocketIO, Socket } from 'socket.io';
import * as jose from 'jose';

let io: SocketIO | null = null;

async function verifyToken(token: string): Promise<{ userId: string; role: string }> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret');
  const { payload } = await jose.jwtVerify(token, secret);
  return { userId: payload.userId as string, role: payload.role as string };
}

export function startSocketServer(port = 3001): void {
  if (io) return; // already started

  const httpServer = createServer();
  io = new SocketIO(httpServer, {
    cors: { origin: [`http://localhost:${process.env.PORT ?? 3000}`], methods: ['GET', 'POST'] },
  });

  // JWT auth middleware
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Authentication required'));
    try {
      const user = await verifyToken(token);
      (socket.data as Record<string, unknown>).userId = user.userId;
      (socket.data as Record<string, unknown>).role = user.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;

    // Join personal room for direct messages
    socket.join(`user:${userId}`);

    socket.on('join-room', (roomId: string) => {
      socket.join(`room:${roomId}`);
    });

    socket.on('leave-room', (roomId: string) => {
      socket.leave(`room:${roomId}`);
    });

    // New chat message — emit to room so all members receive it in real time
    socket.on('send-message', (payload: { roomId: string; message: unknown }) => {
      io?.to(`room:${payload.roomId}`).emit('new-message', payload.message);
    });

    socket.on('disconnect', () => {
      io?.to(`user:${userId}`).emit('user-offline', { userId });
    });
  });

  httpServer.listen(port, () => {
    console.log(`[socket] Socket.io listening on port ${port}`);
  });
}

export function getSocketIO(): SocketIO | null {
  return io;
}
