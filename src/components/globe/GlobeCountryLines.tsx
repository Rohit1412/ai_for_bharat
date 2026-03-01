import { useState, useEffect, useMemo } from "react";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import * as topojson from "topojson-client";

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

export default function GlobeCountryLines() {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch("/countries-110m.json")
      .then((r) => r.json())
      .then((topo) => {
        const countries = topojson.feature(topo, topo.objects.countries) as any;
        setGeoData(countries);
      })
      .catch(console.error);
  }, []);

  const lines = useMemo(() => {
    if (!geoData) return [];
    const r = GLOBE_RADIUS + 0.005;
    const result: THREE.Vector3[][] = [];

    for (const feature of geoData.features) {
      const geom = feature.geometry;
      const polygons =
        geom.type === "Polygon"
          ? [geom.coordinates]
          : geom.type === "MultiPolygon"
          ? geom.coordinates
          : [];

      for (const polygon of polygons) {
        for (const ring of polygon) {
          // Downsample large rings for performance
          const step = ring.length > 200 ? 3 : ring.length > 80 ? 2 : 1;
          const pts: THREE.Vector3[] = [];
          for (let i = 0; i < ring.length; i += step) {
            const [lon, lat] = ring[i];
            const [x, y, z] = latLonToXYZ(lat, lon, r);
            pts.push(new THREE.Vector3(x, y, z));
          }
          // Close the ring
          if (pts.length > 2) {
            pts.push(pts[0].clone());
            result.push(pts);
          }
        }
      }
    }
    return result;
  }, [geoData]);

  if (!lines.length) return null;

  return (
    <>
      {lines.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          color="hsl(160, 50%, 40%)"
          lineWidth={1}
          transparent
          opacity={0.6}
        />
      ))}
    </>
  );
}
