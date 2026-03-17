// FIX #3: Stabilized sentiment with factor breakdown + neon colors
import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { fmt, colorClass, biasColor } from '../utils/formatters';
import { InfoTooltip } from '../utils/tooltips.jsx';

function SentimentGauge({ score }) {
  const clamped = Math.max(-60, Math.min(60, score || 0));
  const pct = ((clamped + 60) / 120) * 100;
  return (
    <div className="relative w-full h-2.5 bg-gradient-to-r from-neon-red/30 via-gray-800 to-neon-green/30 rounded-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-neon-red/10 via-transparent to-neon-green/10 rounded-full" />
      <div
        className="absolute top-0 bottom-0 w-2.5 bg-white rounded-full shadow-lg shadow-white/30 transition-all duration-700"
        style={{ left: `calc(${pct}% - 5px)` }}
      />
    </div>
  );
}

// FIX #3: Compute sentiment factor breakdown so users see what drives the score
function useBreakdown(data) {
  return useMemo(() => {
    if (!data) return [];
    const pcr = data.pcr ?? 1;
    const vix = data.vix ?? 18;
    const ivPct = data.ivPercentile ?? 50;
    const fiiNet = data.fii?.net ?? 0;
    const rsi = data.tech?.rsi ?? 50;
    const adx = data.tech?.adx ?? 20;

    const factors = [];

    // PCR contribution — discrete buckets (mirrors backend to stay in sync)
    let pcrScore = 0;
    let pcrDesc = 'Balanced';
    if (pcr > 1.5)       { pcrScore = 20;  pcrDesc = 'Very put heavy → bullish'; }
    else if (pcr > 1.2)  { pcrScore = 15;  pcrDesc = 'Put heavy → bullish'; }
    else if (pcr > 1.05) { pcrScore =  8;  pcrDesc = 'Mild put skew'; }
    else if (pcr < 0.7)  { pcrScore = -20; pcrDesc = 'Very call heavy → bearish'; }
    else if (pcr < 0.8)  { pcrScore = -15; pcrDesc = 'Call heavy → bearish'; }
    else if (pcr < 0.95) { pcrScore =  -8; pcrDesc = 'Mild call skew'; }
    factors.push({ name: 'PCR', raw: pcr.toFixed(2), score: pcrScore, desc: pcrDesc });

    // VIX
    let vixScore = 0;
    if (vix < 14) vixScore = 15;
    else if (vix > 22) vixScore = -20;
    factors.push({ name: 'VIX', raw: vix.toFixed(1), score: vixScore,
      desc: vix < 14 ? 'Low fear' : vix > 22 ? 'High fear' : 'Normal' });

    // IV Percentile
    let ivScore = 0;
    if (ivPct < 30) ivScore = 10;
    else if (ivPct > 70) ivScore = -10;
    factors.push({ name: 'IV %ile', raw: `${Math.round(ivPct)}th`, score: ivScore,
      desc: ivPct < 30 ? 'Options cheap' : ivPct > 70 ? 'Options expensive' : 'Fair valued' });

    // FII Flow
    let fiiScore = 0;
    if (fiiNet > 0) fiiScore = 15;
    else if (fiiNet < 0) fiiScore = -15;
    factors.push({ name: 'FII Flow', raw: `₹${fiiNet.toFixed(0)}Cr`, score: fiiScore,
      desc: fiiNet > 0 ? 'Foreign buying' : fiiNet < 0 ? 'Foreign selling' : 'Flat' });

    // RSI
    let rsiScore = 0;
    if (rsi > 60) rsiScore = 10;
    else if (rsi < 40) rsiScore = -10;
    factors.push({ name: 'RSI', raw: rsi.toFixed(0), score: rsiScore,
      desc: rsi > 60 ? 'Bullish momentum' : rsi < 40 ? 'Bearish momentum' : 'Neutral' });

    // ADX
    let adxScore = 0;
    if (adx > 25) adxScore = 5;
    factors.push({ name: 'ADX', raw: adx.toFixed(0), score: adxScore,
      desc: adx > 25 ? 'Strong trend' : 'Weak trend' });

    return factors;
  }, [data?.pcr, data?.vix, data?.ivPercentile, data?.fii?.net, data?.tech?.rsi, data?.tech?.adx]);
}

export function Sentiment({ data }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const breakdown = useBreakdown(data);

  if (!data) return null;
  const { sentiment, fii, dii, callWall, putWall, maxPain, spot, totalCEOI, totalPEOI, netOIChange } = data;
  const s = sentiment || {};

  // Derive BOTH score and label from the same discrete breakdown so they
  // never disagree with each other regardless of backend PCR noise.
  // (backend score is still shown as fallback before breakdown is ready)
  const breakdownTotal = breakdown.reduce((sum, f) => sum + f.score, 0);
  const stableScore = breakdownTotal || Math.round(s.score || 0);
  // Widened dead-band ±25 — matches the backend fix
  const sentLabel = stableScore > 25 ? 'Bullish' : stableScore < -25 ? 'Bearish' : 'Neutral';

  const prevDay = spot - (s.dailyChange || 0);
  const prevWeek = spot - (s.weeklyChange || 0);
  const todayPct = prevDay !== 0 ? (s.dailyChange / prevDay) * 100 : 0;
  const weekPct  = prevWeek !== 0 ? (s.weeklyChange / prevWeek) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Overall Sentiment */}
      <div className="glass-card p-5">
        <h2 className="text-xs font-semibold text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
          <Activity size={13} className="text-neon-cyan" /> Market Sentiment
          <InfoTooltip metric="Market Sentiment" />
        </h2>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className={`text-2xl font-bold ${biasColor(sentLabel)}`}>{sentLabel}</div>
            <div className="text-[10px] text-gray-600 font-mono mt-0.5">Score: {stableScore > 0 ? '+' : ''}{stableScore}</div>
          </div>
          <div className="text-right space-y-0.5">
            <div className={`text-sm font-bold flex items-center gap-1 justify-end font-mono ${colorClass(todayPct)}`}>
              {todayPct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {fmt.pct(todayPct)}
            </div>
            <div className={`text-xs font-mono ${colorClass(weekPct)}`}>
              Week: {fmt.pct(weekPct)}
            </div>
          </div>
        </div>
        <SentimentGauge score={stableScore} />
        <div className="flex justify-between text-[9px] text-gray-700 mt-1.5">
          <span>Bearish</span><span>Neutral</span><span>Bullish</span>
        </div>

        {/* FIX #3: Factor breakdown — shows what drives the sentiment score */}
        <button
          onClick={() => setShowBreakdown(v => !v)}
          className="mt-3 flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          {showBreakdown ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          {showBreakdown ? 'Hide' : 'Show'} Score Breakdown
        </button>
        {showBreakdown && breakdown.length > 0 && (
          <div className="mt-2 space-y-1.5 pt-2 border-t border-white/[0.04]">
            {breakdown.map(f => (
              <div key={f.name} className="flex items-center gap-1.5 sm:gap-2 text-[10px]">
                <span className="w-10 sm:w-14 text-gray-500 shrink-0">{f.name}</span>
                <span className="w-12 sm:w-14 text-gray-400 font-mono shrink-0">{f.raw}</span>
                <span className={`w-8 font-bold font-mono text-right shrink-0 ${f.score > 0 ? 'text-neon-green' : f.score < 0 ? 'text-neon-red' : 'text-gray-600'}`}>
                  {f.score > 0 ? '+' : ''}{f.score}
                </span>
                <span className="text-gray-600 truncate">{f.desc}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] pt-1.5 border-t border-white/[0.04]">
              <span className="w-10 sm:w-14 text-gray-400 font-semibold shrink-0">Total</span>
              <span className="w-12 sm:w-14 shrink-0" />
              <span className={`w-8 font-bold font-mono text-right shrink-0 ${stableScore > 0 ? 'text-neon-green' : stableScore < 0 ? 'text-neon-red' : 'text-gray-400'}`}>
                {stableScore > 0 ? '+' : ''}{stableScore}
              </span>
              <span className={`font-semibold ${biasColor(stableScore > 25 ? 'Bullish' : stableScore < -25 ? 'Bearish' : 'Neutral')}`}>
                {stableScore > 25 ? 'Bullish' : stableScore < -25 ? 'Bearish' : 'Neutral'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* FII / DII */}
      <div className="glass-card p-5">
        <h2 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
          FII vs DII <InfoTooltip metric="FII vs DII Flows" />
        </h2>
        {data.fiiDate && (
          <div className="text-[10px] text-gray-600 mb-3 font-mono">
            {data.fiiDate}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 text-xs mb-2">
          <div className="bg-neon-green/5 border border-neon-green/10 rounded-xl p-3">
            <div className="text-gray-500 text-[10px] mb-1.5 font-semibold uppercase tracking-wider">FII</div>
            <div className="flex justify-between mb-0.5"><span className="text-gray-500">Buy</span><span className="text-neon-green font-semibold font-mono">{fmt.inCr(fii?.buy)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Sell</span><span className="text-neon-red font-semibold font-mono">{fmt.inCr(fii?.sell)}</span></div>
            <div className={`flex justify-between border-t border-white/[0.04] pt-1.5 mt-1.5 font-bold font-mono ${colorClass(fii?.net)}`}>
              <span className="text-gray-400">Net</span><span>{fmt.inCr(fii?.net)}</span>
            </div>
          </div>
          <div className="bg-neon-cyan/5 border border-neon-cyan/10 rounded-xl p-3">
            <div className="text-gray-500 text-[10px] mb-1.5 font-semibold uppercase tracking-wider">DII</div>
            <div className="flex justify-between mb-0.5"><span className="text-gray-500">Buy</span><span className="text-neon-green font-semibold font-mono">{fmt.inCr(dii?.buy)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Sell</span><span className="text-neon-red font-semibold font-mono">{fmt.inCr(dii?.sell)}</span></div>
            <div className={`flex justify-between border-t border-white/[0.04] pt-1.5 mt-1.5 font-bold font-mono ${colorClass(dii?.net)}`}>
              <span className="text-gray-400">Net</span><span>{fmt.inCr(dii?.net)}</span>
            </div>
          </div>
        </div>
        {(!fii?.buy && !fii?.sell && !dii?.buy) && (
          <p className="text-[10px] text-amber-600 mt-1">⚠️ FII/DII unavailable — retry after market hours.</p>
        )}
      </div>

      {/* OI Snapshot */}
      <div className="glass-card p-5">
        <h2 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
          OI Snapshot <InfoTooltip metric="Open Interest Snapshot" />
        </h2>
        <div className="space-y-2 text-xs">
          {[
            { label: 'Total CE OI', val: fmt.large(totalCEOI) },
            { label: 'Total PE OI', val: fmt.large(totalPEOI) },
            { label: 'Net OI Change', val: fmt.large(netOIChange), cls: colorClass(netOIChange) },
            { label: 'Call Wall', val: callWall ? `₹${callWall.strike} (${fmt.large(callWall.oi)})` : '—' },
            { label: 'Put Wall', val: putWall ? `₹${putWall.strike} (${fmt.large(putWall.oi)})` : '—' },
            { label: 'Max Pain', val: fmt.inr(maxPain) },
          ].map(({ label, val, cls }) => (
            <div key={label} className="flex justify-between border-b border-white/[0.04] pb-1.5 last:border-0">
              <span className="text-gray-500">{label}</span>
              <span className={`font-semibold font-mono ${cls || 'text-gray-200'}`}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
