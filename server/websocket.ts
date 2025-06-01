import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import { Server as HttpServer } from 'http';
import { verifyToken } from "@server/services/authService";

interface ClientInfo {
    userId: number;
    userType: 'user' | 'restaurant';
    isAlive: boolean;
}
  
const clients = new Map<WebSocket, ClientInfo>();

interface WebSocketMessage {
    type: string;
    data?: any;
}

let wss: WebSocketServer;

export function setupWebSocket(server: HttpServer) {
  wss = new WebSocketServer({ server });

  // Handle new WebSocket connections
  wss.on('connection', async (ws: WebSocket, req) => {
    try {
      // Extract token from URL query parameters
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        ws.send(JSON.stringify({ type: 'error', message: 'Authentication required' }));
        ws.close();
        return;
      }
        
        // Verify token and get user info
        let userId: number;
        let userType: 'user' | 'restaurant';
        
        try {
          // Verify token (you'll need to implement this function)
          const decoded = await verifyToken(token);
          userId = decoded.id;
          userType = decoded.type;
        } catch (error) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
          ws.close();
          return;
        }
  
        // Store client information
        clients.set(ws, {
          userId,
          userType,
          isAlive: true
        });
  
        // Send confirmation message
        ws.send(JSON.stringify({
          type: 'connection_established',
          data: { userId, userType }
        }));
  
        // Handle incoming messages
        ws.on('message', (data: string) => {
          try {
            const message: WebSocketMessage = JSON.parse(data);
            console.log('Received message:', message.type);
            
            // Handle different message types
            switch (message.type) {
              case 'heartbeat':
                const client = clients.get(ws);
                if (client) {
                  client.isAlive = true;
                }
                break;
  
              case 'init':
                if (!message.data?.userId || !message.data?.userType) {
                  console.error('Invalid init message:', message);
                  return;
                }
                // Initialize client connection
                clients.set(ws, {
                  userId: message.data.userId,
                  userType: message.data.userType as 'user' | 'restaurant',
                  isAlive: true
                });
                // Send confirmation
                ws.send(JSON.stringify({
                  type: 'connection_established',
                  data: { message: 'Successfully initialized connection' }
                }));
                break;
  
              case 'logout':
                clients.delete(ws);
                ws.close();
                break;
  
              case 'new_booking':
              case 'booking_cancelled':
              case 'booking_arrived':
              case 'booking_completed':
                // Forward booking-related messages to relevant clients
                const { restaurantId, userId } = message.data;
                clients.forEach((clientInfo, clientWs) => {
                  if (
                    (clientInfo.userType === 'restaurant' && clientInfo.userId === restaurantId) ||
                    (clientInfo.userType === 'user' && clientInfo.userId === userId)
                  ) {
                    try {
                      clientWs.send(JSON.stringify(message));
                    } catch (error) {
                      console.error('Error sending message to client:', error);
                      clients.delete(clientWs);
                      clientWs.terminate();
                    }
                  }
                });
                break;
  
              default:
                console.warn('Unknown message type:', message.type);
            }
          } catch (error) {
            console.error('Error handling WebSocket message:', error);
          }
        });
  
        // Handle WebSocket close event
        ws.on('close', () => {
          console.log('Client disconnected from /ws');
          clients.delete(ws);
        });
  
        // Handle WebSocket error event
        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
          clients.delete(ws);
          ws.close();
        });
  
        // Handle WebSocket pong event
        ws.on('pong', () => {
          const client = clients.get(ws);
          if (client) {
            client.isAlive = true;
          }
        });
      } catch (error) {
        console.error('WebSocket connection error:', error);
        ws.close();
      }
    });
}
