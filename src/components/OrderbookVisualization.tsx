"use client";

import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Line, Box } from '@react-three/drei';
import * as THREE from 'three';
import { OrderBookData, PressureZone, VisualizationSettings } from '@/types/orderbook';

interface OrderBookBarProps {
  position: [number, number, number];
  height: number;
  color: string;
  opacity?: number;
}

function OrderBookBar({ position, height, color, opacity = 0.8 }: OrderBookBarProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhongMaterial>(null);

  useFrame(() => {
    if (meshRef.current) {
      // Smooth animation for bar height changes
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, height, 0.1);
    }
  });

  return (
    <Box
      ref={meshRef}
      position={position}
      args={[0.8, 1, 0.8]}
      scale={[1, height, 1]}
    >
      <meshPhongMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={opacity}
        // Performance optimizations
        toneMapped={false}
        fog={false}
      />
    </Box>
  );
}

interface PressureZoneVisualizerProps {
  zones: PressureZone[];
  maxPrice: number;
  minPrice: number;
}

function PressureZoneVisualizer({ zones, maxPrice, minPrice }: PressureZoneVisualizerProps) {
  const priceRange = maxPrice - minPrice;
  
  return (
    <>
      {zones.map((zone, index) => {
        const x = ((zone.price - minPrice) / priceRange) * 16 - 8;
        const radius = zone.intensity * 3;
        const color = zone.type === 'support' ? '#10b981' : '#ef4444';
        
        return (
          <group key={index}>
            <mesh position={[x, 0, 0]}>
              <cylinderGeometry args={[radius, radius, 0.1, 16]} />
              <meshPhongMaterial color={color} transparent opacity={0.3} />
            </mesh>
            <Text
              position={[x, radius + 1, 0]}
              fontSize={0.5}
              color={color}
              anchorX="center"
            >
              {zone.price.toFixed(0)}
            </Text>
          </group>
        );
      })}
    </>
  );
}

interface GridProps {
  size: number;
}

function Grid({ size }: GridProps) {
  const points = useMemo(() => {
    const gridPoints: THREE.Vector3[] = [];
    const halfSize = size / 2;

    // X-axis grid lines
    for (let i = -halfSize; i <= halfSize; i += 2) {
      gridPoints.push(new THREE.Vector3(i, 0, -halfSize));
      gridPoints.push(new THREE.Vector3(i, 0, halfSize));
    }

    // Z-axis grid lines
    for (let i = -halfSize; i <= halfSize; i += 2) {
      gridPoints.push(new THREE.Vector3(-halfSize, 0, i));
      gridPoints.push(new THREE.Vector3(halfSize, 0, i));
    }

    return gridPoints;
  }, [size]);

  return (
    <Line
      points={points}
      color="#374151"
      lineWidth={1}
    />
  );
}

interface AxisLabelsProps {
  maxPrice: number;
  minPrice: number;
  maxQuantity: number;
}

function AxisLabels({ maxPrice, minPrice, maxQuantity }: AxisLabelsProps) {
  return (
    <>
      {/* Simple price labels */}
      <Text position={[-8, -1, 0]} fontSize={0.8} color="#9ca3af" anchorX="center">
        ${minPrice.toFixed(0)}
      </Text>
      <Text position={[0, -1, 0]} fontSize={0.8} color="#9ca3af" anchorX="center">
        ${((maxPrice + minPrice) / 2).toFixed(0)}
      </Text>
      <Text position={[8, -1, 0]} fontSize={0.8} color="#9ca3af" anchorX="center">
        ${maxPrice.toFixed(0)}
      </Text>

      {/* Simple quantity labels */}
      <Text position={[-12, 5, 0]} fontSize={0.8} color="#9ca3af" rotation={[0, 0, Math.PI / 2]} anchorX="center">
        {(maxQuantity / 2).toFixed(2)}
      </Text>
      <Text position={[-12, 10, 0]} fontSize={0.8} color="#9ca3af" rotation={[0, 0, Math.PI / 2]} anchorX="center">
        {maxQuantity.toFixed(2)}
      </Text>

      {/* Simple time labels */}
      <Text position={[0, -1, -8]} fontSize={0.8} color="#9ca3af" anchorX="center">
        -10s
      </Text>
      <Text position={[0, -1, 8]} fontSize={0.8} color="#9ca3af" anchorX="center">
        Now
      </Text>

      {/* Clean axis titles */}
      <Text position={[0, -3, 0]} fontSize={1.2} color="#f3f4f6" anchorX="center">
        Price
      </Text>
      <Text position={[-15, 5, 0]} fontSize={1.2} color="#f3f4f6" rotation={[0, 0, Math.PI / 2]} anchorX="center">
        Quantity
      </Text>
      <Text position={[0, -3, -12]} fontSize={1.2} color="#f3f4f6" anchorX="center">
        Time
      </Text>
    </>
  );
}

// Legend component for the 3D visualization
function VisualizationLegend() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="absolute top-4 left-4 z-20 bg-black/70 backdrop-blur-sm border border-gray-600 rounded-lg p-2">
        <div className="flex gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-400 text-xs">Bids</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-red-400 text-xs">Asks</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-yellow-400 text-xs">High</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-20 left-6 z-20 bg-black/70 backdrop-blur-sm border border-gray-600 rounded-md p-2">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-green-500 rounded-sm"></div>
          <span className="text-green-400 text-xs">Bids</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-red-500 rounded-sm"></div>
          <span className="text-red-400 text-xs">Asks</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-yellow-500 rounded-sm"></div>
          <span className="text-yellow-400 text-xs">High Vol</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 bg-blue-500 rounded-sm"></div>
          <span className="text-blue-400 text-xs">Low Vol</span>
        </div>
      </div>
    </div>
  );
}

interface OrderBookVisualizationProps {
  orderBookData: OrderBookData[];
  pressureZones: PressureZone[];
  settings: VisualizationSettings;
}

function OrderBookVisualization({ orderBookData, pressureZones, settings }: OrderBookVisualizationProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [levelOfDetail, setLevelOfDetail] = useState(1);
  
  // Much slower auto-rotation for better user experience
  useFrame((state) => {
    if (groupRef.current && settings.rotationSpeed > 0) {
      groupRef.current.rotation.y += settings.rotationSpeed * 0.01; // More visible rotation speed
    }
    
    // Level of detail based on camera distance
    const distance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
    const newLOD = distance > 50 ? 0.5 : distance > 30 ? 0.75 : 1;
    if (Math.abs(newLOD - levelOfDetail) > 0.1) {
      setLevelOfDetail(newLOD);
    }
  });

  const { bars, maxPrice, minPrice, maxQuantity } = useMemo(() => {
    if (orderBookData.length === 0) {
      return { bars: [], maxPrice: 0, minPrice: 0, maxQuantity: 0 };
    }

    const allBars: any[] = [];
    let maxPrice = 0;
    let minPrice = Infinity;
    let maxQuantity = 0;

    orderBookData.forEach((data, timeIndex) => {
      const z = ((timeIndex - orderBookData.length / 2) / orderBookData.length) * 16; // Constrain Z within -8 to 8
      
      // Process bids
      data.bids.slice(0, 15).forEach((level, index) => {
        const priceNormalized = level.price;
        maxPrice = Math.max(maxPrice, priceNormalized);
        minPrice = Math.min(minPrice, priceNormalized);
        maxQuantity = Math.max(maxQuantity, level.quantity);
      });
      
      // Process asks
      data.asks.slice(0, 15).forEach((level, index) => {
        const priceNormalized = level.price;
        maxPrice = Math.max(maxPrice, priceNormalized);
        minPrice = Math.min(minPrice, priceNormalized);
        maxQuantity = Math.max(maxQuantity, level.quantity);
      });
    });

    const priceRange = maxPrice - minPrice;

    // Apply level of detail to reduce bars when camera is far
    const maxBarsPerSide = Math.floor(15 * levelOfDetail);
    
    orderBookData.forEach((data, timeIndex) => {
      const z = ((timeIndex - orderBookData.length / 2) / orderBookData.length) * 16; // Constrain Z within -8 to 8
      
      // Add bid bars with volume-based colors
      data.bids.slice(0, maxBarsPerSide).forEach((level, index) => {
        // Skip some bars based on LOD for performance
        if (levelOfDetail < 1 && index % Math.ceil(1 / levelOfDetail) !== 0) return;
        
        const x = ((level.price - minPrice) / priceRange) * 16 - 8; // Constrain X within -8 to 8
        const height = Math.min((level.quantity / maxQuantity) * 8, 10); // Constrain height within grid
        
        // Color based on volume level
        const volumeRatio = level.quantity / maxQuantity;
        let color = '#10b981'; // Default green for bids
        if (volumeRatio > 0.7) color = '#fbbf24'; // Yellow for high volume
        else if (volumeRatio < 0.3) color = '#3b82f6'; // Blue for low volume
        
        allBars.push({
          position: [x, height / 2, z] as [number, number, number],
          height,
          color,
          key: `bid-${timeIndex}-${index}`
        });
      });
      
      // Add ask bars with volume-based colors
      data.asks.slice(0, maxBarsPerSide).forEach((level, index) => {
        // Skip some bars based on LOD for performance
        if (levelOfDetail < 1 && index % Math.ceil(1 / levelOfDetail) !== 0) return;
        
        const x = ((level.price - minPrice) / priceRange) * 16 - 8; // Constrain X within -8 to 8
        const height = Math.min((level.quantity / maxQuantity) * 8, 10); // Constrain height within grid
        
        // Color based on volume level
        const volumeRatio = level.quantity / maxQuantity;
        let color = '#ef4444'; // Default red for asks
        if (volumeRatio > 0.7) color = '#fbbf24'; // Yellow for high volume
        else if (volumeRatio < 0.3) color = '#3b82f6'; // Blue for low volume
        
        allBars.push({
          position: [x, height / 2, z] as [number, number, number],
          height,
          color,
          key: `ask-${timeIndex}-${index}`
        });
      });
    });

    return { bars: allBars, maxPrice, minPrice, maxQuantity };
  }, [orderBookData, levelOfDetail]);

  return (
    <group ref={groupRef}>
      {/* Grid */}
      <Grid size={16} />
      
      {/* Orderbook bars */}
      {bars.map((bar) => (
        <OrderBookBar
          key={bar.key}
          position={bar.position}
          height={bar.height}
          color={bar.color}
        />
      ))}
      
      {/* Pressure zones */}
      {settings.showPressureZones && (
        <PressureZoneVisualizer
          zones={pressureZones}
          maxPrice={maxPrice}
          minPrice={minPrice}
        />
      )}
      
      {/* Critical Pressure Zone Counter - only show when pressure zones are enabled */}
      {settings.showPressureZones && pressureZones.length > 0 && (
        <group position={[8, 8, 0]}>
          <Text
            position={[0, 2, 0]}
            fontSize={1.5}
            color="#ff6b6b"
            anchorX="center"
            anchorY="middle"
          >
            ⚠️ {pressureZones.filter(z => z.intensity > 0.7).length}
          </Text>
          <Text
            position={[0, 0.5, 0]}
            fontSize={0.8}
            color="#ff9999"
            anchorX="center"
            anchorY="middle"
          >
            Critical Pressure Zones
          </Text>
        </group>
      )}
      
      {/* Axis labels */}
      <AxisLabels
        maxPrice={maxPrice}
        minPrice={minPrice}
        maxQuantity={maxQuantity}
      />
    </group>
  );
}

interface OrderBook3DProps {
  orderBookData: OrderBookData[];
  pressureZones: PressureZone[];
  settings: VisualizationSettings;
  className?: string;
}

export default function OrderBook3D({ 
  orderBookData, 
  pressureZones, 
  settings, 
  className = "" 
}: OrderBook3DProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const cameraPosition = isMobile ? [25, 15, 25] : [35, 25, 35];
  const fov = isMobile ? 70 : 60;

  return (
    <div className={`w-full h-full bg-gray-900 relative ${className}`}>
      {/* Legend */}
      <VisualizationLegend />
      
      <Canvas
        camera={{ position: cameraPosition as [number, number, number], fov }}
        style={{ background: 'radial-gradient(circle, #1f2937, #111827)' }}
        gl={{
          antialias: !isMobile,
          alpha: false,
          powerPreference: isMobile ? 'low-power' : 'high-performance',
          precision: isMobile ? 'mediump' : 'highp'
        }}
        frameloop="always"
        shadows={!isMobile}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[15, 15, 15]} intensity={0.8} />
        <pointLight position={[-15, -15, -15]} intensity={0.4} />
        <pointLight position={[0, 20, 0]} intensity={0.3} />
        
        <OrderBookVisualization
          orderBookData={orderBookData}
          pressureZones={pressureZones}
          settings={settings}
        />
        
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          enableDamping={true}
          dampingFactor={0.05}
          minDistance={isMobile ? 12 : 20}
          maxDistance={isMobile ? 80 : 120}
          maxPolarAngle={Math.PI * 0.8}
          minPolarAngle={Math.PI * 0.1}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
          }}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
          }}
          rotateSpeed={isMobile ? 0.8 : 1.0}
          zoomSpeed={isMobile ? 0.8 : 1.0}
          panSpeed={isMobile ? 0.8 : 1.0}
        />
      </Canvas>
    </div>
  );
}
