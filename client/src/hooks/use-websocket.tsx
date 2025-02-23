import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type WebSocketContextType = {
  isConnected: boolean;
  lastMessage: any | null;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const maxReconnectAttempts = 5;
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    function connect() {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Add explicit credentials mode
        const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          reconnectAttempts.current = 0; // Reset attempts on successful connection
          toast({
            title: "Connected",
            description: "Real-time updates enabled",
          });
        };

        ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event);
          setIsConnected(false);
          wsRef.current = null;

          // Only attempt to reconnect if we haven't exceeded max attempts
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
            // Clear any existing reconnect timeout
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
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
          // Don't show error toast here as onclose will handle reconnection
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
        // If we can't even create the WebSocket, try to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        }
      }
    }

    connect();

    // Cleanup function
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [toast]);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}