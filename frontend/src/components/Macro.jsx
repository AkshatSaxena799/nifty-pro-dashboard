// Premium Macro Prices component
import { TrendingUp, TrendingDown, Globe } from 'lucide-react';
import { colorClass } from '../utils/formatters';
import { InfoTooltip } from '../utils/tooltips.jsx';

export function MacroPrices({ macroPrices }) {
  if (!macroPrices || macroPrices.length === 0) {
    return (
      <div className="glass-card p-5">
        <h2 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
          <Globe size={13} className="text-neon-cyan" /> Global Macro
        </h2>
        <p className="text-gray-600 text-xs text-center py-4">Refresh to load macro data.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <h2 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
        <Globe size={13} className="text-neon-cyan" /> Global Macro
      </h2>
      <div className="divide-y divide-white/[0.04]">
        {macroPrices.map((item) => {
          if (!item) return null;
          const up = (item.changePct ?? 0) >= 0;
          const Icon = up ? TrendingUp : TrendingDown;
          const label = item.label || item.ticker;
          const isFx = label.includes('INR') || label.includes('USD') || label.includes('EUR');
          return (
            <div key={label} className="py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-0.5 min-w-0 mr-2">
                  <span className="truncate">{label}</span>
                  <InfoTooltip metric={label} />
                </span>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-xs font-semibold text-gray-200 font-mono">
                    {item.price != null ? (isFx ? item.price.toFixed(4) : item.price.toFixed(2)) : '—'}
                  </span>
                  <span className={`flex items-center gap-0.5 text-xs font-medium font-mono ${colorClass(item.changePct)}`}>
                    <Icon size={10} />
                    {item.changePct != null ? `${item.changePct > 0 ? '+' : ''}${item.changePct.toFixed(2)}%` : '—'}
                  </span>
                </div>
              </div>
              {item.timestamp && (
                <div className="text-[9px] text-gray-700 mt-0.5 text-right font-mono">
                  {item.timestamp}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

