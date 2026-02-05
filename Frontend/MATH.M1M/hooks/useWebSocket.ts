/**
 * WebSocket Hook for Taskpin
 * ==========================
 * Manages real-time connection to backend for live updates.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface WSEvent {
  type: string;
  timestamp: string;
  data: Record<string, any>;
  message?: string;
}

export interface HabitCompletedEvent extends WSEvent {
  type: 'habit_completed';
  data: {
    habito_usuario_id: number;
    nombre: string;
    puntos: number;
    racha_actual: number;
  };
}

export interface HabitUncompletedEvent extends WSEvent {
  type: 'habit_uncompleted';
  data: {
    habito_usuario_id: number;
    nombre: string;
  };
}

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  onHabitCompleted?: (event: HabitCompletedEvent) => void;
  onHabitUncompleted?: (event: HabitUncompletedEvent) => void;
  onAnyEvent?: (event: WSEvent) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

const WS_BASE_URL = 'ws://localhost:8000';

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onHabitCompleted,
    onHabitUncompleted,
    onAnyEvent,
    autoReconnect = true,
    reconnectInterval = 5000,
  } = options;

  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastEvent, setLastEvent] = useState<WSEvent | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualDisconnect = useRef(false);

  // Load user ID from storage
  useEffect(() => {
    const loadUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('user_id');
        if (storedUserId) {
          setUserId(parseInt(storedUserId, 10));
        }
      } catch (error) {
        console.error('[WS] Error loading user ID:', error);
      }
    };
    loadUserId();
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data: WSEvent = JSON.parse(event.data);
      console.log('[WS] Received:', data.type, data.message || '');
      
      setLastEvent(data);
      onAnyEvent?.(data);

      // Route to specific handlers
      switch (data.type) {
        case 'habit_completed':
          onHabitCompleted?.(data as HabitCompletedEvent);
          break;
        case 'habit_uncompleted':
          onHabitUncompleted?.(data as HabitUncompletedEvent);
          break;
        case 'connected':
          console.log('[WS] Connection confirmed by server');
          break;
        case 'pong':
          // Heartbeat response
          break;
        default:
          console.log('[WS] Unknown event type:', data.type);
      }
    } catch (error) {
      console.error('[WS] Error parsing message:', error);
    }
  }, [onHabitCompleted, onHabitUncompleted, onAnyEvent]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!userId) {
      console.log('[WS] No user ID, skipping connection');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WS] Already connected');
      return;
    }

    isManualDisconnect.current = false;
    setStatus('connecting');

    const wsUrl = `${WS_BASE_URL}/ws/${userId}`;
    console.log('[WS] Connecting to:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WS] Connected!');
        setStatus('connected');
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error('[WS] Error:', error);
        setStatus('error');
      };

      ws.onclose = (event) => {
        console.log('[WS] Closed:', event.code, event.reason);
        setStatus('disconnected');
        wsRef.current = null;

        // Auto reconnect if not manual disconnect
        if (autoReconnect && !isManualDisconnect.current) {
          console.log(`[WS] Reconnecting in ${reconnectInterval}ms...`);
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WS] Connection error:', error);
      setStatus('error');
    }
  }, [userId, handleMessage, autoReconnect, reconnectInterval]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    isManualDisconnect.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setStatus('disconnected');
  }, []);

  // Send ping (heartbeat)
  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send('ping');
    }
  }, []);

  // Auto-connect when userId is available
  useEffect(() => {
    if (userId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId]);

  // Heartbeat every 30 seconds
  useEffect(() => {
    if (status !== 'connected') return;

    const interval = setInterval(sendPing, 30000);
    return () => clearInterval(interval);
  }, [status, sendPing]);

  return {
    status,
    lastEvent,
    connect,
    disconnect,
    isConnected: status === 'connected',
  };
}
