
/**
 * Kraken WebSocket Client
 * Connects to Kraken's public WebSocket API for real-time ticker data
 */

import { OHLCVCandle } from '../indicators/types';

export interface KrakenTickerData {
  pair: string;
  altname: string;
  ask: number;
  bid: number;
  close: number;
  volume: number;
  vwap: number;
  low: number;
  high: number;
  open: number;
  timestamp: number;
}

export interface KrakenOHLCData extends OHLCVCandle {
  pair: string;
  altname: string;
}

type KrakenWSMessage = 
  | { event: 'heartbeat' }
  | { event: 'systemStatus'; status: string; version: string }
  | { event: 'subscriptionStatus'; status: string; pair?: string; channelName?: string }
  | [number, { a: [string, number, string]; b: [string, number, string]; c: [string, string]; v: [string, string]; p: [string, string]; t: [number, number]; l: [string, string]; h: [string, string]; o: [string, string] }, string, string]
  | [number, [string, string, string, string, string, string, string, string, number, string, string], string, string];

/**
 * Kraken WebSocket Client for real-time market data
 */
export class KrakenWSClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private subscribedPairs: Set<string> = new Set();
  private subscribedChannels: Map<string, string[]> = new Map(); // pair -> [channels]
  
  private onTickerCallback: ((data: KrakenTickerData) => void) | null = null;
  private onOHLCCallback: ((data: KrakenOHLCData) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private onConnectCallback: (() => void) | null = null;

  constructor() {
    // Constructor intentionally empty - connection happens via connect()
  }

  /**
   * Connect to Kraken WebSocket API
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket('wss://ws.kraken.com');

        this.ws.onopen = () => {
          console.log('[KrakenWS] Connected to Kraken WebSocket');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          if (this.onConnectCallback) {
            this.onConnectCallback();
          }
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('[KrakenWS] WebSocket error:', error);
          if (this.onErrorCallback) {
            this.onErrorCallback(new Error('WebSocket connection error'));
          }
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[KrakenWS] Connection closed');
          this.stopHeartbeat();
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message: KrakenWSMessage = JSON.parse(data);

      // Handle event messages
      if (typeof message === 'object' && 'event' in message) {
        if (message.event === 'heartbeat') {
          // Heartbeat received
          return;
        }
        if (message.event === 'subscriptionStatus') {
          console.log('[KrakenWS] Subscription status:', message);
          return;
        }
        if (message.event === 'systemStatus') {
          console.log('[KrakenWS] System status:', message.status);
          return;
        }
      }

      // Handle ticker data (array format: [channelID, data, channelName, pair])
      if (Array.isArray(message) && message.length === 4) {
        const [, data, channelName, pair] = message;
        
        if (channelName === 'ticker' && typeof data === 'object' && 'c' in data) {
          this.handleTickerData(pair, data);
        } else if (channelName.startsWith('ohlc-') && Array.isArray(data)) {
          this.handleOHLCData(pair, data, channelName);
        }
      }
    } catch (error) {
      console.error('[KrakenWS] Error parsing message:', error);
    }
  }

  /**
   * Handle ticker data
   */
  private handleTickerData(pair: string, data: any): void {
    try {
      const tickerData: KrakenTickerData = {
        pair,
        altname: pair.replace('XBT', 'BTC').replace(/^X/, '').replace(/^Z/, ''),
        ask: parseFloat(data.a[0]),
        bid: parseFloat(data.b[0]),
        close: parseFloat(data.c[0]),
        volume: parseFloat(data.v[1]), // 24h volume
        vwap: parseFloat(data.p[1]), // 24h vwap
        low: parseFloat(data.l[1]), // 24h low
        high: parseFloat(data.h[1]), // 24h high
        open: parseFloat(data.o[1]), // Today's opening price
        timestamp: Date.now(),
      };

      if (this.onTickerCallback) {
        this.onTickerCallback(tickerData);
      }
    } catch (error) {
      console.error('[KrakenWS] Error handling ticker data:', error);
    }
  }

  /**
   * Handle OHLC data
   */
  private handleOHLCData(pair: string, data: any, channelName: string): void {
    try {
      // OHLC data format: [time, etime, open, high, low, close, vwap, volume, count]
      const ohlcData: KrakenOHLCData = {
        pair,
        altname: pair.replace('XBT', 'BTC').replace(/^X/, '').replace(/^Z/, ''),
        timestamp: parseInt(data[0]) * 1000, // Convert to ms
        open: parseFloat(data[2]),
        high: parseFloat(data[3]),
        low: parseFloat(data[4]),
        close: parseFloat(data[5]),
        volume: parseFloat(data[7]),
      };

      if (this.onOHLCCallback) {
        this.onOHLCCallback(ohlcData);
      }
    } catch (error) {
      console.error('[KrakenWS] Error handling OHLC data:', error);
    }
  }

  /**
   * Subscribe to ticker updates for a trading pair
   */
  subscribe(pairs: string[], channel: 'ticker' | 'ohlc-1' | 'ohlc-5' | 'ohlc-15' | 'ohlc-60' = 'ticker'): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[KrakenWS] Cannot subscribe - WebSocket not connected');
      return;
    }

    const subscription = {
      event: 'subscribe',
      pair: pairs,
      subscription: {
        name: channel.startsWith('ohlc-') ? 'ohlc' : channel,
        ...(channel.startsWith('ohlc-') && { interval: parseInt(channel.split('-')[1]) }),
      },
    };

    this.ws.send(JSON.stringify(subscription));
    
    pairs.forEach(pair => {
      this.subscribedPairs.add(pair);
      const channels = this.subscribedChannels.get(pair) || [];
      if (!channels.includes(channel)) {
        channels.push(channel);
        this.subscribedChannels.set(pair, channels);
      }
    });
    
    console.log(`[KrakenWS] Subscribed to ${channel} for pairs:`, pairs);
  }

  /**
   * Unsubscribe from updates for a trading pair
   */
  unsubscribe(pairs: string[], channel: 'ticker' | 'ohlc-1' | 'ohlc-5' | 'ohlc-15' | 'ohlc-60' = 'ticker'): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const subscription = {
      event: 'unsubscribe',
      pair: pairs,
      subscription: {
        name: channel.startsWith('ohlc-') ? 'ohlc' : channel,
        ...(channel.startsWith('ohlc-') && { interval: parseInt(channel.split('-')[1]) }),
      },
    };

    this.ws.send(JSON.stringify(subscription));
    
    pairs.forEach(pair => {
      const channels = this.subscribedChannels.get(pair) || [];
      const updatedChannels = channels.filter(c => c !== channel);
      if (updatedChannels.length === 0) {
        this.subscribedPairs.delete(pair);
        this.subscribedChannels.delete(pair);
      } else {
        this.subscribedChannels.set(pair, updatedChannels);
      }
    });
    
    console.log(`[KrakenWS] Unsubscribed from ${channel} for pairs:`, pairs);
  }

  /**
   * Set callback for ticker updates
   */
  onTicker(callback: (data: KrakenTickerData) => void): void {
    this.onTickerCallback = callback;
  }

  /**
   * Set callback for OHLC updates
   */
  onOHLC(callback: (data: KrakenOHLCData) => void): void {
    this.onOHLCCallback = callback;
  }

  /**
   * Set callback for errors
   */
  onError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Set callback for connection
   */
  onConnect(callback: () => void): void {
    this.onConnectCallback = callback;
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ event: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[KrakenWS] Max reconnection attempts reached');
      if (this.onErrorCallback) {
        this.onErrorCallback(new Error('Max reconnection attempts reached'));
      }
      return;
    }

    this.reconnectAttempts++;
    console.log(`[KrakenWS] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect().then(() => {
        // Re-subscribe to all previously subscribed pairs
        const pairsArray = Array.from(this.subscribedPairs);
        if (pairsArray.length > 0) {
          this.subscribedChannels.forEach((channels, pair) => {
            channels.forEach(channel => {
              this.subscribe([pair], channel as any);
            });
          });
        }
      }).catch((error) => {
        console.error('[KrakenWS] Reconnection failed:', error);
      });
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribedPairs.clear();
    this.subscribedChannels.clear();
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get subscribed pairs
   */
  getSubscribedPairs(): string[] {
    return Array.from(this.subscribedPairs);
  }
}
