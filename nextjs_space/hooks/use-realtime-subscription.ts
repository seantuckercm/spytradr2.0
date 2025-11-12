
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface RealtimeEvent {
  type: 'connected' | 'db_change' | 'heartbeat' | 'error';
  data?: {
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    id: string;
    userId: string;
    agentId?: string;
    data?: any;
  };
  message?: string;
  timestamp: string;
}

export interface UseRealtimeSubscriptionOptions {
  tables?: string[]; // Filter by specific table names
  onEvent?: (event: RealtimeEvent) => void;
  autoRevalidate?: boolean; // Auto-refresh router on changes
  enabled?: boolean; // Control subscription activation
}

export function useRealtimeSubscription(options: UseRealtimeSubscriptionOptions = {}) {
  const {
    tables = [],
    onEvent,
    autoRevalidate = true,
    enabled = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const router = useRouter();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current) return;

    try {
      const eventSource = new EventSource('/api/realtime');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (e) => {
        try {
          const event: RealtimeEvent = JSON.parse(e.data);
          setLastEvent(event);

          // Filter by table if specified
          if (
            event.type === 'db_change' &&
            event.data &&
            (tables.length === 0 || tables.includes(event.data.table))
          ) {
            // Call custom event handler
            onEvent?.(event);

            // Auto-revalidate router to refresh server components
            if (autoRevalidate) {
              router.refresh();
            }
          }

          // Call handler for all event types (including heartbeat, connected, error)
          if (event.type !== 'db_change') {
            onEvent?.(event);
          }
        } catch (err) {
          console.error('Error parsing SSE event:', err);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        eventSource.close();
        eventSourceRef.current = null;

        // Implement exponential backoff for reconnection
        const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current += 1;

        setError(`Connection lost. Reconnecting in ${backoffDelay / 1000}s...`);

        reconnectTimeoutRef.current = setTimeout(() => {
          if (enabled) {
            connect();
          }
        }, backoffDelay);
      };
    } catch (err) {
      console.error('Error creating EventSource:', err);
      setError('Failed to establish realtime connection');
    }
  }, [enabled, tables, onEvent, autoRevalidate, router]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Connect on mount if enabled
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    lastEvent,
    error,
    connect,
    disconnect,
  };
}
