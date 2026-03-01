import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { CheckCircle2, BarChart3, Languages } from 'lucide-react';
import karnatakaMock from '../data/karnataka-mock.json';

interface ActionPlanProps {
  onNavigate?: (page: string) => void;
}

export function ActionPlan({ onNavigate }: ActionPlanProps) {
  const [selectedInterventions, setSelectedInterventions] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [language, setLanguage] = useState<'english' | 'kannada'>('english');

  const handleInterventionToggle = (intId: string) => {
    setSelectedInterventions((prev) =>
      prev.includes(intId) ? prev.filter((id) => id !== intId) : [...prev, intId]
    );
  };

  const handleGeneratePortfolio = () => {
    if (selectedInterventions.length === 0) {
      alert('Please select at least one intervention');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowResults(true);
    }, 2000);
  };

  // Sample trade-off radar data
  const tradeoffData = [
    { metric: 'Climate Impact', value: 85 },
    { metric: 'Cost Efficiency', value: 72 },
    { metric: 'Equity Score', value: 88 },
    { metric: 'Feasibility', value: 76 },
    { metric: 'Timeline', value: 68 },
  ];

  // Sample portfolio impact
  const portfolioImpact = [
    { intervention: 'Solar Pumps', carbon: 250, cost: 75, equity: 85 },
    { intervention: 'DSR Paddy', carbon: 380, cost: 20, equity: 90 },
    { intervention: 'Biogas', carbon: 180, cost: 72.5, equity: 75 },
    { intervention: 'Digesters', carbon: 120, cost: 95, equity: 70 },
  ];

  // Cumulative impact
  const cumulativeData = [
    { month: 'Month 1', emissionReduction: 50 },
    { month: 'Month 3', emissionReduction: 280 },
    { month: 'Month 6', emissionReduction: 650 },
    { month: 'Month 12', emissionReduction: 930 },
  ];

  const explanations = {
    english: `Based on your selection of interventions, this optimized portfolio delivers:
    
    1. Maximum Climate Impact: By combining Direct Seeded Rice (28% methane reduction), Solar Agri-Pumps (18% water savings), and Residue-to-Biogas (13% carbon reduction), you achieve synergistic benefits exceeding individual interventions.
    
    2. Cost-Effective Implementation: Prioritizing DSR first (lowest cost, highest equity) followed by Solar Pumps ensures financial sustainability and farmer acceptance. Total investment: 3-4 lakhs over 12 months.
    
    3. Equity First Approach: All recommended interventions score 70+ on equity (farmer acceptance, income generation). Reforestation adds co-benefits (shade, fodder, erosion control).
    
    4. Feasibility Timeline: DSR adoption in 3 months, Solar Pumps in 2 months, Biogas in 4 months. Staggered implementation reduces farmer shock and enables learning.
    
    Bedrock AI Trade-Off Analysis: The radar chart shows optimal balance across all objectives. No single intervention dominates; portfolio approach ensures resilience.`,
    kannada: `ನಿಮ್ಮ ಆಯ್ಕೆ ಮಾಡಿದ ಮಧ್ಯಸ್ಥಾನಗಳ ಆಧಾರದ ಮೇಲೆ, ಈ ಅಪ್ಟಿಮೈಜ್ಡ ಪೋರ್ಟ್ಫೋಲಿಯೊ ಒದಗಿಸುತ್ತದೆ:
    
    1. ಗರಿಷ್ಠ ಜಲವಾಯು ಪ್ರಭಾವ: ನೇರ ಬಿತ್ತನೆ ಧಾನ್ಯ (28% ಮೆಥೇನ್ ಕಡಿತ), ಸೌರ ಕೃಷಿ-ಪಂಪುಗಳು (18% ನೀರಿನ ಉಳಿತಾಯ), ಮತ್ತು ಗೊಡನೆಯಿಂದ-ಬಯೋಗ್ಯಾಸ್ ಸಂಯೋಜಿಸುವ ಮೂಲಕ, ನೀವು ಸಿನರ್ಜಿಸ್ಟಿಕ್ ಪ್ರಯೋಜನಗಳನ್ನು ಸಾಧಿಸುತ್ತೀರಿ.
    
    2. ವೆಚ್ಚ-ಪರಿಣಾಮಕಾರಿ ಅನುಷ್ಠಾನ: ಧರ್ಮಾಂತರಿತ ನೇರ ಬಿತ್ತನೆಯನ್ನು ಮಾಡುವ ಮೂಲಕ ಆರಂಭಿಸುವುದು (ಮೂಲತೋ ವೆಚ್ಚ, ಬಲೆಯ ಈಕ್ವಿಟಿ) ಅನುಸರಿಸುವ ಮೂಲಕ ಸೌರ ಪಂಪುಗಳು ಆರ್ಥಿಕ ಸ್ಥಿರತೆ ಮತ್ತು ರೈತ ಸ್ವೀಕಾರವನ್ನು ನಿಶ್ಚಿತ ಮಾಡುತ್ತದೆ.
    
    3. ಇಕ್ವಿಟಿ ಆರಂಭ ವಿಧಾನ: ಎಲ್ಲಾ ಶಿಫಾರಿಶ ಮಾಡಿದ ಮಧ್ಯಸ್ಥಾನಗಳು 70+ ಈಕ್ವಿಟಿ ಸ್ಕೋರ್ ಕ಴ಿಸುತ್ತವೆ.
    
    4. ವ್ಯವಹಾರ್ಯತೆ ಸಮಯ ರೇಖೆ: ಮೊದಲ 3 ತಿಂಗಳಿಗಳಲ್ಲಿ ನೇರ ಬಿತ್ತನೆ ಧರ್ಮಾಂತರಣ, 2 ತಿಂಗಳುಗಳಲ್ಲಿ ಸೌರ ಪಂಪುಗಳು.`,
  };

  return (
    <div className="w-full min-h-screen bg-[#0f172a] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Action Plan Generator
          </h1>
          <p className="text-lg text-[#cbd5e1] max-w-3xl">
            Select 5+ interventions, and Viriva AI will generate an optimized portfolio ranked by carbon impact, cost, equity score, and feasibility. Trade-off analysis and explainable reasoning in English and Kannada.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left: Intervention Selection */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-[#1e2937] to-[#162d42] border border-[#22c55e]/30 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <CheckCircle2 className="text-[#22c55e]" size={24} />
                <span>Select Interventions</span>
              </h2>
              <p className="text-[#94a3b8] text-sm mb-4">
                Choose up to 5 interventions for your district.
              </p>

              <div className="space-y-3 mb-6">
                {karnatakaMock.intervention_library.map((intervention) => (
                  <label
                    key={intervention.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-[#1e2937] cursor-pointer transition-all bg-[#0f172a]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedInterventions.includes(intervention.id)}
                      onChange={() => handleInterventionToggle(intervention.id)}
                      className="w-5 h-5 rounded cursor-pointer accent-[#22c55e] mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">{intervention.name}</p>
                      <p className="text-[#94a3b8] text-xs">{intervention.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="bg-[#0f172a] rounded-lg p-3 mb-4">
                <p className="text-[#cbd5e1] text-sm">
                  Selected: <span className="font-bold text-[#22c55e]">{selectedInterventions.length}/5</span>
                </p>
              </div>

              <button
                onClick={handleGeneratePortfolio}
                disabled={selectedInterventions.length === 0 || isGenerating}
                className="w-full bg-gradient-to-r from-[#22c55e] to-[#86efac] text-[#0f172a] font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-[#22c55e]/50 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <BarChart3 size={20} />
                    <span>Generate Portfolio</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Results */}
          {showResults && (
            <div className="lg:col-span-2 space-y-6 smooth-fade-in">
              {/* Trade-Off Radar */}
              <div className="bg-gradient-to-br from-[#1e2937] to-[#162d42] border border-[#22c55e]/30 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Multi-Objective Trade-Off Analysis</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={tradeoffData}>
                    <PolarGrid stroke="#22c55e" strokeOpacity={0.3} />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Portfolio Impact Bar Chart */}
              <div className="bg-gradient-to-br from-[#1e2937] to-[#162d42] border border-[#22c55e]/30 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Carbon Reduction by Intervention</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={portfolioImpact}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#22c55e" strokeOpacity={0.2} />
                    <XAxis dataKey="intervention" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e2937',
                        border: '1px solid #22c55e',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="carbon" fill="#22c55e" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Cumulative Impact Line Chart */}
              <div className="bg-gradient-to-br from-[#1e2937] to-[#162d42] border border-[#22c55e]/30 rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Cumulative Emission Reduction Timeline</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={cumulativeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#22c55e" strokeOpacity={0.2} />
                    <XAxis dataKey="month" tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#cbd5e1', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e2937',
                        border: '1px solid #22c55e',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="emissionReduction"
                      stroke="#22c55e"
                      strokeWidth={3}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Explanation */}
              <div className="bg-gradient-to-br from-[#22c55e]/20 to-[#86efac]/10 border border-[#22c55e]/30 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Languages className="text-[#22c55e]" size={24} />
                  <h3 className="text-lg font-bold text-white">Viriva AI Explanation</h3>
                  <div className="flex space-x-2 ml-auto">
                    {['english', 'kannada'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setLanguage(lang as any)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          language === lang
                            ? 'bg-[#22c55e] text-[#0f172a]'
                            : 'bg-[#1e2937] text-[#cbd5e1] hover:bg-[#0f172a]'
                        }`}
                      >
                        {lang === 'english' ? 'English' : 'Kannada'}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[#cbd5e1] text-sm leading-relaxed whitespace-pre-wrap">
                  {explanations[language]}
                </p>
              </div>

              {/* Export & Download */}
              <div className="flex space-x-4">
                <button className="flex-1 bg-gradient-to-r from-[#22c55e] to-[#86efac] text-[#0f172a] font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-[#22c55e]/50 transition-all">
                  Export as PDF
                </button>
                <button className="flex-1 bg-gradient-to-r from-[#0ea5e9] to-[#06b6d4] text-white font-bold py-3 rounded-lg hover:shadow-lg hover:shadow-[#0ea5e9]/50 transition-all">
                  Share Plan
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bedrock Info */}
        {!showResults && (
          <div className="bg-gradient-to-r from-[#1e2937]/50 to-[#162d42]/50 border border-[#22c55e]/20 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">
              Powered by Amazon Bedrock Claude 3.5 Sonnet
            </h3>
            <p className="text-[#cbd5e1] text-lg max-w-2xl mx-auto mx-auto">
              In production, Bedrock provides scenario simulation, trade-off reasoning, and multi-language explanations. Select interventions above to see AI recommendations and impact projections.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
