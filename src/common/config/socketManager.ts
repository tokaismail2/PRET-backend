import type { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;


export function initSocket(server: HTTPServer) {
  if (io) {
    return io;
  }

  io = new SocketIOServer(server, {
    cors: { origin: "*" },
    transports: ["websocket", "polling"],
  });

  io.on('connection', (socket: Socket) => {
    console.log('🔌 Socket connected:', socket.id);




    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', socket.id, 'Reason:', reason);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}



