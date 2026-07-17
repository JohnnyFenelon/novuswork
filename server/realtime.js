import { Server } from 'socket.io';
import { verifyToken } from './auth.js';
import { q } from './db.js';

/**
 * Socket.IO realtime layer:
 *  - presence (admins see who is online, live)
 *  - instant messages (persisted via REST, pushed here)
 *  - WebRTC signaling relay (admin <-> candidate video calls)
 */
export function initRealtime(httpServer) {
  const io = new Server(httpServer, { cors: { origin: true, credentials: true } });

  /** userId -> Set<socketId> */
  const online = new Map();

  const onlineIds = () => [...online.keys()];

  function emitToUser(userId, event, payload) {
    const sockets = online.get(Number(userId));
    if (!sockets) return false;
    for (const sid of sockets) io.to(sid).emit(event, payload);
    return true;
  }

  const broadcastPresence = () => io.to('admins').emit('presence', onlineIds());

  io.use((socket, next) => {
    const cookies = socket.handshake.headers.cookie || '';
    const m = cookies.match(/(?:^|;\s*)nw_token=([^;]+)/);
    const payload = m ? verifyToken(decodeURIComponent(m[1])) : null;
    if (!payload) return next(new Error('unauthorized'));
    socket.data.uid = payload.uid;
    socket.data.role = payload.role;
    next();
  });

  io.on('connection', (socket) => {
    const uid = socket.data.uid;
    if (!online.has(uid)) online.set(uid, new Set());
    online.get(uid).add(socket.id);
    if (socket.data.role === 'admin') socket.join('admins');
    q('UPDATE users SET last_seen=NOW() WHERE id=$1', [uid]).catch(() => {});
    broadcastPresence();

    // ── WebRTC signaling relay ──────────────────────────────────
    // caller -> callee: call-offer { to, sdp, fromName }
    socket.on('call-offer', ({ to, sdp, fromName }) => {
      const delivered = emitToUser(to, 'call-offer', { from: uid, fromName: fromName || '', sdp });
      if (!delivered) socket.emit('call-unavailable', { to });
    });
    socket.on('call-answer', ({ to, sdp }) => emitToUser(to, 'call-answer', { from: uid, sdp }));
    socket.on('ice-candidate', ({ to, candidate }) => emitToUser(to, 'ice-candidate', { from: uid, candidate }));
    socket.on('call-end', ({ to }) => emitToUser(to, 'call-end', { from: uid }));

    socket.on('disconnect', () => {
      const set = online.get(uid);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) online.delete(uid);
      }
      q('UPDATE users SET last_seen=NOW() WHERE id=$1', [uid]).catch(() => {});
      broadcastPresence();
    });
  });

  return { io, onlineIds, emitToUser };
}
