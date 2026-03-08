import { Suspense } from "react";
import { motion } from "framer-motion";
import { Satellite, Brain, Leaf, Network, Cpu, Shield, Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import UserBadge from "@/components/UserBadge";
import ClimateGlobe from "@/components/ClimateGlobe";

const GlobeLoader = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="text-center">
      <Cpu className="w-8 h-8 text-primary mx-auto mb-2 animate-spin" />
      <p className="text-xs font-display tracking-widest text-muted-foreground">INITIALIZING GLOBE</p>
    </div>
  </div>
);

const navItems = [
  { icon: Brain, label: "AI Insights", to: "/insights", description: "Real-time AI analysis & climate metrics" },
  { icon: Leaf, label: "Actions", to: "/actions", description: "Intervention plans & scenario modeling" },
  { icon: Network, label: "Stakeholders", to: "/stakeholders", description: "Global coordination network" },
  { icon: Sprout, label: "Farmers", to: "/farmers", description: "India-specific AI farming assistant" },
];

const Index = () => {
  return (
    <div className="h-screen bg-background overflow-hidden relative">
      {/* Scan line */}
      <div className="fixed inset-0 pointer-events-none scan-line z-50" />

      {/* Header - minimal */}
      <header className="absolute top-0 left-0 right-0 z-40 backdrop-blur-md bg-background/40 border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Satellite className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xs font-bold tracking-[0.2em] text-foreground glow-text-primary">
                CLIMATE COORDINATOR
              </h1>
              <p className="text-[9px] font-mono text-muted-foreground">GLOBAL AI SYSTEM v3.2.1</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-[9px] font-mono text-muted-foreground">
              <Shield className="w-3 h-3 text-primary" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>LIVE</span>
            </div>
            <UserBadge />
          </div>
        </div>
      </header>

      {/* Globe - full screen */}
      <div className="absolute inset-0">
        <Suspense fallback={<GlobeLoader />}>
          <ClimateGlobe />
        </Suspense>
      </div>

      {/* Bottom center hint */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-[10px] font-display tracking-[0.3em] text-muted-foreground/60"
        >
          CLICK HOTSPOTS FOR DATA · DRAG TO ROTATE · SCROLL TO ZOOM
        </motion.p>
      </div>

      {/* Navigation buttons - bottom bar */}
      <nav className="absolute bottom-0 left-0 right-0 z-40">
        <div className="flex justify-center gap-3 px-4 py-4">
          {navItems.map((item, i) => (
            <motion.div
              key={item.to}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <Link
                to={item.to}
                className="group glass-panel px-5 py-3 flex items-center gap-3 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              >
                <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <div>
                  <div className="text-xs font-display tracking-wider text-foreground group-hover:text-primary transition-colors">
                    {item.label.toUpperCase()}
                  </div>
                  <div className="text-[9px] text-muted-foreground hidden sm:block">{item.description}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </nav>

      {/* Risk legend - top right, small */}
      <div className="absolute bottom-24 left-4 z-30 glass-panel p-2.5 text-[10px] space-y-1 opacity-60 hover:opacity-100 transition-opacity">
        <div className="font-display tracking-wider text-muted-foreground mb-1">RISK</div>
        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-glow-danger" /><span className="text-foreground/60">Critical</span></div>
        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-glow-warning" /><span className="text-foreground/60">High</span></div>
        <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary" /><span className="text-foreground/60">Medium</span></div>
      </div>
    </div>
  );
};

export default Index;
