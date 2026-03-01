import React, { useEffect, useRef } from 'react';

interface MapboxMapProps {
  onLayerToggle?: (layer: string) => void;
}

export function MapboxMap({ onLayerToggle }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [layers, setLayers] = React.useState({
    ghg: true,
    water: false,
    solar: false,
    projects: false,
  });

  useEffect(() => {
    // Since this is MVP, we'll use a static map placeholder with CSS
    // In production, uncomment the mapbox-gl implementation below
    return () => {
      if (map.current) map.current.remove();
    };
  }, []);

  const toggleLayer = (layer: keyof typeof layers) => {
    const newState = { ...layers, [layer]: !layers[layer] };
    setLayers(newState);
    onLayerToggle?.(layer);
  };

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden border border-[#22c55e]/30">
      {/* Map Container */}
      <div
        ref={mapContainer}
        className="w-full h-full bg-gradient-to-br from-[#1e2937] to-[#0f172a]"
      >
        {/* MVP: Static SVG Map Representation */}
        <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
          {/* Background */}
          <rect width="800" height="400" fill="#1a2540" />
          
          {/* Karnataka Rural Districts Representation */}
          <defs>
            <linearGradient id="ghgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#dc2626" stopOpacity={layers.ghg ? 0.7 : 0} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={layers.ghg ? 0.5 : 0} />
            </linearGradient>
            <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={layers.water ? 0.6 : 0} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={layers.water ? 0.4 : 0} />
            </linearGradient>
            <linearGradient id="solarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#eab308" stopOpacity={layers.solar ? 0.6 : 0} />
              <stop offset="100%" stopColor="#facc15" stopOpacity={layers.solar ? 0.4 : 0} />
            </linearGradient>
          </defs>

          {/* Raichur District */}
          <circle cx="200" cy="150" r="80" fill="url(#ghgGradient)" />
          <text x="200" y="145" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">
            Raichur
          </text>
          <text x="200" y="165" textAnchor="middle" fill="#cbd5e1" fontSize="11">
            12.7M tCO₂e
          </text>

          {/* Chikkaballapur District */}
          <circle cx="550" cy="200" r="70" fill="url(#waterGradient)" />
          <text x="550" y="195" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold">
            Chikkaballapur
          </text>
          <text x="550" y="215" textAnchor="middle" fill="#cbd5e1" fontSize="11">
            Water Stress: 72
          </text>

          {/* Legend */}
          <g>
            <text x="20" y="35" fill="#94a3b8" fontSize="12" fontWeight="bold">
              Active Layers:
            </text>
            {layers.ghg && (
              <g>
                <circle cx="30" cy="55" r="4" fill="#dc2626" />
                <text x="45" y="59" fill="#cbd5e1" fontSize="11">
                  GHG Emissions
                </text>
              </g>
            )}
            {layers.water && (
              <g>
                <circle cx="30" cy="75" r="4" fill="#3b82f6" />
                <text x="45" y="79" fill="#cbd5e1" fontSize="11">
                  Water Stress
                </text>
              </g>
            )}
            {layers.solar && (
              <g>
                <circle cx="30" cy="95" r="4" fill="#eab308" />
                <text x="45" y="99" fill="#cbd5e1" fontSize="11">
                  Solar Potential
                </text>
              </g>
            )}
            {layers.projects && (
              <g>
                <circle cx="30" cy="115" r="4" fill="#22c55e" />
                <text x="45" y="119" fill="#cbd5e1" fontSize="11">
                  Active Projects
                </text>
              </g>
            )}
          </g>

          {/* Project Markers (Green Pins) */}
          {layers.projects && (
            <>
              <circle cx="180" cy="120" r="5" fill="#22c55e" />
              <circle cx="220" cy="180" r="5" fill="#22c55e" />
              <circle cx="530" cy="170" r="5" fill="#22c55e" />
              <circle cx="570" cy="230" r="5" fill="#22c55e" />
            </>
          )}
        </svg>
      </div>

      {/* Layer Controls */}
      <div className="absolute top-4 right-4 bg-[#0f172a]/90 backdrop-blur-sm border border-[#22c55e]/30 rounded-lg p-3 space-y-2">
        {[
          { key: 'ghg', label: 'GHG Emissions' },
          { key: 'water', label: 'Water Stress' },
          { key: 'solar', label: 'Solar Potential' },
          { key: 'projects', label: 'Active Projects' },
        ].map((layer) => (
          <label
            key={layer.key}
            className="flex items-center space-x-2 cursor-pointer hover:text-[#22c55e] transition-colors"
          >
            <input
              type="checkbox"
              checked={layers[layer.key as keyof typeof layers]}
              onChange={() => toggleLayer(layer.key as keyof typeof layers)}
              className="w-4 h-4 rounded cursor-pointer"
            />
            <span className="text-sm text-[#cbd5e1]">{layer.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
