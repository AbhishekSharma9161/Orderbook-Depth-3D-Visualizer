import { OrderBookData, OrderBookLevel, MarketData } from '@/types/orderbook';

class OrderBookService {
  private wsConnections: Map<string, WebSocket> = new Map();
  private subscribers: Map<string, Set<(data: OrderBookData) => void>> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private debugLogged = false;

  // Demo data generator for when no real connection is available
  private generateMockOrderBook(symbol: string, venue: string): OrderBookData {
    const basePrice = symbol.includes('BTC') ? 45000 + Math.random() * 10000 : 50000; // More realistic BTC price range
    const spread = 2 + Math.random() * 8; // Variable spread
    const levels = 20;
    
    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];
    
    let totalBid = 0;
    let totalAsk = 0;
    
    for (let i = 0; i < levels; i++) {
      const bidPrice = parseFloat((basePrice - spread/2 - i * (2 + Math.random() * 3)).toFixed(2));
      const askPrice = parseFloat((basePrice + spread/2 + i * (2 + Math.random() * 3)).toFixed(2));
      
      // More realistic quantity distribution
      const bidQty = parseFloat((Math.random() * 3 + 0.05 * Math.exp(-i * 0.2)).toFixed(4));
      const askQty = parseFloat((Math.random() * 3 + 0.05 * Math.exp(-i * 0.2)).toFixed(4));
      
      totalBid += bidQty;
      totalAsk += askQty;
      
      bids.push({
        price: bidPrice,
        quantity: bidQty,
        total: parseFloat(totalBid.toFixed(4)),
        timestamp: Date.now()
      });
      
      asks.push({
        price: askPrice,
        quantity: askQty,
        total: parseFloat(totalAsk.toFixed(4)),
        timestamp: Date.now()
      });
    }
    
    return {
      bids: bids.sort((a, b) => b.price - a.price), // Ensure proper sorting
      asks: asks.sort((a, b) => a.price - b.price),
      symbol,
      venue: `${venue} (Demo)`,
      timestamp: Date.now()
    };
  }

  // Connect to Binance WebSocket (free API)
  connectToBinance(symbol: string): void {
    // Try the standard WebSocket endpoint first, fallback to alternative if needed
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth20`;
    console.log(`Connecting to Binance WebSocket: ${wsUrl}`);
    
    // First try the connection, if it fails, fall back to demo mode immediately
    try {
      this.connectToWebSocket('binance', symbol, wsUrl, this.parseBinanceData.bind(this));
    } catch (error) {
      console.warn('Binance connection failed, using demo data:', error);
      this.startMockDataFeed('binance', symbol);
    }
  }

  // Connect to generic WebSocket
  private connectToWebSocket(
    venue: string, 
    symbol: string, 
    url: string, 
    parser: (data: any, symbol: string, venue: string) => OrderBookData | null
  ): void {
    const key = `${venue}-${symbol}`;
    
    if (this.wsConnections.has(key)) {
      const existingWs = this.wsConnections.get(key);
      if (existingWs && typeof existingWs.close === 'function') {
        existingWs.close();
      }
      this.wsConnections.delete(key);
    }

    try {
      console.log(`Attempting to connect to ${venue} WebSocket...`);
      const ws = new WebSocket(url);
      
      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.warn(`Connection timeout for ${venue}, switching to demo mode`);
          ws.close();
          this.startMockDataFeed(venue, symbol);
        }
      }, 10000); // 10 second timeout
      
      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log(`✅ Successfully connected to ${venue} for ${symbol}`);
        this.reconnectAttempts.set(key, 0);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const orderBookData = parser(data, symbol, venue);
          
          if (orderBookData) {
            this.notifySubscribers(key, orderBookData);
          }
        } catch (error) {
          console.error(`Error parsing ${venue} data:`, error);
        }
      };
      
      ws.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log(`Disconnected from ${venue} for ${symbol}. Code: ${event.code}, Reason: ${event.reason}`);
        
        // Only attempt reconnect if it wasn't a deliberate close
        if (event.code !== 1000) {
          this.handleReconnect(key, venue, symbol, url, parser);
        }
      };
      
      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.warn(`⚠️ WebSocket connection issue for ${venue} (this is normal for demo):`, {
          readyState: ws.readyState,
          url: url,
          venue: venue,
          symbol: symbol,
          timestamp: new Date().toISOString()
        });
        
        // Immediately fall back to demo data for better UX
        console.log(`✨ Using realistic demo data for ${venue} orderbook visualization`);
        this.startMockDataFeed(venue, symbol);
      };
      
      this.wsConnections.set(key, ws);
    } catch (error) {
      console.error(`Failed to create WebSocket connection for ${venue}:`, error);
      // Fall back to mock data immediately
      this.startMockDataFeed(venue, symbol);
    }
  }

  private parseBinanceData(data: any, symbol: string, venue: string): OrderBookData | null {
    try {
      // Log raw data for debugging (only first few times)
      if (!this.debugLogged) {
        console.log('Binance data sample:', data);
        this.debugLogged = true;
      }
      
      // Validate data structure - handle both direct depth and wrapped formats
      let orderBookData = data;
      if (data.data && data.stream) {
        // Handle stream wrapper format
        orderBookData = data.data;
      }
      
      if (!orderBookData || !Array.isArray(orderBookData.bids) || !Array.isArray(orderBookData.asks)) {
        console.warn('Invalid Binance data structure:', { 
          hasBids: Array.isArray(orderBookData?.bids),
          hasAsks: Array.isArray(orderBookData?.asks),
          dataKeys: Object.keys(orderBookData || {}),
          rawData: data
        });
        return null;
      }

      if (orderBookData.bids.length === 0 && orderBookData.asks.length === 0) {
        console.warn('Empty orderbook data from Binance');
        return null;
      }

      const bids: OrderBookLevel[] = [];
      const asks: OrderBookLevel[] = [];
      let totalBid = 0;
      let totalAsk = 0;
      
      // Parse bids (highest to lowest) with validation
      for (const [priceStr, quantityStr] of orderBookData.bids) {
        const price = parseFloat(priceStr);
        const qty = parseFloat(quantityStr);
        
        // Validate numeric values
        if (isNaN(price) || isNaN(qty) || price <= 0 || qty <= 0) {
          console.warn('Invalid bid data:', priceStr, quantityStr);
          continue;
        }
        
        totalBid += qty;
        bids.push({
          price,
          quantity: qty,
          total: totalBid,
          timestamp: Date.now()
        });
      }
      
      // Parse asks (lowest to highest) with validation
      for (const [priceStr, quantityStr] of orderBookData.asks) {
        const price = parseFloat(priceStr);
        const qty = parseFloat(quantityStr);
        
        // Validate numeric values
        if (isNaN(price) || isNaN(qty) || price <= 0 || qty <= 0) {
          console.warn('Invalid ask data:', priceStr, quantityStr);
          continue;
        }
        
        totalAsk += qty;
        asks.push({
          price,
          quantity: qty,
          total: totalAsk,
          timestamp: Date.now()
        });
      }
      
      // Ensure we have valid data
      if (bids.length === 0 && asks.length === 0) {
        console.warn('No valid orderbook levels after parsing');
        return null;
      }
      
      return { bids, asks, symbol, venue, timestamp: Date.now() };
    } catch (error) {
      console.error('Error parsing Binance data:', error);
      return null;
    }
  }

  private handleReconnect(
    key: string, 
    venue: string, 
    symbol: string, 
    url: string,
    parser: (data: any, symbol: string, venue: string) => OrderBookData | null
  ): void {
    const attempts = this.reconnectAttempts.get(key) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(key, attempts + 1);
      const delay = Math.min(this.reconnectDelay * Math.pow(2, attempts), 30000); // Max 30s
      
      console.log(`Reconnecting to ${venue} (attempt ${attempts + 1}/${this.maxReconnectAttempts}) in ${delay}ms`);
      
      setTimeout(() => {
        try {
          this.connectToWebSocket(venue, symbol, url, parser);
        } catch (error) {
          console.error(`Reconnection failed for ${key}:`, error);
          this.handleReconnect(key, venue, symbol, url, parser);
        }
      }, delay);
    } else {
      console.warn(`Max reconnection attempts reached for ${key}, switching to mock data`);
      this.startMockDataFeed(venue, symbol);
    }
  }

  private startMockDataFeed(venue: string, symbol: string): void {
    const key = `${venue}-${symbol}`;
    
    console.log(`🎯 Starting demo data feed for ${venue} - ${symbol}`);
    console.log(`This provides realistic orderbook simulation for visualization purposes.`);
    
    const interval = setInterval(() => {
      const mockData = this.generateMockOrderBook(symbol, venue);
      this.notifySubscribers(key, mockData);
    }, 3000); // Update every 3000ms (3 seconds) for better user-friendly experience
    
    // Store interval for cleanup
    (this.wsConnections as any).set(`${key}-interval`, interval);
  }

  subscribe(venue: string, symbol: string, callback: (data: OrderBookData) => void): () => void {
    const key = `${venue}-${symbol}`;
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    
    this.subscribers.get(key)!.add(callback);
    
    // Auto-connect if not already connected
    if (!this.wsConnections.has(key)) {
      if (venue === 'binance') {
        this.connectToBinance(symbol);
      } else {
        // For demo, use mock data for other venues
        this.startMockDataFeed(venue, symbol);
      }
    }
    
    // Return unsubscribe function
    return () => {
      this.subscribers.get(key)?.delete(callback);
      if (this.subscribers.get(key)?.size === 0) {
        this.disconnect(venue, symbol);
      }
    };
  }

  private notifySubscribers(key: string, data: OrderBookData): void {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.forEach(callback => callback(data));
    }
  }

  disconnect(venue: string, symbol: string): void {
    const key = `${venue}-${symbol}`;
    
    const ws = this.wsConnections.get(key);
    if (ws) {
      ws.close();
      this.wsConnections.delete(key);
    }
    
    // Clean up mock data interval
    const interval = (this.wsConnections as any).get(`${key}-interval`);
    if (interval) {
      clearInterval(interval);
      (this.wsConnections as any).delete(`${key}-interval`);
    }
    
    this.subscribers.delete(key);
    this.reconnectAttempts.delete(key);
  }

  disconnectAll(): void {
    this.wsConnections.forEach((ws, key) => {
      if (typeof ws.close === 'function') {
        ws.close();
      } else {
        // It's an interval
        clearInterval(ws as any);
      }
    });
    
    this.wsConnections.clear();
    this.subscribers.clear();
    this.reconnectAttempts.clear();
  }

  // Get mock market data
  getMarketData(symbol: string): MarketData {
    return {
      symbol,
      price: 50000 + (Math.random() - 0.5) * 1000,
      spread: 10 + Math.random() * 5,
      volume24h: 1000000 + Math.random() * 500000,
      change24h: (Math.random() - 0.5) * 10
    };
  }
}

export const orderBookService = new OrderBookService();
