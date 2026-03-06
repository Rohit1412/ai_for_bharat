import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, X, MapPin } from "lucide-react";

const ALL_COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bangladesh","Belarus","Belgium","Bolivia","Brazil","Bulgaria","Cambodia","Cameroon","Canada",
  "Chile","China","Colombia","Costa Rica","Croatia","Cuba","Czech Republic","Denmark",
  "Dominican Republic","Ecuador","Egypt","El Salvador","Estonia","Ethiopia","Finland","France",
  "Georgia","Germany","Ghana","Greece","Guatemala","Haiti","Honduras","Hungary","Iceland",
  "India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan",
  "Kazakhstan","Kenya","Kuwait","Laos","Latvia","Lebanon","Libya","Lithuania","Luxembourg",
  "Madagascar","Malaysia","Mali","Mexico","Moldova","Mongolia","Morocco","Mozambique","Myanmar",
  "Nepal","Netherlands","New Zealand","Nicaragua","Nigeria","North Korea","Norway","Oman",
  "Pakistan","Panama","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania",
  "Russia","Saudi Arabia","Senegal","Serbia","Singapore","Slovakia","Slovenia","Somalia",
  "South Africa","South Korea","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Syria",
  "Taiwan","Tanzania","Thailand","Tunisia","Turkey","Uganda","Ukraine","United Arab Emirates",
  "United Kingdom","United States","Uruguay","Uzbekistan","Venezuela","Vietnam","Yemen","Zimbabwe",
];

interface CountryManagerProps {
  countries: string[];
  onAdd: (country: string) => void;
  onRemove: (country: string) => void;
}

export default function CountryManager({ countries, onAdd, onRemove }: CountryManagerProps) {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim()
    ? ALL_COUNTRIES.filter(
        (c) =>
          c.toLowerCase().includes(query.toLowerCase()) &&
          !countries.includes(c)
      ).slice(0, 8)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAdd = (country: string) => {
    onAdd(country);
    setQuery("");
    setShowDropdown(false);
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div ref={containerRef} className="relative">
        <div className="flex items-center gap-2 glass-panel px-3 py-2">
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => query.trim() && setShowDropdown(true)}
            placeholder="Search countries to add..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <AnimatePresence>
          {showDropdown && filtered.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 right-0 mt-1 z-50 glass-panel border border-border/50 overflow-hidden max-h-48 overflow-y-auto"
            >
              {filtered.map((c) => (
                <button
                  key={c}
                  onClick={() => handleAdd(c)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-primary/10 transition-colors text-left"
                >
                  <Plus className="w-3 h-3 text-primary" />
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  {c}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active country tags */}
      <div className="flex flex-wrap gap-1.5">
        {countries.map((c) => (
          <motion.span
            key={c}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/50 border border-border/50 text-xs text-foreground"
          >
            <MapPin className="w-2.5 h-2.5 text-primary" />
            {c}
            <button
              onClick={() => onRemove(c)}
              className="p-0.5 rounded hover:bg-destructive/20 transition-colors"
              aria-label={`Remove ${c}`}
            >
              <X className="w-2.5 h-2.5 text-muted-foreground hover:text-destructive" />
            </button>
          </motion.span>
        ))}
      </div>
    </div>
  );
}
