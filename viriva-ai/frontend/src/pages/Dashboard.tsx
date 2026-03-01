import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { MapboxMap } from '../components/MapboxMap';
import { KPICard } from '../components/KPICard';
import { AlertCard } from '../components/AlertCard';
import { ActionCard } from '../components/ActionCard';
import karnatakaMock from '../data/karnataka-mock.json';

interface DashboardProps {
  onNavigate?: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [alerts, setAlerts] = useState(karnatakaMock.alerts);

  const handleAlertAction = (alertId: string) => {
    console.log(`Action triggered for alert: ${alertId}`);
    onNavigate?.('action-plan');
  };

  return (
    <div className="w-full min-h-screen bg-[#0f172a] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex items-baseline space-x-4 mb-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Karnataka Rural Climate Dashboard
            </h1>
            <span className="text-sm text-[#94a3b8] bg-[#22c55e]/10 px-3 py-1 rounded-full border border-[#22c55e]/30">
              Real-time Monitoring
            </span>
          </div>
          <p className="text-lg text-[#cbd5e1] max-w-2xl">
            Track emissions, water stress, and climate interventions across Raichur and Chikkaballapur districts. AI-powered recommendations for sustainable rural development.
          </p>
        </div>

        {/* Interactive Map */}
        <div className="mb-12 smooth-fade-in">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center space-x-2">
            <span>Interactive Regional Map</span>
            <span className="text-sm bg-[#22c55e]/20 border border-[#22c55e]/50 text-[#22c55e] px-3 py-1 rounded-lg font-semibold">
              Toggle Layers
            </span>
          </h2>
          <MapboxMap />
        </div>

        {/* KPI Cards */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title={karnatakaMock.kpis.emissions_trend.unit}
              value={karnatakaMock.kpis.emissions_trend.current.toString()}
              unit={karnatakaMock.kpis.emissions_trend.unit}
              changePercent={karnatakaMock.kpis.emissions_trend.change_percent}
              status="good"
              targetValue={karnatakaMock.kpis.emissions_trend.target.toString()}
            />
            <KPICard
              title="Carbon Budget Remaining"
              value={karnatakaMock.kpis.carbon_budget.current.toString()}
              unit={karnatakaMock.kpis.carbon_budget.unit}
              changePercent={karnatakaMock.kpis.carbon_budget.remaining_percent}
              status="warning"
              targetValue={karnatakaMock.kpis.carbon_budget.total.toString()}
            />
            <KPICard
              title="Projected Temp Rise 2030"
              value={karnatakaMock.kpis.temp_rise_2030.projection.toString()}
              unit={karnatakaMock.kpis.temp_rise_2030.unit}
              changePercent={karnatakaMock.kpis.temp_rise_2030.change_percent}
              status="critical"
              targetValue={karnatakaMock.kpis.temp_rise_2030.target.toString()}
            />
            <KPICard
              title="Water Risk Score"
              value={karnatakaMock.kpis.water_risk_score.current.toString()}
              unit="Score"
              changePercent={karnatakaMock.kpis.water_risk_score.change_percent}
              status="critical"
            />
          </div>
        </div>

        {/* Alerts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Live Alerts */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
              <span>Live Alerts</span>
              <span className="w-3 h-3 bg-[#ef4444] rounded-full pulse-animation"></span>
            </h2>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  region={alert.region}
                  type={alert.type as any}
                  severity={alert.severity as any}
                  message={alert.message}
                  current={alert.current}
                  threshold={alert.threshold}
                  unit={alert.unit}
                  recommendedAction={alert.recommended_action}
                  onTakeAction={() => handleAlertAction(alert.id)}
                />
              ))}
            </div>
          </div>

          {/* Summary Stats Sidebar */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-[#1e2937] to-[#162d42] border border-[#22c55e]/20 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">District Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#94a3b8] text-sm">Total Paddy Area</span>
                  <span className="text-[#22c55e] font-semibold text-sm">450K hectares</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8] text-sm">Annual Methane</span>
                  <span className="text-[#ef4444] font-semibold text-sm">20.1M tCO₂e</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8] text-sm">Active Projects</span>
                  <span className="text-[#22c55e] font-semibold text-sm">20</span>
                </div>
                <div className="border-t border-[#22c55e]/20 pt-3 mt-3 flex justify-between">
                  <span className="text-[#94a3b8] text-sm">Projected Impact</span>
                  <span className="text-[#0ea5e9] font-semibold text-sm">-2.8M tCO₂e</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#22c55e]/20 to-[#86efac]/5 border border-[#22c55e]/30 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Next Steps</h3>
              <button
                onClick={() => onNavigate?.('action-plan')}
                className="w-full bg-gradient-to-r from-[#22c55e] to-[#86efac] text-[#0f172a] font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-[#22c55e]/50 transition-all flex items-center justify-center space-x-2 group"
              >
                <span>Generate Action Plan</span>
                <ChevronRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </button>
              <p className="text-[#94a3b8] text-xs mt-3 text-center">
                Select interventions and get personalized recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Recommended Actions Carousel */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Recommended Next Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {karnatakaMock.recommended_actions.map((action) => (
              <ActionCard
                key={action.id}
                title={action.title}
                description={action.description}
                impact={action.impact_tco2e}
                costRange={action.cost_range}
                timeline={action.timeline_months}
                equityScore={action.equity_score}
                priority={action.priority}
                onClick={() => {
                  console.log(`Action selected: ${action.id}`);
                  onNavigate?.('action-plan');
                }}
              />
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-[#22c55e]/20 to-[#86efac]/10 border border-[#22c55e]/30 rounded-lg p-12 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Ready to Accelerate Climate Action?</h3>
          <p className="text-[#cbd5e1] text-lg mb-8 max-w-2xl mx-auto">
            Use our Action Plan Generator to create a customized portfolio of interventions optimized for carbon reduction, cost, equity, and feasibility.
          </p>
          <button
            onClick={() => onNavigate?.('action-plan')}
            className="bg-gradient-to-r from-[#22c55e] to-[#86efac] text-[#0f172a] font-bold px-8 py-4 rounded-lg text-lg hover:shadow-xl hover:shadow-[#22c55e]/50 transition-all"
          >
            Start Planning Now
          </button>
        </div>
      </div>
    </div>
  );
}
