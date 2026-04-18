// Premium Support & Resistance component
import { ShieldAlert, Zap } from 'lucide-react';
import { fmt, colorClass } from '../utils/formatters';
import { InfoTooltip } from '../utils/tooltips.jsx';

export function SupportResistance({ support, resistance, pivots, gex, spot }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <ShieldAlert size={14} className="text-amber-500 shrink-0" />
        <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-[0.1em]">Support &amp; Resistance</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="text-[10px] text-emerald-700 dark:text-neon-green mb-2 font-medium flex items-center gap-1 uppercase tracking-wider">Support <InfoTooltip metric="Support Zones" /></div>
          <div className="space-y-1">
            {(support || []).map((s, i) => (
              <div key={i} className="flex justify-between text-xs bg-neon-green/5 border border-neon-green/10 rounded-lg px-2.5 py-1.5">
                <span className="text-gray-500 dark:text-wcag-muted font-data">S{i + 1}</span>
                <span className="text-gray-900 dark:text-white font-semibold font-data"><span className="text-emerald-700 dark:text-neon-green mr-1">▲</span>{fmt.inr(s)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-rose-600 dark:text-neon-red mb-2 font-medium flex items-center gap-1 uppercase tracking-wider">Resistance <InfoTooltip metric="Resistance Zones" /></div>
          <div className="space-y-1">
            {(resistance || []).map((r, i) => (
              <div key={i} className="flex justify-between text-xs bg-neon-red/5 border border-neon-red/10 rounded-lg px-2.5 py-1.5">
                <span className="text-gray-500 dark:text-wcag-muted font-data">R{i + 1}</span>
                <span className="text-gray-900 dark:text-white font-semibold font-data"><span className="text-rose-600 dark:text-neon-red mr-1">▼</span>{fmt.inr(r)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pivot Points */}
      {pivots && (
        <div className="mb-4">
          <div className="text-[10px] text-gray-500 dark:text-wcag-muted mb-2 flex items-center gap-1 uppercase tracking-wider font-semibold">
            Pivots <InfoTooltip metric="Classical Pivot Points" />
          </div>
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            {[
              ['R3', pivots.r3, 'text-rose-500 dark:text-neon-red/60'], ['R2', pivots.r2, 'text-rose-500 dark:text-neon-red/80'], ['R1', pivots.r1, 'text-rose-600 dark:text-neon-red'],
              ['P', pivots.pivot, 'text-sky-700 dark:text-neon-cyan'],
              ['S1', pivots.s1, 'text-emerald-600 dark:text-neon-green'], ['S2', pivots.s2, 'text-emerald-600 dark:text-neon-green/80'], ['S3', pivots.s3, 'text-emerald-600 dark:text-neon-green/60'],
            ].map(([label, val, cls]) => (
              <div key={label} className="bg-black/10 dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.04] rounded-lg px-1.5 py-1.5 text-center">
                <div className="text-gray-400 dark:text-wcag-muted mb-0.5">{label}</div>
                <div className={`font-semibold font-data ${cls}`}>
                  {val ? Math.round(val) : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GEX */}
      {gex && (
        <div className="bg-black/[0.06] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.04] rounded-xl p-3">
          <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-wcag-muted mb-2 uppercase tracking-wider font-semibold">
            <Zap size={10} className="text-amber-500" /> GEX
            <InfoTooltip metric="Gamma Exposure" />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-wcag-muted">Net GEX</span>
              <span className="font-data font-semibold text-gray-900 dark:text-white flex items-center gap-1">
                <span className={colorClass(gex.netGEX)}>{gex.netGEX > 0 ? '▲' : gex.netGEX < 0 ? '▼' : '●'}</span>
                {gex.netGEX != null ? `${(Math.abs(gex.netGEX) / 1e9).toFixed(3)}B` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-wcag-muted">Gamma Flip</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold font-data">{gex.gammaFlip ? fmt.inr(gex.gammaFlip) : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-wcag-muted">Squeeze</span>
              <span className={gex.isGammaSqueeze ? 'text-rose-600 dark:text-neon-red font-bold animate-pulse' : 'text-gray-400 dark:text-wcag-muted'}>
                {gex.isGammaSqueeze ? '⚡ ACTIVE' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
