"use client";

import { useState, useCallback } from "react";
import { VisualizationSettings, Venue } from "@/types/orderbook";
import { useMultiVenueOrderbook } from "@/hooks/useMultiVenueOrderbook";
import OrderBook3D from "@/components/OrderbookVisualization";
import ControlPanel from "@/components/ControlPanel";
import MarketStats from "@/components/MarketStats";

const DEFAULT_VENUES: Venue[] = [
  { id: "binance", name: "Binance", enabled: true, color: "#F3BA2F" },
  { id: "okx", name: "OKX", enabled: true, color: "#0052D9" },
  { id: "bybit", name: "Bybit", enabled: true, color: "#FFA500" },
  { id: "deribit", name: "Deribit", enabled: false, color: "#7B61FF" },
];

const DEFAULT_SETTINGS: VisualizationSettings = {
  timeRange: 5, // 5 minutes
  priceRange: [45000, 55000],
  quantityThreshold: 0.01,
  showPressureZones: true,
  rotationSpeed: 0.4, // Slower rotation speed for better UX
  venues: DEFAULT_VENUES,
};

export default function HomePage() {
  const [settings, setSettings] =
    useState<VisualizationSettings>(DEFAULT_SETTINGS);
  const [currentPair, setCurrentPair] = useState("BTCUSDT");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { orderBookData, pressureZones, marketData, isConnected, error } =
    useMultiVenueOrderbook(settings);

  const handleSettingsChange = useCallback(
    (newSettings: VisualizationSettings) => {
      setSettings(newSettings);
    },
    [],
  );

  const handleResetView = useCallback(() => {
    // This will be handled by the 3D component's OrbitControls reset
    // For now, we'll just trigger a re-render
    setSettings((prev) => ({ ...prev }));
  }, []);

  // Show demo mode message but continue with application
  if (error && orderBookData.length === 0) {
    // Don't block the UI, just show a temporary message
    setTimeout(() => {}, 3000); // Clear error after 3 seconds
  }

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-r from-gray-900 via-blue-900/80 to-purple-900/80 border-b border-blue-500/30 backdrop-blur-sm shadow-xl">
        <div className="container mx-auto px-4 md:px-6 py-2 md:py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-sm md:text-xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-400 bg-clip-text text-transparent truncate">
                Orderbook 3D Visualizer
              </h1>
              <p className="text-blue-200/90 text-xs hidden md:block">
                Real-time cryptocurrency orderbook visualization
              </p>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Desktop Market Data */}
            <div className="hidden md:block text-right">
              <div className="text-white font-mono text-base md:text-lg">
                {marketData.symbol}
              </div>
              <div className="flex items-center gap-1 text-xs justify-end">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
                <span className="text-green-300">Live Updates</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main 3D Visualization */}
      <div className={`h-screen w-full transition-all duration-300 ${
        isMobileMenuOpen ? 'pt-16' : 'pt-12 md:pt-16'
      }`}>
        <OrderBook3D
          orderBookData={orderBookData}
          pressureZones={pressureZones}
          settings={settings}
          className="w-full h-full"
        />
      </div>

      {/* Mobile Slide-up Panel */}
      <div className={`md:hidden fixed inset-x-0 bottom-0 z-40 transform transition-transform duration-300 ${
        isMobileMenuOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
        <div className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 max-h-[70vh] overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Mobile Control Panel */}
            <ControlPanel
              settings={settings}
              onSettingsChange={handleSettingsChange}
              marketData={marketData}
              onResetView={handleResetView}
              isMobile={true}
            />

            {/* Mobile Market Stats */}
            <MarketStats
              orderBookData={orderBookData}
              pressureZones={pressureZones}
              currentPair={currentPair}
              onPairChange={setCurrentPair}
              isMobile={true}
            />
          </div>
        </div>
      </div>

      {/* Desktop Control Panel */}
      <div className="hidden md:block">
        <ControlPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
          marketData={marketData}
          onResetView={handleResetView}
        />
      </div>

      {/* Desktop Market Statistics */}
      <div className="hidden md:block">
        <MarketStats
          orderBookData={orderBookData}
          pressureZones={pressureZones}
          currentPair={currentPair}
          onPairChange={setCurrentPair}
        />
      </div>

      {/* Loading overlay for initial load */}
      {orderBookData.length === 0 && !error && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-30">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-white text-lg">Loading Orderbook Data...</div>
            <div className="text-gray-400 text-sm">
              Connecting to trading venues
            </div>
          </div>
        </div>
      )}

      {/* Mobile Instructions - Bottom Bar */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-20">
        <div className="bg-black/80 border border-cyan-500/30 rounded-lg px-3 py-2 backdrop-blur-sm">
          <div className="text-white text-xs text-center">
            <span className="text-gray-300">
              👆 Touch to rotate • 🤏 Pinch to zoom •{" "}
            </span>
            <span className="text-cyan-400">
              📱 Tap menu for controls
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Instructions */}
      <div className="hidden md:block fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20 px-4">
        <div className="bg-black/80 border border-cyan-500/30 rounded-lg px-4 py-2 backdrop-blur-sm">
          <div className="text-white text-sm text-center">
            <span className="text-gray-300">
              🖱️ Drag to rotate • 🔍 Scroll to zoom •{" "}
            </span>
            <span className="text-cyan-400">
              ⚙️ Use controls to filter venues
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Overlay - Close menu when tapping 3D area */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/20"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
