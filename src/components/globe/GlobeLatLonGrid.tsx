import { Line } from "@react-three/drei";
import * as THREE from "three";

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

export default function GlobeLatLonGrid() {
  const r = GLOBE_RADIUS + 0.003;
  const lines: THREE.Vector3[][] = [];

  for (let lat = -60; lat <= 60; lat += 30) {
    const pts: THREE.Vector3[] = [];
    for (let lon = -180; lon <= 180; lon += 5) {
      const [x, y, z] = latLonToXYZ(lat, lon, r);
      pts.push(new THREE.Vector3(x, y, z));
    }
    lines.push(pts);
  }

  for (let lon = -180; lon < 180; lon += 30) {
    const pts: THREE.Vector3[] = [];
    for (let lat = -90; lat <= 90; lat += 5) {
      const [x, y, z] = latLonToXYZ(lat, lon, r);
      pts.push(new THREE.Vector3(x, y, z));
    }
    lines.push(pts);
  }

  return (
    <>
      {lines.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          color="hsl(200, 30%, 22%)"
          lineWidth={0.4}
          transparent
          opacity={0.2}
        />
      ))}
    </>
  );
}
