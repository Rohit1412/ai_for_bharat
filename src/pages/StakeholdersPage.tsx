import { motion } from "framer-motion";
import StakeholderNetwork from "@/components/StakeholderNetwork";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const StakeholdersPage = () => (
  <div className="min-h-screen bg-background grid-bg">
    <header className="border-b border-border/50 backdrop-blur-xl bg-background/70 sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 rounded hover:bg-muted/30 transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <h1 className="font-display text-sm font-bold tracking-widest text-foreground">STAKEHOLDER NETWORK</h1>
        </div>
      </div>
    </header>
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto p-6"
    >
      <StakeholderNetwork />
    </motion.main>
  </div>
);

export default StakeholdersPage;
