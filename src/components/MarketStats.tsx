"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3,
  Zap,
  Target,
} from 'lucide-react';
import { OrderBookData, PressureZone } from '@/types/orderbook';
import { PressureZoneAnalyzer } from '@/lib/pressure-analysis';

interface MarketStatsProps {
  orderBookData: OrderBookData[];
  pressureZones: PressureZone[];
  currentPair: string;
  onPairChange: (pair: string) => void;
  className?: string;
  isMobile?: boolean;
}

export default function MarketStats({ orderBookData, pressureZones, currentPair, onPairChange, className = "", isMobile = false }: MarketStatsProps) {
  const tradingPairs = [
    'BTCUSDT',
    'ETHUSDT', 
    'ADAUSDT',
    'DOTUSDT',
    'LINKUSDT',
    'SOLUSDT'
  ];

  const latestData = orderBookData[orderBookData.length - 1];
  
  if (!latestData) {
    return (
      <Card className={`${isMobile ? 'bg-transparent' : 'bg-gray-900/95'} border-gray-700 ${isMobile ? '' : 'backdrop-blur-sm'} ${className}`}>
        <CardContent className="p-4">
          <div className="text-gray-400 text-center">No data available</div>
        </CardContent>
      </Card>
    );
  }

  const spreadAnalysis = PressureZoneAnalyzer.getSpreadAnalysis(latestData);
  const imbalance = PressureZoneAnalyzer.calculateImbalance(latestData);
  
  // Calculate volume metrics
  const totalBidVolume = latestData.bids.reduce((sum, level) => sum + level.quantity, 0);
  const totalAskVolume = latestData.asks.reduce((sum, level) => sum + level.quantity, 0);
  const totalVolume = totalBidVolume + totalAskVolume;
  
  // Find strongest pressure zones
  const supportZones = pressureZones.filter(z => z.type === 'support').slice(0, 2);
  const resistanceZones = pressureZones.filter(z => z.type === 'resistance').slice(0, 2);
  
  const getSpreadColor = (tightness: string) => {
    switch (tightness) {
      case 'tight': return 'text-green-500';
      case 'wide': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getImbalanceColor = (imbalance: number) => {
    if (Math.abs(imbalance) < 0.1) return 'text-gray-400';
    return imbalance > 0 ? 'text-green-500' : 'text-red-500';
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        {/* Mobile Market Overview */}
        <Card className="bg-transparent border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Market Data
              </h3>
            </div>

            {/* Trading Pair Selector */}
            <div className="mb-4">
              <label className="text-gray-400 text-xs mb-2 block">Trading Pair</label>
              <Select value={currentPair} onValueChange={onPairChange}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {tradingPairs.map(pair => (
                    <SelectItem key={pair} value={pair} className="text-white hover:bg-gray-700">
                      {pair}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Spread Analysis */}
              <div className="text-center">
                <span className="text-gray-400 text-xs block">Spread</span>
                <div className={`font-mono ${getSpreadColor(spreadAnalysis.tightness)}`}>
                  ${spreadAnalysis.spread.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  {spreadAnalysis.spreadPercent.toFixed(3)}%
                </div>
              </div>

              {/* Market Imbalance */}
              <div className="text-center">
                <span className="text-gray-400 text-xs block">Imbalance</span>
                <div className="flex items-center justify-center gap-1">
                  {imbalance > 0.05 ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : imbalance < -0.05 ? (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  ) : (
                    <Activity className="w-3 h-3 text-gray-400" />
                  )}
                  <span className={`font-mono text-sm ${getImbalanceColor(imbalance)}`}>
                    {(imbalance * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Volume Distribution */}
            <div className="mt-4 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Volume</span>
                <span className="text-white font-mono">{totalVolume.toFixed(2)}</span>
              </div>
              <div className="flex gap-1">
                <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${(totalBidVolume / totalVolume) * 100}%` }}
                  />
                </div>
                <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${(totalAskVolume / totalVolume) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Bids: {totalBidVolume.toFixed(2)}</span>
                <span>Asks: {totalAskVolume.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Pressure Zones */}
        <Card className="bg-transparent border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-yellow-500" />
              <h3 className="text-white font-semibold">Pressure Zones</h3>
            </div>

            <div className="space-y-3">
              {/* Support Zones */}
              {supportZones.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-3 h-3 text-green-500" />
                    <span className="text-green-500 text-sm font-medium">Support</span>
                  </div>
                  <div className="space-y-1">
                    {supportZones.map((zone, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm font-mono">
                          ${zone.price.toFixed(0)}
                        </span>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={zone.intensity * 100}
                            className="w-16 h-2"
                          />
                          <span className="text-green-500 text-xs w-8">
                            {(zone.intensity * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resistance Zones */}
              {resistanceZones.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-3 h-3 text-red-500" />
                    <span className="text-red-500 text-sm font-medium">Resistance</span>
                  </div>
                  <div className="space-y-1">
                    {resistanceZones.map((zone, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm font-mono">
                          ${zone.price.toFixed(0)}
                        </span>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={zone.intensity * 100}
                            className="w-16 h-2"
                          />
                          <span className="text-red-500 text-xs w-8">
                            {(zone.intensity * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pressureZones.length === 0 && (
                <div className="text-gray-500 text-sm text-center py-2">
                  No significant pressure zones detected
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Connection Status */}
        <Card className="bg-transparent border-gray-700">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-white text-sm">Live Data</span>
              </div>
              <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                {latestData.venue}
              </Badge>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Last update: {new Date(latestData.timestamp).toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`fixed top-20 right-4 z-10 w-full max-w-xs space-y-3 ${className}`}>
      {/* Market Overview */}
      <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Market Overview
            </h3>
          </div>
          
          {/* Trading Pair Selector */}
          <div className="mb-4">
            <label className="text-gray-400 text-xs mb-2 block">Trading Pair</label>
            <Select value={currentPair} onValueChange={onPairChange}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {tradingPairs.map(pair => (
                  <SelectItem key={pair} value={pair} className="text-white hover:bg-gray-700">
                    {pair}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            {/* Spread Analysis */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Spread</span>
              <div className="text-right">
                <div className={`font-mono text-sm ${getSpreadColor(spreadAnalysis.tightness)}`}>
                  ${spreadAnalysis.spread.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  {spreadAnalysis.spreadPercent.toFixed(3)}%
                </div>
              </div>
            </div>

            {/* Market Imbalance */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Imbalance</span>
              <div className="flex items-center gap-2">
                {imbalance > 0.05 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : imbalance < -0.05 ? (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                ) : (
                  <Activity className="w-3 h-3 text-gray-400" />
                )}
                <span className={`font-mono text-sm ${getImbalanceColor(imbalance)}`}>
                  {(imbalance * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Volume Distribution */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Volume</span>
                <span className="text-white font-mono">{totalVolume.toFixed(2)}</span>
              </div>
              <div className="flex gap-1">
                <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${(totalBidVolume / totalVolume) * 100}%` }}
                  />
                </div>
                <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${(totalAskVolume / totalVolume) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Bids: {totalBidVolume.toFixed(2)}</span>
                <span>Asks: {totalAskVolume.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pressure Zones */}
      <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-500" />
            <h3 className="text-white font-semibold">Pressure Zones</h3>
          </div>
          
          <div className="space-y-3">
            {/* Support Zones */}
            {supportZones.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="w-3 h-3 text-green-500" />
                  <span className="text-green-500 text-sm font-medium">Support</span>
                </div>
                {supportZones.map((zone, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm font-mono">
                      ${zone.price.toFixed(0)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={zone.intensity * 100} 
                        className="w-12 h-1.5"
                      />
                      <span className="text-green-500 text-xs">
                        {(zone.intensity * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Resistance Zones */}
            {resistanceZones.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="w-3 h-3 text-red-500" />
                  <span className="text-red-500 text-sm font-medium">Resistance</span>
                </div>
                {resistanceZones.map((zone, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm font-mono">
                      ${zone.price.toFixed(0)}
                    </span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={zone.intensity * 100} 
                        className="w-12 h-1.5"
                      />
                      <span className="text-red-500 text-xs">
                        {(zone.intensity * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pressureZones.length === 0 && (
              <div className="text-gray-500 text-sm text-center py-2">
                No significant pressure zones detected
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-white text-sm">Live Data</span>
            </div>
            <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
              {latestData.venue}
            </Badge>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Last update: {new Date(latestData.timestamp).toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
