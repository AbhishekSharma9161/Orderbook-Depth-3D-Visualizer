import { OrderBookData, PressureZone, OrderBookLevel } from '@/types/orderbook';

export class PressureZoneAnalyzer {
  private static readonly VOLUME_THRESHOLD_MULTIPLIER = 1.5;
  private static readonly CLUSTERING_DISTANCE = 0.001; // 0.1% price distance
  private static readonly MIN_ZONE_STRENGTH = 0.3;

  static analyzePressureZones(orderBookData: OrderBookData[]): PressureZone[] {
    if (orderBookData.length === 0) return [];

    const zones: PressureZone[] = [];
    const allLevels = this.combineOrderBookLevels(orderBookData);
    
    // Analyze support zones (bid side)
    const supportZones = this.findVolumeSpikes(allLevels.bids, 'support');
    zones.push(...supportZones);
    
    // Analyze resistance zones (ask side)
    const resistanceZones = this.findVolumeSpikes(allLevels.asks, 'resistance');
    zones.push(...resistanceZones);
    
    // Sort by intensity
    return zones.sort((a, b) => b.intensity - a.intensity);
  }

  private static combineOrderBookLevels(orderBookData: OrderBookData[]): {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
  } {
    const bidMap = new Map<number, number>();
    const askMap = new Map<number, number>();
    
    orderBookData.forEach(data => {
      data.bids.forEach(level => {
        const roundedPrice = Math.round(level.price * 100) / 100;
        bidMap.set(roundedPrice, (bidMap.get(roundedPrice) || 0) + level.quantity);
      });
      
      data.asks.forEach(level => {
        const roundedPrice = Math.round(level.price * 100) / 100;
        askMap.set(roundedPrice, (askMap.get(roundedPrice) || 0) + level.quantity);
      });
    });
    
    const bids: OrderBookLevel[] = Array.from(bidMap.entries())
      .map(([price, quantity]) => ({
        price,
        quantity,
        total: quantity,
        timestamp: Date.now()
      }))
      .sort((a, b) => b.price - a.price);
    
    const asks: OrderBookLevel[] = Array.from(askMap.entries())
      .map(([price, quantity]) => ({
        price,
        quantity,
        total: quantity,
        timestamp: Date.now()
      }))
      .sort((a, b) => a.price - b.price);
    
    return { bids, asks };
  }

  private static findVolumeSpikes(
    levels: OrderBookLevel[], 
    type: 'support' | 'resistance'
  ): PressureZone[] {
    if (levels.length < 3) return [];

    const zones: PressureZone[] = [];
    const avgVolume = levels.reduce((sum, level) => sum + level.quantity, 0) / levels.length;
    const threshold = avgVolume * this.VOLUME_THRESHOLD_MULTIPLIER;

    for (let i = 1; i < levels.length - 1; i++) {
      const current = levels[i];
      const prev = levels[i - 1];
      const next = levels[i + 1];

      // Check if this level has significantly higher volume than neighbors
      if (current.quantity > threshold && 
          current.quantity > prev.quantity * 1.3 && 
          current.quantity > next.quantity * 1.3) {
        
        // Calculate zone intensity based on volume concentration
        const intensity = Math.min(current.quantity / (avgVolume * 3), 1);
        
        if (intensity >= this.MIN_ZONE_STRENGTH) {
          zones.push({
            price: current.price,
            intensity,
            type,
            volume: current.quantity
          });
        }
      }
    }

    // Merge nearby zones
    return this.mergeNearbyZones(zones);
  }

  private static mergeNearbyZones(zones: PressureZone[]): PressureZone[] {
    if (zones.length <= 1) return zones;

    const merged: PressureZone[] = [];
    zones.sort((a, b) => a.price - b.price);

    let current = zones[0];
    
    for (let i = 1; i < zones.length; i++) {
      const next = zones[i];
      const distance = Math.abs(next.price - current.price) / current.price;
      
      if (distance <= this.CLUSTERING_DISTANCE && current.type === next.type) {
        // Merge zones
        const totalVolume = current.volume + next.volume;
        const weightedPrice = (current.price * current.volume + next.price * next.volume) / totalVolume;
        
        current = {
          price: weightedPrice,
          intensity: Math.max(current.intensity, next.intensity),
          type: current.type,
          volume: totalVolume
        };
      } else {
        merged.push(current);
        current = next;
      }
    }
    
    merged.push(current);
    return merged;
  }

  static calculateImbalance(orderBookData: OrderBookData): number {
    const totalBidVolume = orderBookData.bids.reduce((sum, level) => sum + level.quantity, 0);
    const totalAskVolume = orderBookData.asks.reduce((sum, level) => sum + level.quantity, 0);
    
    const totalVolume = totalBidVolume + totalAskVolume;
    if (totalVolume === 0) return 0;
    
    // Return value between -1 (ask dominated) and 1 (bid dominated)
    return (totalBidVolume - totalAskVolume) / totalVolume;
  }

  static getSpreadAnalysis(orderBookData: OrderBookData): {
    spread: number;
    spreadPercent: number;
    midPrice: number;
    tightness: 'tight' | 'normal' | 'wide';
  } {
    if (orderBookData.bids.length === 0 || orderBookData.asks.length === 0) {
      return { spread: 0, spreadPercent: 0, midPrice: 0, tightness: 'normal' };
    }
    
    const bestBid = orderBookData.bids[0].price;
    const bestAsk = orderBookData.asks[0].price;
    const spread = bestAsk - bestBid;
    const midPrice = (bestBid + bestAsk) / 2;
    const spreadPercent = (spread / midPrice) * 100;
    
    let tightness: 'tight' | 'normal' | 'wide' = 'normal';
    if (spreadPercent < 0.05) tightness = 'tight';
    else if (spreadPercent > 0.2) tightness = 'wide';
    
    return { spread, spreadPercent, midPrice, tightness };
  }
}
