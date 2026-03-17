import { TrendingUp, TrendingDown, Minus, RefreshCw, Activity } from 'lucide-react';
import { fmt, colorClass, biasColor } from '../utils/formatters';
import { InfoTooltip } from '../utils/tooltips.jsx';

function MetricRow({ label, value, valueClass, tooltipKey }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0 group">
      <span className="text-gray-500 text-xs flex items-center gap-1">
        {label}
        <InfoTooltip metric={tooltipKey || label} />
      </span>
      <span className={`text-xs font-semibold font-mono ${valueClass || 'text-gray-200'}`}>{value}</span>
    </div>
  );
}

export function SpotTicker({ spot, dailyChange, dailyChangePct }) {
  const up = dailyChange >= 0;
  return (
    <div className="flex items-baseline gap-1.5 sm:gap-3 flex-wrap">
      <span className="text-xl sm:text-3xl font-bold text-white tracking-tight font-mono text-glow-cyan">
        ₹{spot ? Number(spot).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—'}
      </span>
      <span className={`flex items-center gap-1 text-sm sm:text-base font-bold font-mono ${up ? 'text-neon-green text-glow-green' : 'text-neon-red text-glow-red'}`}>
        {up ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        {fmt.pct(dailyChangePct)}
        <span className="text-xs opacity-70">({up ? '+' : ''}{fmt.num(dailyChange, 0)})</span>
      </span>
    </div>
  );
}

export function MetricsGrid({ data }) {
  if (!data) return null;
  const { spot, dailyTrend, weeklyTrend, tech, vix, ivPercentile, maxPain, pcr, optionsBias, structureBias } = data;
  const c = tech || {};

  return (
    <div className="glass-card p-5">
      <h2 className="text-xs font-semibold text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
        <Activity size={13} className="text-neon-cyan" /> Market Metrics
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6">
        <div>
          <MetricRow label="Daily Trend" tooltipKey="Daily Trend"
            value={dailyTrend} valueClass={dailyTrend?.includes('Up') ? 'text-neon-green' : 'text-neon-red'} />
          <MetricRow label="Weekly Trend" tooltipKey="Weekly Trend"
            value={weeklyTrend} valueClass={weeklyTrend?.includes('Up') ? 'text-neon-green' : 'text-neon-red'} />
          <MetricRow label="RSI (Daily)" tooltipKey="RSI"
            value={`${fmt.num(c.rsi)} — ${c.rsiCondition || ''}`}
            valueClass={c.rsi > 70 ? 'text-orange-400' : c.rsi < 30 ? 'text-blue-400' : 'text-gray-200'} />
          <MetricRow label="MACD Histogram" tooltipKey="MACD Histogram"
            value={fmt.num(c.macd?.hist)} valueClass={colorClass(c.macd?.hist)} />
          <MetricRow label="ADX" tooltipKey="ADX"
            value={`${fmt.num(c.adx)} — ${c.strongTrend ? 'Strong' : 'Weak'}`}
            valueClass={c.adx > 25 ? 'text-neon-green' : 'text-yellow-400'} />
        </div>
        <div>
          <MetricRow label="MA200 (Daily)" tooltipKey="MA200"
            value={`${fmt.inr(c.ma200)} ${c.above200 ? '✓' : '✗'}`}
            valueClass={c.above200 ? 'text-neon-green' : 'text-neon-red'} />
          <MetricRow label="81-Week MA" tooltipKey="81-Week MA"
            value={`${fmt.inr(c.ma81w)} ${c.above81w ? '✓' : '✗'}`}
            valueClass={c.above81w ? 'text-neon-green' : 'text-neon-red'} />
          <MetricRow label="India VIX" tooltipKey="India VIX"
            value={fmt.num(data.vix)}
            valueClass={data.vix > 22 ? 'text-neon-red' : data.vix < 14 ? 'text-neon-green' : 'text-yellow-400'} />
          <MetricRow label="IV Percentile" tooltipKey="IV Percentile"
            value={`${ivPercentile}th`}
            valueClass={ivPercentile > 75 ? 'text-orange-400' : ivPercentile < 25 ? 'text-blue-400' : 'text-gray-200'} />
          <MetricRow label="Vol Squeeze" tooltipKey="Vol Expansion Setup"
            value={c.bbSqueeze ? 'ACTIVE ⚡' : 'Inactive'}
            valueClass={c.bbSqueeze ? 'text-yellow-300 animate-pulse' : 'text-gray-600'} />
        </div>
        <div>
          <MetricRow label="Max Pain" tooltipKey="Max Pain" value={fmt.inr(maxPain)} />
          <MetricRow label="PCR (OI)" tooltipKey="PCR"
            value={fmt.num(pcr, 3)}
            valueClass={pcr > 1.2 ? 'text-neon-green' : pcr < 0.8 ? 'text-neon-red' : 'text-gray-200'} />
          <MetricRow label="Options Bias" tooltipKey="Options Chain Bias"
            value={optionsBias} valueClass={biasColor(optionsBias)} />
          <MetricRow label="Tech Bias" tooltipKey="Technical Bias"
            value={c.bias} valueClass={biasColor(c.bias)} />
          <MetricRow label="Structure" tooltipKey="Structure Bias"
            value={structureBias} valueClass={biasColor(structureBias)} />
        </div>
      </div>
    </div>
  );
}
