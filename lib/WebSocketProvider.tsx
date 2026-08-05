'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { socketService } from '@/lib/websocket';

interface WebSocketContextType {
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
});

interface WebSocketProviderProps {
  children: ReactNode;
  token: string | null | undefined;
}

/**
 * WebSocketProvider — Manages the global socket lifecycle.
 * Ensures the connection is established only when an authenticated token is present.
 */
export const WebSocketProvider = ({
  children,
  token,
}: WebSocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (token) {
      socketService.connectSocket(token);

      const socket = socketService.socket;
      if (socket) {
        const onConnect = () => setIsConnected(true);
        const onDisconnect = () => setIsConnected(false);

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        // If already connected during initialization
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (socket.connected) setIsConnected(true);

        return () => {
          socket.off('connect', onConnect);
          socket.off('disconnect', onDisconnect);
          socketService.disconnectSocket();
          setIsConnected(false);
        };
      }
    } else {
      socketService.disconnectSocket();
      setIsConnected(false);
    }
  }, [token]);

  return (
    <WebSocketContext.Provider value={{ isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * Hook to access WebSocket context if needed, though most interactions
 * should happen through feature-specific hooks like useLiveUpdates.
 */
export const useWebSocketContext = () => useContext(WebSocketContext);
