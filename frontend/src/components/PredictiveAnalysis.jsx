import React from 'react';
import { Target, TrendingUp, TrendingDown, AlignCenter, Zap, ExternalLink, BrainCircuit } from 'lucide-react';
import { fmt } from '../utils/formatters';
import { InfoTooltip } from '../utils/tooltips.jsx';

export function PredictiveAnalysis({ predictions, spot }) {
  if (!predictions) return null;

  // Graceful fallback if backend hasn't restarted yet
  if (predictions.nextSessionOpen && !predictions.scenarios) {
     return (
       <div className="glass-card p-6 text-sm text-center text-gray-500 dark:text-wcag-muted border border-purple-500/20">
         <div className="animate-pulse flex items-center justify-center gap-2">
            <BrainCircuit size={16} className="text-purple-500" />
            <span className="font-semibold text-gray-800 dark:text-wcag-text">ML Engine Database Updated.</span> 
         </div>
         <p className="text-[10px] mt-2">Please restart your backend terminal to initialize the new Multi-Scenario Generative Array.</p>
       </div>
     );
  }

  const { marketRegime, proxyGiftNifty, scenarios } = predictions;

  return (
    <div className="glass-card p-4 sm:p-6 border border-gray-200 dark:border-wcag-border rounded-2xl shadow-sm mb-6 relative overflow-hidden">
      {/* Background flare */}
      <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none mix-blend-screen">
        <Zap size={100} className="text-purple-500 blur-2xl" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5 relative z-10 border-b border-black/5 dark:border-white/5 pb-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="p-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-md shadow-md">
            <BrainCircuit size={16} className="text-white" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-gray-900 dark:text-wcag-text uppercase tracking-widest flex items-center gap-1">
              Global ML Predictive Engine <InfoTooltip metric="Global AI Prediction Engine" />
            </h2>
            <div className="text-[10px] text-gray-500 dark:text-wcag-muted mt-0.5 max-w-sm">
              Multi-Scenario Probability Engine fusing Geopolitics (GIFT Proxy) with Options Gravity.
            </div>
          </div>
        </div>
        <div className="text-right bg-blue-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg border border-blue-100 dark:border-purple-500/20 shadow-inner">
          <div className="text-[9px] uppercase font-bold text-blue-700 dark:text-purple-400 tracking-wider">Active Market Regime</div>
          <div className="text-xs font-mono font-bold text-gray-900 dark:text-wcag-text mt-0.5">{marketRegime}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 relative z-10">
        {scenarios.map((scenario, idx) => {
          const isUp = scenario.type.toLowerCase().includes('up') || scenario.type.toLowerCase().includes('rally');
          const isDown = scenario.type.toLowerCase().includes('down') || scenario.type.toLowerCase().includes('selloff') || scenario.type.toLowerCase().includes('fade');
          const colorClass = isUp ? 'text-emerald-700 dark:text-neon-green' : isDown ? 'text-rose-600 dark:text-neon-red' : 'text-blue-700 dark:text-blue-400';
          
          return (
            <div key={idx} className={`bg-gradient-to-br ${scenario.isPrimary ? 'from-purple-50/50 to-indigo-50/50 dark:from-purple-900/10 dark:to-indigo-900/10 border-purple-200 dark:border-purple-500/30 ring-1 ring-purple-500/20 shadow-md' : 'from-black/5 to-black/10 dark:from-white/5 dark:to-white/10 border-white/5 shadow-inner'} rounded-xl p-4 sm:p-5 border flex flex-col`}>
              <div className="text-[10px] uppercase font-bold text-gray-600 dark:text-wcag-muted mb-4 flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
                <span className="flex items-center gap-1.5 text-gray-800 dark:text-wcag-text">
                  {scenario.title} 
                  {scenario.isPrimary && <span className="bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 px-1.5 py-0.5 rounded text-[8px] animate-pulse">Primary</span>}
                </span>
                <InfoTooltip metric={`Predicted ${scenario.isPrimary ? 'Primary' : 'Alternative'} Scenario`} />
              </div>

              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className={`text-xl font-mono font-bold flex items-center gap-1.5 ${colorClass}`}>
                    {isUp ? <TrendingUp size={20} /> : isDown ? <TrendingDown size={20} /> : <AlignCenter size={20} />}
                    {scenario.type}
                  </div>
                  <div className="text-xs text-gray-800 dark:text-wcag-text font-semibold flex items-center gap-1 mt-1.5">
                    Target Projection: <span className="font-mono text-sm tracking-tight">
                      {Array.isArray(scenario.target) ? `${fmt.inr(scenario.target[0])} - ${fmt.inr(scenario.target[1])}` : fmt.inr(scenario.target)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-mono font-black text-gray-900 dark:text-wcag-text leading-none">{scenario.probability}%</div>
                  <div className="text-[9px] text-gray-500 dark:text-wcag-muted uppercase mt-1 font-semibold tracking-wider">Probability</div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/10 text-[11px] leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {scenario.reasoning}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
