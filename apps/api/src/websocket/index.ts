import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthPayload } from '../middleware/auth.js';
import type { Server } from 'http';

const connections = new Map<string, Set<WebSocket>>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Authentication required');
      return;
    }

    let payload: AuthPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    } catch {
      ws.close(4001, 'Invalid token');
      return;
    }

    const userId = payload.sub;

    // Add to connections map
    if (!connections.has(userId)) {
      connections.set(userId, new Set());
    }
    connections.get(userId)!.add(ws);

    // Send connected confirmation
    ws.send(JSON.stringify({ type: 'connected', payload: { userId } }));

    // Heartbeat
    let isAlive = true;
    ws.on('pong', () => { isAlive = true; });

    const heartbeat = setInterval(() => {
      if (!isAlive) {
        ws.terminate();
        return;
      }
      isAlive = false;
      ws.ping();
    }, 30000);

    ws.on('close', () => {
      clearInterval(heartbeat);
      const userConns = connections.get(userId);
      if (userConns) {
        userConns.delete(ws);
        if (userConns.size === 0) {
          connections.delete(userId);
        }
      }
    });

    ws.on('error', () => {
      clearInterval(heartbeat);
      ws.terminate();
    });
  });

  console.log('WebSocket server initialized on /ws');
}

export function sendToUser(userId: string, event: string, data: unknown) {
  const userConns = connections.get(userId);
  if (!userConns) return;

  const message = JSON.stringify({ type: event, payload: data });
  for (const ws of userConns) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

export function isUserOnline(userId: string): boolean {
  const userConns = connections.get(userId);
  return !!userConns && userConns.size > 0;
}
