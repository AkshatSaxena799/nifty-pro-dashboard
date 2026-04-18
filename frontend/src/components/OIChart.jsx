// Premium OI Chart component
import { useMemo } from 'react';
import { InfoTooltip } from '../utils/tooltips.jsx';

const fmtOI = (v) => {
  if (v == null) return '—';
  if (v >= 1e7) return `${(v / 1e7).toFixed(2)}Cr`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return String(v);
};

export function OIChart({ chain, spot, maxPain, callWall, putWall, totalCEOI, totalPEOI, netOIChange, chainSource }) {
  const rows = useMemo(() => {
    if (!chain || chain.length === 0 || !spot) return [];
    const lo = Math.floor((spot - 3000) / 50) * 50, hi = Math.ceil((spot + 3000) / 50) * 50;
    const grouped = {};
    for (const r of chain) {
      if (r.strike < lo || r.strike > hi) continue;
      const k = r.strike;
      if (!grouped[k]) grouped[k] = { ceOI: 0, peOI: 0, ceChg: 0, peChg: 0 };
      grouped[k].ceOI += r.CE_OI || 0;
      grouped[k].peOI += r.PE_OI || 0;
      grouped[k].ceChg += r.CE_chgOI || 0;
      grouped[k].peChg += r.PE_chgOI || 0;
    }
    return Object.entries(grouped)
      .map(([k, v]) => ({ strike: Number(k), ...v }))
      .sort((a, b) => b.strike - a.strike);
  }, [chain, spot]);

  const maxOI = useMemo(
    () => Math.max(...rows.map((r) => Math.max(r.ceOI, r.peOI)), 1),
    [rows]
  );

  const totalCE = totalCEOI ?? rows.reduce((s, r) => s + r.ceOI, 0);
  const totalPE = totalPEOI ?? rows.reduce((s, r) => s + r.peOI, 0);
  const pcr = totalCE > 0 ? (totalPE / totalCE).toFixed(2) : '—';
  const pcrNum = parseFloat(pcr);

  if (!chain || chain.length === 0) {
    return (
      <div className="glass-card p-5">
        <h2 className="text-xs font-semibold text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted uppercase tracking-wider">Option Chain OI</h2>
        <p className="text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted text-xs text-center py-8">Refresh to load options chain data.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xs font-semibold text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted flex items-center gap-2 uppercase tracking-wider">
          Option Chain OI — ATM ±3000
          <InfoTooltip metric="OI Analysis" />
        </h2>
        <span className="text-[10px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted font-mono">NIFTY @ ₹{spot?.toLocaleString('en-IN')}</span>
      </div>
      {chainSource && (
        <div className={`text-[10px] mb-3 px-2.5 py-1.5 rounded-lg font-mono ${chainSource === 'NSE Live' ? 'text-emerald-700 dark:text-neon-green/80 bg-neon-green/5 border border-neon-green/10' : 'text-amber-700 bg-amber-950/15 border border-amber-900/15'}`}>
          {chainSource === 'NSE Live' ? '● ' : '○ '}Data: {chainSource}
          {chainSource.includes('Synthetic') && ' — Generated from Black-Scholes model'}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
        <div className="bg-neon-red/5 border border-neon-red/10 rounded-xl p-2.5 text-center">
          <div className="text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted text-[10px] mb-0.5 flex items-center justify-center gap-1">CE OI <InfoTooltip metric="Total CE OI" /></div>
          <div className="text-gray-900 dark:text-wcag-text font-bold text-sm font-mono flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-neon-red inline-block" /> {fmtOI(totalCE)}</div>
        </div>
        <div className="bg-neon-green/5 border border-neon-green/10 rounded-xl p-2.5 text-center">
          <div className="text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted text-[10px] mb-0.5 flex items-center justify-center gap-1">PE OI <InfoTooltip metric="Total PE OI" /></div>
          <div className="text-gray-900 dark:text-wcag-text font-bold text-sm font-mono flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-neon-green inline-block" /> {fmtOI(totalPE)}</div>
        </div>
        <div className="bg-gray-100 dark:bg-wcag-surface2 border border-white/[0.06] rounded-xl p-2.5 text-center">
          <div className="text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted text-[10px] mb-0.5 flex items-center justify-center gap-1">PCR <InfoTooltip metric="PCR" /></div>
          <div className="font-bold text-sm font-mono text-gray-900 dark:text-wcag-text flex items-center justify-center gap-1">
            <span className={pcrNum > 1.2 ? 'text-emerald-700 dark:text-neon-green' : pcrNum < 0.8 ? 'text-rose-600 dark:text-neon-red' : 'text-amber-700 dark:text-amber-400'}>
              {pcrNum > 1.2 ? '▲' : pcrNum < 0.8 ? '▼' : '●'}
            </span>
            {pcr}
          </div>
        </div>
        {callWall && (
          <div className="bg-neon-red/5 border border-neon-red/10 rounded-xl p-2.5 text-center">
            <div className="text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted text-[10px] mb-0.5 flex items-center justify-center gap-1">Call Wall <InfoTooltip metric="Call Wall" /></div>
            <div className="text-gray-900 dark:text-wcag-text font-bold font-mono">₹{callWall.strike?.toLocaleString('en-IN')}</div>
            <div className="text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted text-[9px] font-mono">{fmtOI(callWall.oi)}</div>
          </div>
        )}
        {putWall && (
          <div className="bg-neon-green/5 border border-neon-green/10 rounded-xl p-2.5 text-center">
            <div className="text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted text-[10px] mb-0.5 flex items-center justify-center gap-1">Put Wall <InfoTooltip metric="Put Wall" /></div>
            <div className="text-gray-900 dark:text-wcag-text font-bold font-mono">₹{putWall.strike?.toLocaleString('en-IN')}</div>
            <div className="text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted text-[9px] font-mono">{fmtOI(putWall.oi)}</div>
          </div>
        )}
        {maxPain != null && (
          <div className="bg-orange-300/5 border border-orange-300/10 rounded-xl p-2.5 text-center">
            <div className="text-gray-900 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted text-[10px] mb-0.5 flex items-center justify-center gap-1">Max Pain <InfoTooltip metric="Upstox F&O Sync" /></div>
            <div className="text-orange-300 font-bold font-mono">₹{maxPain?.toLocaleString('en-IN')}</div>
          </div>
        )}
        {netOIChange != null && (
          <div className="bg-gray-100 dark:bg-wcag-surface2 border border-white/[0.06] rounded-xl p-2.5 text-center">
            <div className="text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted text-[10px] mb-0.5 flex items-center justify-center gap-1">Net OI Chg <InfoTooltip metric="Net OI Change" /></div>
            <div className="font-bold text-sm font-mono text-gray-900 dark:text-wcag-text flex items-center justify-center gap-1">
              <span className={netOIChange >= 0 ? 'text-emerald-700 dark:text-neon-green' : 'text-rose-600 dark:text-neon-red'}>{netOIChange >= 0 ? '▲' : '▼'}</span>
              {fmtOI(Math.abs(netOIChange))}
            </div>
          </div>
        )}
      </div>

      {/* Column headers */}
      <div className="flex items-center text-[10px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted mb-1.5 px-1 select-none">
        <div className="flex-1 text-right pr-2 text-emerald-700 dark:text-neon-green/60">← PE OI</div>
        <div className="w-20 text-center text-gray-700 dark:text-wcag-muted shrink-0">STRIKE</div>
        <div className="flex-1 text-left pl-2 text-rose-600 dark:text-neon-red/60">CE OI →</div>
      </div>

      {/* Bars */}
      <div className="space-y-px max-h-[280px] sm:max-h-[360px] overflow-y-auto pr-0.5 scrollbar-thin">
        {rows.map((row) => {
          const isATM = Math.abs(row.strike - spot) <= 75;
          const isCW = callWall && row.strike === callWall.strike;
          const isPW = putWall && row.strike === putWall.strike;
          const isMP = row.strike === maxPain;

          const peRatio = row.peOI / maxOI;
          const ceRatio = row.ceOI / maxOI;
          const peAlpha = (0.25 + 0.75 * peRatio).toFixed(2);
          const ceAlpha = (0.25 + 0.75 * ceRatio).toFixed(2);

          return (
            <div
              key={row.strike}
              className={`flex items-center rounded-sm transition-colors ${isATM ? 'bg-cyan-900/10 ring-1 ring-cyan-800/20' : 'hover:bg-white/[0.015]'}`}
            >
              <div className="flex-1 flex items-center justify-end gap-1 pr-1 min-w-0">
                <span className="text-[9px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted shrink-0 hidden sm:inline font-mono">{fmtOI(row.peOI)}</span>
                <div className="flex items-center justify-end" style={{ width: '72px' }}>
                  <div
                    className="h-3 rounded-sm shrink-0 transition-all"
                    style={{
                      width: `${Math.max(peRatio * 100, 1).toFixed(1)}%`,
                      maxWidth: '72px',
                      background: `rgba(95,216,143,${peAlpha})`,
                    }}
                  />
                </div>
              </div>

              <div className={`w-20 text-center shrink-0 text-[10px] font-mono leading-tight py-0.5 ${
                isATM ? 'text-sky-800 dark:text-neon-cyan font-bold' :
                isCW ? 'text-rose-600 dark:text-neon-red font-semibold' :
                isPW ? 'text-emerald-700 dark:text-neon-green font-semibold' :
                isMP ? 'text-purple-400 font-semibold' :
                'text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted'
              }`}>
                {row.strike}
                <div className="text-[8px] leading-none">
                  {isATM && <span className="text-sky-800 dark:text-neon-cyan/60">ATM</span>}
                  {isCW && <span className="text-rose-600 dark:text-neon-red/60">CW</span>}
                  {isPW && <span className="text-emerald-700 dark:text-neon-green/60">PW</span>}
                  {isMP && !isCW && !isPW && <span className="text-purple-600">MP</span>}
                </div>
              </div>

              <div className="flex-1 flex items-center gap-1 pl-1 min-w-0">
                <div style={{ width: '72px' }}>
                  <div
                    className="h-3 rounded-sm transition-all"
                    style={{
                      width: `${Math.max(ceRatio * 100, 1).toFixed(1)}%`,
                      maxWidth: '72px',
                      background: `rgba(255,90,118,${ceAlpha})`,
                    }}
                  />
                </div>
                <span className="text-[9px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted shrink-0 hidden sm:inline font-mono">{fmtOI(row.ceOI)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 text-[9px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted">
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-neon-green/50 inline-block" /> PE</span>
        <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-neon-red/50 inline-block" /> CE</span>
        <span className="text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted">ATM · CW=Call Wall · PW=Put Wall · MP=Max Pain</span>
      </div>
    </div>
  );
}
