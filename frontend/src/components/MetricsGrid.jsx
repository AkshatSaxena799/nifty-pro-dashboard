import { TrendingUp, TrendingDown, Minus, RefreshCw, Activity } from 'lucide-react';
import { fmt, colorClass, biasColor } from '../utils/formatters';
import { InfoTooltip } from '../utils/tooltips.jsx';

function MetricRow({ label, value, valueClass, tooltipKey }) {
  return (
    <div className="metric-row flex items-center justify-between py-2 border-b border-black/[0.04] dark:border-white/[0.04] last:border-0 group">
      <span className="text-gray-500 dark:text-wcag-muted text-[11px] flex items-center gap-1 font-medium">
        {label}
        <InfoTooltip metric={tooltipKey || label} />
      </span>
      <span className={`text-[11px] font-semibold font-data ${valueClass || 'text-gray-800 dark:text-white'}`}>{value}</span>
    </div>
  );
}

export function SpotTicker({ spot, dailyChange, dailyChangePct }) {
  const up = dailyChange >= 0;
  return (
    <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
      <span className="text-xl sm:text-3xl font-black tracking-tight font-data text-gray-900 dark:text-white">
        ₹{spot ? Number(spot).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}
      </span>
      <span className="flex items-center gap-1 text-sm sm:text-base font-bold font-data">
        <span className={up ? 'text-emerald-600 dark:text-neon-green text-glow-green' : 'text-rose-500 dark:text-neon-red text-glow-red'}>{up ? '▲' : '▼'}</span>
        <span className="text-gray-600 dark:text-wcag-muted">{fmt.pct(dailyChangePct)}</span>
        <span className="text-[11px] text-gray-400 dark:text-white/30">({up ? '+' : ''}{fmt.num(dailyChange, 0)})</span>
      </span>
    </div>
  );
}

export function MetricsGrid({ data }) {
  if (!data) return null;
  const { spot, dailyTrend, weeklyTrend, tech, vix, ivPercentile, maxPain, pcr, optionsBias, structureBias } = data;
  const c = tech || {};

  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-5">
        <Activity size={14} className="text-sky-500 dark:text-neon-cyan shrink-0" />
        <h2 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-[0.1em]">Market Metrics</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6">
        <div>
          <MetricRow label="Daily Trend"
            value={<><span className={dailyTrend?.includes('Up') ? 'text-emerald-700 dark:text-neon-green mr-1' : 'text-rose-600 dark:text-neon-red mr-1'}>{dailyTrend?.includes('Up') ? '▲' : '▼'}</span> <span className="text-gray-900 dark:text-wcag-text">{dailyTrend}</span></>} />
          <MetricRow label="Weekly Trend" 
            value={<><span className={weeklyTrend?.includes('Up') ? 'text-emerald-700 dark:text-neon-green mr-1' : 'text-rose-600 dark:text-neon-red mr-1'}>{weeklyTrend?.includes('Up') ? '▲' : '▼'}</span> <span className="text-gray-900 dark:text-wcag-text">{weeklyTrend}</span></>} />
          <MetricRow label="RSI (Daily)" tooltipKey="RSI"
            value={<div className="flex items-center gap-1.5"><span className={c.rsi > 70 ? 'text-orange-400' : c.rsi < 30 ? 'text-blue-400' : 'text-gray-500'}>{c.rsi > 70 ? '●' : c.rsi < 30 ? '●' : '●'}</span><span className="text-gray-900 dark:text-wcag-text">{`${fmt.num(c.rsi)} — ${c.rsiCondition || ''}`}</span></div>} />
          <MetricRow label="MACD Histogram" tooltipKey="MACD Histogram"
            value={<div className="flex items-center gap-1.5"><span className={colorClass(c.macd?.hist)}>{c.macd?.hist > 0 ? '▲' : c.macd?.hist < 0 ? '▼' : '●'}</span><span className="text-gray-900 dark:text-wcag-text">{fmt.num(Math.abs(c.macd?.hist || 0))}</span></div>} />
          <MetricRow label="ADX" tooltipKey="ADX"
            value={<div className="flex items-center gap-1.5"><span className={c.adx > 25 ? 'text-emerald-700 dark:text-neon-green' : 'text-amber-700 dark:text-amber-400'}>{c.adx > 25 ? '▲' : '●'}</span><span className="text-gray-900 dark:text-wcag-text">{`${fmt.num(c.adx)} — ${c.strongTrend ? 'Strong' : 'Weak'}`}</span></div>} />
        </div>
        <div>
          <MetricRow label="MA200 (Daily)" 
            value={<><span className={c.above200 ? 'text-emerald-700 dark:text-neon-green mr-1' : 'text-rose-600 dark:text-neon-red mr-1'}>{c.above200 ? '▲' : '▼'}</span> <span className="text-gray-900 dark:text-wcag-text">{fmt.inr(c.ma200)}</span></>} />
          <MetricRow label="81-Week MA" 
            value={<><span className={c.above81w ? 'text-emerald-700 dark:text-neon-green mr-1' : 'text-rose-600 dark:text-neon-red mr-1'}>{c.above81w ? '▲' : '▼'}</span> <span className="text-gray-900 dark:text-wcag-text">{fmt.inr(c.ma81w)}</span></>} />
          <MetricRow label="India VIX" tooltipKey="India VIX"
            value={<div className="flex items-center gap-1.5"><span className={data.vix > 22 ? 'text-rose-600 dark:text-neon-red' : data.vix < 14 ? 'text-emerald-700 dark:text-neon-green' : 'text-amber-700 dark:text-amber-400'}>{data.vix > 22 ? '▲' : data.vix < 14 ? '▼' : '●'}</span><span className="text-gray-900 dark:text-wcag-text">{fmt.num(data.vix)}</span></div>} />
          <MetricRow label="IV Percentile" tooltipKey="IV Percentile"
            value={<div className="flex items-center gap-1.5"><span className={ivPercentile > 75 ? 'text-orange-400' : ivPercentile < 25 ? 'text-blue-400' : 'text-gray-500'}>{ivPercentile > 75 ? '▲' : ivPercentile < 25 ? '▼' : '●'}</span><span className="text-gray-900 dark:text-wcag-text">{`${ivPercentile}th`}</span></div>} />
          <MetricRow label="Vol Squeeze" tooltipKey="Vol Expansion Setup"
            value={<div className="flex items-center gap-1.5"><span className={c.bbSqueeze ? 'text-amber-700 dark:text-amber-300 animate-pulse' : 'text-gray-500'}>{c.bbSqueeze ? '⚡' : '●'}</span><span className="text-gray-900 dark:text-wcag-text">{c.bbSqueeze ? 'ACTIVE' : 'Inactive'}</span></div>} />
        </div>
        <div>
          <MetricRow label="Max Pain" tooltipKey="Max Pain" value={fmt.inr(maxPain)} />
          <MetricRow label="PCR (OI)" tooltipKey="PCR"
            value={<div className="flex items-center gap-1.5"><span className={pcr > 1.2 ? 'text-emerald-700 dark:text-neon-green' : pcr < 0.8 ? 'text-rose-600 dark:text-neon-red' : 'text-gray-500'}>{pcr > 1.2 ? '▲' : pcr < 0.8 ? '▼' : '●'}</span><span className="text-gray-900 dark:text-wcag-text">{fmt.num(pcr, 3)}</span></div>} />
          <MetricRow label="Options Bias" tooltipKey="Options Chain Bias"
            value={<div className="flex items-center gap-1.5"><span className={biasColor(optionsBias)}>{optionsBias === 'Bullish' ? '▲' : optionsBias === 'Bearish' ? '▼' : '●'}</span><span className="text-gray-900 dark:text-wcag-text">{optionsBias}</span></div>} />
          <MetricRow label="Tech Bias" tooltipKey="Technical Bias"
            value={<div className="flex items-center gap-1.5"><span className={biasColor(c.bias)}>{c.bias === 'Bullish' ? '▲' : c.bias === 'Bearish' ? '▼' : '●'}</span><span className="text-gray-900 dark:text-wcag-text">{c.bias}</span></div>} />
          <MetricRow label="Structure" tooltipKey="Structure Bias"
            value={<div className="flex items-center gap-1.5"><span className={biasColor(structureBias)}>{structureBias === 'Bullish' ? '▲' : structureBias === 'Bearish' ? '▼' : '●'}</span><span className="text-gray-900 dark:text-wcag-text">{structureBias}</span></div>} />
        </div>
      </div>
    </div>
  );
}
