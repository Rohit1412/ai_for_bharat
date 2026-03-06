import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import ClimateMetrics from "@/components/ClimateMetrics";
import ClimateChat from "@/components/ClimateChat";
import RealTimeWeather, { DEFAULT_COUNTRIES } from "@/components/RealTimeWeather";
import type { WeatherEntry } from "@/components/RealTimeWeather";
import CountryManager from "@/components/CountryManager";
import AIAnalystPanel from "@/components/AIAnalystPanel";
import GlobalDataPanel from "@/components/GlobalDataPanel";
import ScenarioModeling from "@/components/ScenarioModeling";
import StrategyGenerator from "@/components/StrategyGenerator";
import TrendCharts from "@/components/TrendCharts";
import ExportPanel from "@/components/ExportPanel";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import UserBadge from "@/components/UserBadge";

const InsightsPage = () => {
  const [countries, setCountries] = useState<string[]>(DEFAULT_COUNTRIES);
  const [weatherData, setWeatherData] = useState<WeatherEntry[]>([]);

  const handleAdd = (country: string) => {
    if (!countries.includes(country)) {
      setCountries((prev) => [...prev, country]);
    }
  };

  const handleRemove = (country: string) => {
    setCountries((prev) => prev.filter((c) => c !== country));
  };

  const handleWeatherLoaded = useCallback((data: WeatherEntry[]) => {
    setWeatherData(data);
  }, []);

  return (
    <div className="min-h-screen bg-background grid-bg">
      <header className="border-b border-border/50 backdrop-blur-xl bg-background/70 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded hover:bg-muted/30 transition-colors">
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Link>
            <h1 className="font-display text-base font-bold tracking-widest text-foreground">AI INSIGHTS & METRICS</h1>
          </div>
          <UserBadge />
        </div>
      </header>
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto p-6 space-y-10"
      >
        {/* Req 1: Global Data Integration */}
        <section>
          <GlobalDataPanel weatherData={weatherData} />
        </section>

        <section>
          <h2 className="font-display text-sm tracking-widest text-primary mb-4">GLOBAL CLIMATE METRICS</h2>
          <ClimateMetrics />
        </section>

        <section>
          <TrendCharts />
        </section>

        <section>
          <h2 className="font-display text-sm tracking-widest text-accent mb-4">REAL-TIME COUNTRY WEATHER</h2>
          <CountryManager countries={countries} onAdd={handleAdd} onRemove={handleRemove} />
          <div className="mt-4">
            <RealTimeWeather countries={countries} onDataLoaded={handleWeatherLoaded} />
          </div>
        </section>

        <section>
          <AIAnalystPanel weatherData={weatherData} />
        </section>

        {/* Req 2: Climate Scenario Modeling */}
        <section>
          <ScenarioModeling />
        </section>

        {/* Req 3: Optimal Strategy Generation */}
        <section>
          <StrategyGenerator />
        </section>

        <section>
          <ExportPanel />
        </section>
      </motion.main>
      <ClimateChat />
    </div>
  );
};

export default InsightsPage;
