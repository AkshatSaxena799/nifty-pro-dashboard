// Premium Macro Prices component
import { Globe } from 'lucide-react';
import { InfoTooltip } from '../utils/tooltips.jsx';

export function MacroPrices({ macroPrices }) {
  if (!macroPrices || macroPrices.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-1">
          <Globe size={14} className="text-sky-500 dark:text-neon-cyan shrink-0" />
          <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-[0.1em]">Global Macro</h2>
        </div>
        <p className="text-gray-500 dark:text-wcag-muted text-xs text-center py-4">Refresh to load macro data.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Globe size={14} className="text-sky-500 dark:text-neon-cyan shrink-0" />
        <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-[0.1em]">Global Macro</h2>
      </div>
      <div>
        {macroPrices.map((item) => {
          if (!item) return null;
          const up = (item.changePct ?? 0) >= 0;
          const label = item.label || item.ticker;
          const isFx = label?.includes('INR') || label?.includes('USD') || label?.includes('EUR');
          return (
            <div key={label} className="metric-row flex items-center justify-between py-2.5 border-b border-black/[0.04] dark:border-white/[0.04] last:border-0">
              <span className="text-[11px] text-gray-500 dark:text-wcag-muted flex items-center gap-0.5 min-w-0 mr-2 font-medium">
                <span className="truncate">{label}</span>
                <InfoTooltip metric={label} />
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] font-bold text-gray-900 dark:text-white font-data">
                  {item.price != null ? (isFx ? item.price.toFixed(4) : item.price.toFixed(2)) : '—'}
                </span>
                <span className={`text-[10px] font-bold font-data px-2 py-0.5 rounded-full ${
                  up
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-neon-green/10 dark:text-neon-green border border-emerald-200/50 dark:border-neon-green/20'
                    : 'bg-rose-50 text-rose-600 dark:bg-neon-red/10 dark:text-neon-red border border-rose-200/50 dark:border-neon-red/20'
                }`}>
                  {up ? '+' : ''}{item.changePct != null ? `${item.changePct.toFixed(2)}%` : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
