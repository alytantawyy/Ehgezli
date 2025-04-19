import { WebSocketServer } from 'ws';
import { Server as HttpServer } from 'http';
import { verifyToken } from "@server/services/authService";

let wss: WebSocketServer;

export function setupWebSocket(server: HttpServer) {
  wss = new WebSocketServer({ server });

  wss.on("connection", async (ws: WebSocket, req) => {
    // Extract token from URL query parameters
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      ws.send(JSON.stringify({ type: 'error', message: 'Authentication required' }));
      ws.close();
      return;
    }
    
    // Verify JWT token
    try {
      const decoded = await verifyToken(token);
      (ws as any).userId = decoded.id;
      (ws as any).userType = decoded.type;
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
      ws.close();
      return;
    }
  });
}
