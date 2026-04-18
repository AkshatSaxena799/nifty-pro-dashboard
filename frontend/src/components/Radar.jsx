import { TrendingUp, TrendingDown, Zap, Target, BarChart2 } from 'lucide-react';
import { fmt } from '../utils/formatters';

const directionColors = {
  Bullish: 'border-neon-green/15 bg-neon-green/5',
  Bearish: 'border-neon-red/15 bg-neon-red/5',
  'Neutral (Both)': 'border-neon-cyan/15 bg-neon-cyan/5',
};

const tagColors = {
  'Elliott Wave': 'bg-purple-900/40 text-purple-300',
  'Low IV': 'bg-blue-900/40 text-blue-300',
  'Volatility Expansion': 'bg-yellow-900/40 text-sky-700 dark:text-amber-300',
  Straddle: 'bg-gray-100 dark:bg-wcag-surface2 text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-text',
  'Gamma Squeeze': 'bg-red-900/40 text-red-300',
  'Dealer Hedging': 'bg-orange-900/40 text-orange-300',
  'PCR Extreme': 'bg-pink-900/40 text-pink-300',
  Contrarian: 'bg-teal-900/40 text-teal-300',
  'Max Pain': 'bg-indigo-900/40 text-indigo-300',
  'OI Analysis': 'bg-cyan-900/40 text-cyan-300',
  Trend: 'bg-emerald-900/40 text-emerald-300',
};

export function TradeRadar({ setups }) {
  if (!setups || setups.length === 0) {
    return (
      <div className="glass-card card-accent-amber p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target size={14} className="text-amber-500 shrink-0" />
          <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-[0.1em]">Trade Setups</h2>
        </div>
        <p className="text-gray-500 dark:text-wcag-muted text-xs text-center py-6">
          Click <span className="text-sky-600 dark:text-neon-cyan font-medium">Refresh</span> to generate trade setups.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card card-accent-amber p-5 h-[500px] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Target size={14} className="text-amber-500 shrink-0" />
        <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-[0.1em]">Trade Setups</h2>
        <span className="ml-auto text-[10px] text-gray-400 dark:text-wcag-muted">Hold 1–3 months · Exit early OK</span>
      </div>
      <div className="space-y-3">
        {setups.map((setup) => (
          <div
            key={setup.id}
            className={`rounded-xl border p-4 transition-colors ${directionColors[setup.direction] || 'border-white/[0.06] bg-pink-50 dark:bg-wcag-surface1'}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold flex items-center gap-1.5 text-gray-900 dark:text-wcag-text">
                    {setup.direction?.includes('Bull') ? (
                      <span className="text-emerald-700 dark:text-neon-green text-xs">▲</span>
                    ) : setup.direction?.includes('Bear') ? (
                      <span className="text-rose-600 dark:text-neon-red text-xs">▼</span>
                    ) : (
                      <span className="text-blue-400 text-xs">●</span>
                    )}
                    {setup.type}
                  </span>
                  <span className="text-xs text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted">Strike: <span className="text-gray-800 dark:text-wcag-text font-mono font-medium">₹{setup.strike}</span></span>
                  <span className="text-xs text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted">Expiry: <span className="text-gray-800 dark:text-wcag-text font-mono">{setup.expiry}</span></span>
                </div>
                <div className="text-[10px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted mt-1">Lot Size: {setup.lotSize} | Expected Move: {setup.expectedMove}</div>
              </div>
              {/* Probability badge */}
              <div className="shrink-0 text-center">
                <div className="text-xl font-bold font-mono text-gray-900 dark:text-wcag-text flex items-center justify-center gap-1">
                  <span className={setup.probability >= 60 ? 'text-emerald-700 dark:text-neon-green' : 'text-sky-700 dark:text-amber-400'}>{setup.probability >= 60 ? '▲' : '●'}</span>
                  {setup.probability}%
                </div>
                <div className="text-[10px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted">Prob.</div>
              </div>
            </div>

            {/* Tags */}
            {setup.tags && (
              <div className="flex flex-wrap gap-1 mb-2">
                {setup.tags.map((tag) => (
                  <span key={tag} className={`text-[10px] rounded-md px-1.5 py-0.5 ${tagColors[tag] || 'bg-gray-100 dark:bg-wcag-surface2 text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted'}`}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Reasoning */}
            <p className="text-xs text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted mb-2">{setup.reasoning}</p>

            {/* Greeks */}
            {setup.greeks && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-indigo-950/25 rounded-xl p-2.5 text-center">
                {[['Δ Delta', setup.greeks.delta, 'text-black-300'],
                  ['Γ Gamma', setup.greeks.gamma, 'text-black-300'],
                  ['Θ Theta/day', setup.greeks.theta, 'text-black-300'],
                  ['ν Vega', setup.greeks.vega, 'text-black-300'],
                ].map(([label, val, cls]) => (
                  <div key={label}>
                    <div className={`text-xs font-mono font-semibold ${cls}`}>{val}</div>
                    <div className="text-[10px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted">{label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Break-even for straddles */}
            {setup.breakEven && (
              <div className="mt-2 text-[10px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted flex gap-4">
                <span>Breakeven UP: <span className="text-gray-900 dark:text-wcag-text font-medium"><span className="text-emerald-700 dark:text-neon-green mr-1">▲</span>₹{setup.breakEven.up}</span></span>
                <span>Breakeven DN: <span className="text-gray-900 dark:text-wcag-text font-medium"><span className="text-rose-600 dark:text-neon-red mr-1">▼</span>₹{setup.breakEven.down}</span></span>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted mt-4">
        Educational only. Not SEBI investment advice. Always manage risk with defined stop-losses.
      </p>
    </div>
  );
}
