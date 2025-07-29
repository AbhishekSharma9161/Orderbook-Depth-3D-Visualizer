"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Activity,
} from 'lucide-react';
import { VisualizationSettings, Venue, MarketData } from '@/types/orderbook';

interface ControlPanelProps {
  settings: VisualizationSettings;
  onSettingsChange: (settings: VisualizationSettings) => void;
  marketData: MarketData;
  onResetView: () => void;
  isMobile?: boolean;
}

export default function ControlPanel({
  settings,
  onSettingsChange,
  marketData,
  onResetView,
  isMobile = false
}: ControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateSettings = (updates: Partial<VisualizationSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const toggleVenue = (venueId: string) => {
    const updatedVenues = settings.venues.map(venue =>
      venue.id === venueId ? { ...venue, enabled: !venue.enabled } : venue
    );
    updateSettings({ venues: updatedVenues });
  };

  if (isMobile) {
    return (
      <Card className="bg-transparent border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base">Controls</CardTitle>
            <Badge variant="default" className="text-xs bg-green-600">
              LIVE
            </Badge>
          </div>

          {/* Mobile Market Data */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="text-center">
              <div className="text-gray-400">Price</div>
              <div className="text-white font-mono">${marketData.price.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">24h Change</div>
              <div className={`font-mono ${marketData.change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                {marketData.change24h.toFixed(2)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Spread</div>
              <div className="text-white font-mono">${marketData.spread.toFixed(2)}</div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Controls - Mobile Layout */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateSettings({ rotationSpeed: settings.rotationSpeed > 0 ? 0 : 0.4 })}
              className="text-white border-gray-600 hover:bg-gray-800 text-xs"
            >
              {settings.rotationSpeed > 0 ? (
                <>🟢 Auto</>
              ) : (
                <>⚫ Manual</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onResetView}
              className="text-white border-gray-600 hover:bg-gray-800 text-xs"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-white border-gray-600 hover:bg-gray-800 text-xs"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </div>

          {/* Mobile Venues - Horizontal Scroll */}
          <div className="space-y-2">
            <Label className="text-white text-sm">Trading Venues</Label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {settings.venues.map(venue => (
                <Button
                  key={venue.id}
                  variant={venue.enabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleVenue(venue.id)}
                  className={`flex-shrink-0 text-xs ${
                    venue.enabled
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'text-gray-400 border-gray-600 hover:bg-gray-800'
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: venue.color }}
                  />
                  {venue.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Pressure Zones Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-yellow-500" />
              <Label className="text-white text-sm">Pressure Zones</Label>
            </div>
            <Switch
              checked={settings.showPressureZones}
              onCheckedChange={(checked) => updateSettings({ showPressureZones: checked })}
            />
          </div>

          {isExpanded && (
            <>
              <Separator className="bg-gray-700" />

              {/* Advanced Settings - Mobile Optimized */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-white text-sm">Time Range</Label>
                  <Select
                    value={settings.timeRange.toString()}
                    onValueChange={(value) => updateSettings({ timeRange: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="1">1 minute</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white text-sm">
                    Rotation: {settings.rotationSpeed.toFixed(1)}x
                  </Label>
                  <Slider
                    value={[settings.rotationSpeed]}
                    onValueChange={([value]) => updateSettings({ rotationSpeed: value })}
                    max={2}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="fixed top-20 left-4 z-10 w-full max-w-sm">
      <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg">Orderbook Control</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs bg-green-600 hover:bg-green-600">
                LIVE
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-white"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Market Data with smooth transitions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Price:</span>
              <span className="text-white font-mono transition-all duration-500 ease-in-out">${marketData.price.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">24h Change:</span>
              <div className="flex items-center gap-1">
                <span className={`transition-all duration-500 ease-in-out ${marketData.change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {marketData.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Spread:</span>
              <span className="text-white font-mono transition-all duration-500 ease-in-out">${marketData.spread.toFixed(2)}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Quick Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateSettings({ rotationSpeed: settings.rotationSpeed > 0 ? 0 : 0.4 })}
              className="flex-1 text-white border-gray-600 hover:bg-gray-800"
            >
              {settings.rotationSpeed > 0 ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Rotate
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onResetView}
              className="text-white border-gray-600 hover:bg-gray-800"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* Venues */}
          <div className="space-y-2">
            <Label className="text-white text-sm">Trading Venues</Label>
            <div className="grid grid-cols-2 gap-2">
              {settings.venues.map(venue => (
                <Button
                  key={venue.id}
                  variant={venue.enabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleVenue(venue.id)}
                  className={`justify-start text-xs ${
                    venue.enabled 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'text-gray-400 border-gray-600 hover:bg-gray-800'
                  }`}
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: venue.color }}
                  />
                  {venue.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Pressure Zones Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-yellow-500" />
              <Label className="text-white text-sm">Pressure Zones</Label>
            </div>
            <Switch
              checked={settings.showPressureZones}
              onCheckedChange={(checked) => updateSettings({ showPressureZones: checked })}
            />
          </div>

          {isExpanded && (
            <>
              <Separator className="bg-gray-700" />
              
              {/* Advanced Settings */}
              <div className="space-y-4">
                {/* Time Range */}
                <div className="space-y-2">
                  <Label className="text-white text-sm">Time Range</Label>
                  <Select
                    value={settings.timeRange.toString()}
                    onValueChange={(value) => updateSettings({ timeRange: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      <SelectItem value="1">1 minute</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rotation Speed */}
                <div className="space-y-2">
                  <Label className="text-white text-sm">
                    Rotation Speed: {settings.rotationSpeed.toFixed(1)}x
                  </Label>
                  <Slider
                    value={[settings.rotationSpeed]}
                    onValueChange={([value]) => updateSettings({ rotationSpeed: value })}
                    max={2}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                {/* Quantity Threshold */}
                <div className="space-y-2">
                  <Label className="text-white text-sm">
                    Min Quantity: {settings.quantityThreshold.toFixed(3)}
                  </Label>
                  <Slider
                    value={[settings.quantityThreshold]}
                    onValueChange={([value]) => updateSettings({ quantityThreshold: value })}
                    max={1}
                    min={0.001}
                    step={0.001}
                    className="w-full"
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
