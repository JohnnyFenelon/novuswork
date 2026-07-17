import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/** Connect (or reuse) the authenticated realtime socket. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io({ withCredentials: true });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
