import { useState, useCallback } from "react";
import India from "@svg-maps/india";

interface IndiaMapProps {
  selectedState: string | null;
  onStateSelect: (stateName: string) => void;
  featuredState?: string;
}

const STATE_NAMES: Record<string, string> = {
  an: "Andaman & Nicobar Islands",
  ap: "Andhra Pradesh",
  ar: "Arunachal Pradesh",
  as: "Assam",
  br: "Bihar",
  ch: "Chandigarh",
  ct: "Chhattisgarh",
  dn: "Dadra & Nagar Haveli",
  dd: "Daman & Diu",
  dl: "Delhi",
  ga: "Goa",
  gj: "Gujarat",
  hr: "Haryana",
  hp: "Himachal Pradesh",
  jk: "Jammu & Kashmir",
  jh: "Jharkhand",
  ka: "Karnataka",
  kl: "Kerala",
  ld: "Lakshadweep",
  mp: "Madhya Pradesh",
  mh: "Maharashtra",
  mn: "Manipur",
  ml: "Meghalaya",
  mz: "Mizoram",
  nl: "Nagaland",
  or: "Odisha",
  py: "Puducherry",
  pb: "Punjab",
  rj: "Rajasthan",
  sk: "Sikkim",
  tn: "Tamil Nadu",
  tg: "Telangana",
  tr: "Tripura",
  up: "Uttar Pradesh",
  ut: "Uttarakhand",
  wb: "West Bengal",
};

const FEATURED_ID = "ka";

const IndiaMap = ({ selectedState, onStateSelect }: IndiaMapProps) => {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const handleClick = useCallback(
    (event: React.MouseEvent<SVGPathElement>) => {
      const target = event.target as SVGPathElement;
      const id = target.getAttribute("id") || "";
      const name = STATE_NAMES[id] || target.getAttribute("name") || id;
      onStateSelect(name);
    },
    [onStateSelect]
  );

  const handleMouseOver = useCallback(
    (event: React.MouseEvent<SVGPathElement>) => {
      const target = event.target as SVGPathElement;
      setHoveredState(target.getAttribute("id") || null);
    },
    []
  );

  const handleMouseOut = useCallback(() => {
    setHoveredState(null);
  }, []);

  const hoveredName = hoveredState
    ? STATE_NAMES[hoveredState] || hoveredState
    : null;

  return (
    <div className="relative w-full h-full flex flex-col items-center">
      {/* Hover tooltip */}
      {hoveredName && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-background/95 border border-primary/50 rounded-lg px-4 py-2 shadow-lg shadow-primary/10 pointer-events-none">
          <span className="text-sm font-display tracking-wider text-primary font-semibold">
            {hoveredName}
          </span>
        </div>
      )}

      {/* SVG Map */}
      <div className="india-map-wrapper w-full h-full flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={India.viewBox}
          aria-label={India.label}
          className="india-svg-map"
        >
          {India.locations.map(
            (location: { id: string; name: string; path: string }) => {
              const displayName = STATE_NAMES[location.id] || location.name;
              const isSelected = selectedState === displayName;
              const isFeatured = location.id === FEATURED_ID;
              const isHovered = hoveredState === location.id;

              let cls = "india-map__location";
              if (isSelected) cls += " india-map__location--selected";
              else if (isFeatured) cls += " india-map__location--featured";
              if (isHovered) cls += " india-map__location--hovered";

              return (
                <path
                  key={location.id}
                  id={location.id}
                  name={location.name}
                  d={location.path}
                  className={cls}
                  onClick={handleClick}
                  onMouseOver={handleMouseOver}
                  onMouseOut={handleMouseOut}
                />
              );
            }
          )}
        </svg>
      </div>
    </div>
  );
};

export default IndiaMap;
