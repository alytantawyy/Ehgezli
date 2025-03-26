import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

type WebSocketContextType = {
  isConnected: boolean;
  lastMessage: any | null;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 5;
  const reconnectAttempts = useRef(0);
  const isConnecting = useRef(false);

  // Separate effect for cleanup to ensure it runs consistently
  useEffect(() => {
    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    async function connect() {
      // Prevent multiple simultaneous connection attempts
      if (isConnecting.current || !user || wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      try {
        isConnecting.current = true;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          reconnectAttempts.current = 0;
          isConnecting.current = false;
          toast({
            title: "Connected",
            description: "Real-time updates enabled",
          });
        };

        ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event);
          setIsConnected(false);
          wsRef.current = null;
          isConnecting.current = false;
          
          if (event.wasClean) {
            logout();
          } else if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
            console.log(`Attempting reconnect in ${delay}ms (attempt ${reconnectAttempts.current})`);
            reconnectTimeoutRef.current = setTimeout(connect, delay);
          } else {
            toast({
              title: "Connection Lost",
              description: "Unable to maintain real-time connection. Please refresh the page.",
              variant: "destructive",
            });
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          isConnecting.current = false;
          toast({
            title: "Connection Error",
            description: "Failed to establish real-time connection. Some features may be limited.",
            variant: "destructive",
          });
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            setLastMessage(data);
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        isConnecting.current = false;
      }
    }

    // Only attempt connection if we have a user
    if (user) {
      connect();
    }
  }, [user, toast, logout]); // Dependencies include user to reconnect on auth changes

  // Separate effect for beforeunload to avoid cleanup race conditions
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'logout' }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
}