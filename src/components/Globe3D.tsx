import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Html } from "@react-three/drei";
import { useRef, useState, useMemo } from "react";
import * as THREE from "three";
import GlobeCountryLines from "./globe/GlobeCountryLines";
import GlobeLatLonGrid from "./globe/GlobeLatLonGrid";

interface EmissionMarker {
  country: string;
  name: string;
  lat: number;
  lon: number;
  emissions: number;
  rank: number;
}

const GLOBE_RADIUS = 2;

function latLonToXYZ(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return [
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

const countryCoords: Record<string, [number, number]> = {
  CHN: [35, 105], USA: [39, -98], IND: [22, 78], RUS: [60, 100], JPN: [36, 138],
  IDN: [-5, 120], BRA: [-10, -55], DEU: [51, 10], IRN: [32, 53], KOR: [36, 128],
  SAU: [24, 45], CAN: [56, -106], MEX: [23, -102], ZAF: [29, 24], GBR: [54, -2],
  AUS: [-25, 134], TUR: [39, 35], FRA: [47, 2], ITA: [42, 12], POL: [52, 20],
  THA: [15, 101], ARE: [24, 54], MYS: [4, 109], EGY: [26, 30], VNM: [16, 108],
  PAK: [30, 70], ARG: [-34, -64], NGA: [10, 8], KAZ: [48, 68], UKR: [49, 32],
  COL: [4, -72], PHL: [12, 122], BGD: [24, 90], VEN: [8, -66], CHL: [-30, -71],
  IRQ: [33, 44], DZA: [28, 3], PER: [-10, -76], QAT: [25.3, 51.2], KWT: [29.5, 47.8],
  LBY: [27, 17], OMN: [21, 57], TKM: [39, 60], UZB: [41, 65], MMR: [22, 96],
  ETH: [9, 38], TZA: [6, 35], KEN: [-1, 38], AGO: [-12, 18], MOZ: [-18, 35],
};

function EmissionSpike({ marker, maxEmissions, showLabel }: { marker: EmissionMarker; maxEmissions: number; showLabel: boolean }) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  const pos = latLonToXYZ(marker.lat, marker.lon, GLOBE_RADIUS);
  const normalizedHeight = Math.max(0.15, (marker.emissions / maxEmissions) * 2.5);

  const direction = new THREE.Vector3(...pos).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction
  );

  const intensity = Math.min(1, marker.emissions / maxEmissions);
  const color = new THREE.Color().setHSL(0.55 - intensity * 0.55, 0.9, 0.45 + intensity * 0.2);

  return (
    <group position={pos} quaternion={quaternion}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.015, 0.04, normalizedHeight, 8]} />
        <meshStandardMaterial
          color={hovered ? "#ffffff" : color}
          emissive={color}
          emissiveIntensity={hovered ? 2 : 1.2}
          transparent
          opacity={0.95}
        />
      </mesh>
      {showLabel && !hovered && (
        <Html distanceFactor={10} position={[0, normalizedHeight + 0.06, 0]} center>
          <span className="text-[9px] font-medium text-emerald-300 whitespace-nowrap pointer-events-none select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {marker.name.length > 10 ? marker.country : marker.name}
          </span>
        </Html>
      )}
      {hovered && (
        <Html distanceFactor={15} position={[0, normalizedHeight + 0.04, 0]} center style={{ pointerEvents: "none" }}>
          <div className="bg-background/90 backdrop-blur border border-border rounded px-1.5 py-0.5 whitespace-nowrap shadow">
            <p className="text-[8px] font-semibold text-foreground leading-none">{marker.name}</p>
            <p className="text-[7px] text-muted-foreground leading-none mt-px">
              #{marker.rank} · {(marker.emissions / 1e9).toFixed(1)}B t
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

function RotatingGlobe({ markers }: { markers: EmissionMarker[] }) {
  const groupRef = useRef<THREE.Group>(null);
  const maxEmissions = useMemo(
    () => Math.max(...markers.map((m) => m.emissions), 1),
    [markers]
  );

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <Sphere args={[GLOBE_RADIUS, 64, 64]}>
        <meshStandardMaterial color="hsl(210, 40%, 10%)" roughness={0.7} metalness={0.15} />
      </Sphere>
      <GlobeLatLonGrid />
      <GlobeCountryLines />
      <Sphere args={[GLOBE_RADIUS + 0.12, 32, 32]}>
        <meshBasicMaterial color="hsl(200, 80%, 50%)" transparent opacity={0.06} side={THREE.BackSide} />
      </Sphere>
      {markers.map((marker) => (
        <EmissionSpike
          key={marker.country}
          marker={marker}
          maxEmissions={maxEmissions}
          showLabel={marker.rank <= 15}
        />
      ))}
    </group>
  );
}

interface Globe3DProps {
  rankings: CountryRanking[];
  isLoading: boolean;
}

interface CountryRanking {
  country: string;
  name: string;
  rank: number;
  emissionsQuantity: number;
  percentage: number;
}

export default function Globe3D({ rankings, isLoading }: Globe3DProps) {
  const markers = useMemo(() => {
    if (!rankings?.length) return [];
    return rankings
      .filter((r: any) => countryCoords[r.country])
      .slice(0, 50)
      .map((r: any) => ({
        country: r.country,
        name: r.name || r.country,
        lat: countryCoords[r.country][0],
        lon: countryCoords[r.country][1],
        emissions: r.emissionsQuantity,
        rank: r.rank,
      }));
  }, [rankings]);

  if (isLoading) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">Loading 3D Globe...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden relative">
      <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }} style={{ background: "transparent" }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 3, 5]} intensity={1.5} />
        <pointLight position={[-5, -3, -5]} intensity={0.5} color="hsl(200, 80%, 60%)" />
        <RotatingGlobe markers={markers} />
        <OrbitControls enableZoom enablePan={false} minDistance={3.5} maxDistance={10} autoRotate={false} />
      </Canvas>
    </div>
  );
}
