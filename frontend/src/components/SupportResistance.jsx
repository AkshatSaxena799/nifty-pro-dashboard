// Premium Support & Resistance component
import { ShieldAlert, Zap } from 'lucide-react';
import { fmt, colorClass } from '../utils/formatters';
import { InfoTooltip } from '../utils/tooltips.jsx';

export function SupportResistance({ support, resistance, pivots, gex, spot }) {
  return (
    <div className="glass-card p-5">
      <h2 className="text-xs font-semibold text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
        <ShieldAlert size={13} className="text-orange-400" /> Support & Resistance
      </h2>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="text-[10px] text-neon-green mb-2 font-medium flex items-center gap-1 uppercase tracking-wider">Support <InfoTooltip metric="Support Zones" /></div>
          <div className="space-y-1">
            {(support || []).map((s, i) => (
              <div key={i} className="flex justify-between text-xs bg-neon-green/5 border border-neon-green/10 rounded-lg px-2.5 py-1.5">
                <span className="text-gray-600 font-mono">S{i + 1}</span>
                <span className="text-neon-green font-semibold font-mono">{fmt.inr(s)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-neon-red mb-2 font-medium flex items-center gap-1 uppercase tracking-wider">Resistance <InfoTooltip metric="Resistance Zones" /></div>
          <div className="space-y-1">
            {(resistance || []).map((r, i) => (
              <div key={i} className="flex justify-between text-xs bg-neon-red/5 border border-neon-red/10 rounded-lg px-2.5 py-1.5">
                <span className="text-gray-600 font-mono">R{i + 1}</span>
                <span className="text-neon-red font-semibold font-mono">{fmt.inr(r)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pivot Points */}
      {pivots && (
        <div className="mb-4">
          <div className="text-[10px] text-gray-500 mb-2 flex items-center gap-1 uppercase tracking-wider">
            Pivots <InfoTooltip metric="Classical Pivot Points" />
          </div>
          <div className="grid grid-cols-3 gap-1 text-[10px]">
            {[
              ['R3', pivots.r3, 'text-neon-red/60'], ['R2', pivots.r2, 'text-neon-red/80'], ['R1', pivots.r1, 'text-neon-red'],
              ['P', pivots.pivot, 'text-neon-cyan'],
              ['S1', pivots.s1, 'text-neon-green'], ['S2', pivots.s2, 'text-neon-green/80'], ['S3', pivots.s3, 'text-neon-green/60'],
            ].map(([label, val, cls]) => (
              <div key={label} className="bg-black/20 rounded-lg px-1.5 py-1.5 text-center">
                <div className="text-gray-700">{label}</div>
                <div className={`font-semibold font-mono ${cls}`}>{val ? Math.round(val) : '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GEX */}
      {gex && (
        <div className="bg-black/20 rounded-xl p-3">
          <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-2 uppercase tracking-wider">
            <Zap size={10} className="text-yellow-400" /> GEX
            <InfoTooltip metric="Gamma Exposure" />
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Net GEX</span>
              <span className={`font-mono font-semibold ${colorClass(gex.netGEX)}`}>
                {gex.netGEX != null ? `${(gex.netGEX / 1e9).toFixed(3)}B` : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Gamma Flip</span>
              <span className="text-yellow-400 font-semibold font-mono">{gex.gammaFlip ? fmt.inr(gex.gammaFlip) : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Squeeze</span>
              <span className={gex.isGammaSqueeze ? 'text-neon-red font-bold animate-pulse' : 'text-gray-600'}>
                {gex.isGammaSqueeze ? '⚡ ACTIVE' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
