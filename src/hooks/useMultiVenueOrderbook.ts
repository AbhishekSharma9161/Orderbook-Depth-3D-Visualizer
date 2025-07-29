"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { OrderBookData, PressureZone, VisualizationSettings, Venue, MarketData } from '@/types/orderbook';
import { orderBookService } from '@/services/multiVenueService';
import { PressureZoneAnalyzer } from '@/lib/pressure-analysis';

export function useMultiVenueOrderbook(settings: VisualizationSettings) {
  const [orderBookData, setOrderBookData] = useState<OrderBookData[]>([]);
  const [pressureZones, setPressureZones] = useState<PressureZone[]>([]);
  const [marketData, setMarketData] = useState<MarketData>({
    symbol: 'BTCUSDT',
    price: 50000,
    spread: 10,
    volume24h: 1000000,
    change24h: 2.5
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataHistoryRef = useRef<Map<string, OrderBookData[]>>(new Map());
  const maxHistoryLength = 20; // Keep last 20 data points for 3D visualization

  const updateCombinedData = useCallback(() => {
    const allData: OrderBookData[] = [];
    const enabledVenues = settings.venues.filter(venue => venue.enabled);
    
    enabledVenues.forEach(venue => {
      const venueKey = `${venue.id}-BTCUSDT`;
      const venueHistory = dataHistoryRef.current.get(venueKey) || [];
      allData.push(...venueHistory);
    });
    
    // Sort by timestamp and keep most recent data points
    const sortedData = allData
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-maxHistoryLength);
    
    setOrderBookData(sortedData);
    
    // Update pressure zones
    if (sortedData.length > 0) {
      const zones = PressureZoneAnalyzer.analyzePressureZones(sortedData);
      setPressureZones(zones);
    }
  }, [settings.venues]);

  // Subscribe to orderbook data
  useEffect(() => {
    const unsubscribeFunctions: (() => void)[] = [];
    
    const enabledVenues = settings.venues.filter(venue => venue.enabled);
    
    if (enabledVenues.length === 0) {
      setOrderBookData([]);
      return;
    }

    enabledVenues.forEach(venue => {
      try {
        const unsubscribe = orderBookService.subscribe(
          venue.id,
          'BTCUSDT',
          (data: OrderBookData) => {
            // Check if this is real data or demo data
            const isDemo = data.venue.includes('Demo');
            setIsConnected(!isDemo);
            setError(null);
            
            // Update venue-specific history
            const venueKey = `${venue.id}-BTCUSDT`;
            const currentHistory = dataHistoryRef.current.get(venueKey) || [];
            const newHistory = [...currentHistory, data].slice(-maxHistoryLength);
            dataHistoryRef.current.set(venueKey, newHistory);
            
            // Combine all venue data for visualization
            updateCombinedData();
            
            // Update market data periodically
            if (venue.id === 'binance') {
              setMarketData(orderBookService.getMarketData('BTCUSDT'));
            }
          }
        );
        
        unsubscribeFunctions.push(unsubscribe);
      } catch (err) {
        console.error(`Failed to connect to ${venue.name}:`, err);
        setError(`Connection failed: ${venue.name}`);
      }
    });

    // Cleanup function
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      // Clear data history for disabled venues
      const enabledVenueIds = enabledVenues.map(v => v.id);
      const allKeys = Array.from(dataHistoryRef.current.keys());
      allKeys.forEach(key => {
        const venueId = key.split('-')[0];
        if (!enabledVenueIds.includes(venueId)) {
          dataHistoryRef.current.delete(key);
        }
      });
    };
  }, [settings.venues, updateCombinedData]);

  // Update combined data when venues change
  useEffect(() => {
    updateCombinedData();
  }, [updateCombinedData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      orderBookService.disconnectAll();
      dataHistoryRef.current.clear();
    };
  }, []);

  return {
    orderBookData,
    pressureZones,
    marketData,
    isConnected,
    error,
    setMarketData
  };
}
