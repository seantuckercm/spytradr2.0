
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { KrakenWSClient, KrakenTickerData, KrakenOHLCData } from '@/lib/websocket/kraken-ws-client';

export interface UseKrakenWebSocketOptions {
  pairs: string[];
  channel?: 'ticker' | 'ohlc-1' | 'ohlc-5' | 'ohlc-15' | 'ohlc-60';
  autoConnect?: boolean;
}

export interface UseKrakenWebSocketReturn {
  tickerData: Map<string, KrakenTickerData>;
  ohlcData: Map<string, KrakenOHLCData>;
  isConnected: boolean;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
  subscribe: (pairs: string[]) => void;
  unsubscribe: (pairs: string[]) => void;
}

/**
 * React hook for consuming Kraken WebSocket real-time data
 */
export function useKrakenWebSocket(options: UseKrakenWebSocketOptions): UseKrakenWebSocketReturn {
  const { pairs, channel = 'ticker', autoConnect = true } = options;
  
  const clientRef = useRef<KrakenWSClient | null>(null);
  const [tickerData, setTickerData] = useState<Map<string, KrakenTickerData>>(new Map());
  const [ohlcData, setOHLCData] = useState<Map<string, KrakenOHLCData>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize client
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = new KrakenWSClient();
      
      // Set up callbacks
      clientRef.current.onConnect(() => {
        setIsConnected(true);
        setError(null);
      });

      clientRef.current.onTicker((data) => {
        setTickerData((prev) => {
          const next = new Map(prev);
          next.set(data.pair, data);
          return next;
        });
      });

      clientRef.current.onOHLC((data) => {
        setOHLCData((prev) => {
          const next = new Map(prev);
          next.set(data.pair, data);
          return next;
        });
      });

      clientRef.current.onError((err) => {
        setError(err);
        setIsConnected(false);
      });
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, []);

  // Auto-connect
  useEffect(() => {
    if (autoConnect && clientRef.current && !clientRef.current.isConnected()) {
      clientRef.current.connect().catch((err) => {
        console.error('[useKrakenWebSocket] Connection error:', err);
        setError(err);
      });
    }
  }, [autoConnect]);

  // Subscribe to pairs
  useEffect(() => {
    if (clientRef.current && clientRef.current.isConnected() && pairs.length > 0) {
      clientRef.current.subscribe(pairs, channel);
      
      return () => {
        if (clientRef.current) {
          clientRef.current.unsubscribe(pairs, channel);
        }
      };
    }
  }, [pairs, channel]);

  const connect = useCallback(() => {
    if (clientRef.current && !clientRef.current.isConnected()) {
      clientRef.current.connect().catch((err) => {
        console.error('[useKrakenWebSocket] Connection error:', err);
        setError(err);
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      setIsConnected(false);
    }
  }, []);

  const subscribe = useCallback((newPairs: string[]) => {
    if (clientRef.current && clientRef.current.isConnected()) {
      clientRef.current.subscribe(newPairs, channel);
    }
  }, [channel]);

  const unsubscribe = useCallback((pairsToRemove: string[]) => {
    if (clientRef.current && clientRef.current.isConnected()) {
      clientRef.current.unsubscribe(pairsToRemove, channel);
    }
  }, [channel]);

  return {
    tickerData,
    ohlcData,
    isConnected,
    error,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  };
}
