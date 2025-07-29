export interface OrderBookLevel {
  price: number;
  quantity: number;
  total: number;
  timestamp: number;
}

export interface OrderBookData {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  symbol: string;
  venue: string;
  timestamp: number;
}

export interface Venue {
  id: string;
  name: string;
  enabled: boolean;
  color: string;
}

export interface PressureZone {
  price: number;
  intensity: number;
  type: 'support' | 'resistance';
  volume: number;
}

export interface VisualizationSettings {
  timeRange: number; // minutes
  priceRange: [number, number];
  quantityThreshold: number;
  showPressureZones: boolean;
  rotationSpeed: number;
  venues: Venue[];
}

export interface MarketData {
  symbol: string;
  price: number;
  spread: number;
  volume24h: number;
  change24h: number;
}
