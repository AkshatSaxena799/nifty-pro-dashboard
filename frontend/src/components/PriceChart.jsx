// UPDATED — Premium chart styling
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

function trendColor(signal) {
  if (signal === 'Strong Uptrend') return 'text-emerald-700 dark:text-neon-green';
  if (signal === 'Uptrend') return 'text-emerald-700 dark:text-neon-green/80';
  if (signal === 'Pullback') return 'text-amber-700 dark:text-amber-400';
  if (signal === 'Bounce') return 'text-sky-800 dark:text-neon-cyan';
  if (signal === 'Downtrend') return 'text-rose-600 dark:text-neon-red/80';
  if (signal === 'Strong Downtrend') return 'text-rose-600 dark:text-neon-red';
  return 'text-gray-700 dark:text-wcag-muted';
}

export function PriceChart({ historyBars, spot, dailyChange, dailyChangePct }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [redrawTick, setRedrawTick] = useState(0);

  // Redraw canvas when window is resized
  useEffect(() => {
    let t;
    const onResize = () => { clearTimeout(t); t = setTimeout(() => setRedrawTick(n => n + 1), 120); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, []);

  useEffect(() => {
    const bars = historyBars?.daily;
    if (!bars || bars.length === 0 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;

    const closes = bars.map((b) => b.close).filter(Boolean);
    const dates = bars.map((b) => b.date);
    const rawMin = Math.min(...closes);
    const rawMax = Math.max(...closes);
    // ±2000 pt Y-axis extension for contextual range
    const minC = rawMin - 2000;
    const maxC = rawMax + 2000;
    const range = maxC - minC || 1;
    const pad = { top: 20, right: 20, bottom: 30, left: 72 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    const xScale = (i) => pad.left + (i / Math.max(closes.length - 1, 1)) * chartW;
    const yScale = (v) => pad.top + chartH - ((v - minC) / range) * chartH;

    chartRef.current = { closes, dates, xScale, yScale, pad, W, H };

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      const val = maxC - (range / 4) * i;
      ctx.fillStyle = 'rgba(160,160,180,0.4)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(val).toLocaleString('en-IN'), pad.left - 8, y + 3);
    }

    const isUp = closes[closes.length - 1] >= closes[0];
    const lineColor = isUp ? '#5fd88f' : '#FF5A76';
    const fillTop = isUp ? 'rgba(95,216,143,0.08)' : 'rgba(255,90,118,0.08)';
    const fillBot = 'rgba(0,0,0,0)';

    // Gradient fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, fillTop);
    grad.addColorStop(1, fillBot);

    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(closes[0]));
    closes.forEach((c, i) => ctx.lineTo(xScale(i), yScale(c)));
    ctx.lineTo(xScale(closes.length - 1), pad.top + chartH);
    ctx.lineTo(xScale(0), pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(closes[0]));
    closes.forEach((c, i) => ctx.lineTo(xScale(i), yScale(c)));
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Glow effect on line
    ctx.shadowColor = lineColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(xScale(0), yScale(closes[0]));
    closes.forEach((c, i) => ctx.lineTo(xScale(i), yScale(c)));
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // SMA20 line — key trend indicator (yellow dashed)
    const smaWindow = 20;
    const smaValues = closes.map((_, i) => {
      if (i < smaWindow - 1) return null;
      const sl = closes.slice(i - smaWindow + 1, i + 1);
      return sl.reduce((a, b) => a + b, 0) / smaWindow;
    });
    ctx.beginPath();
    let smaStarted = false;
    smaValues.forEach((v, i) => {
      if (v === null) return;
      const sx = xScale(i), sy = yScale(v);
      if (!smaStarted) { ctx.moveTo(sx, sy); smaStarted = true; }
      else ctx.lineTo(sx, sy);
    });
    ctx.strokeStyle = 'rgba(251,191,36,0.55)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // X-axis date labels
    const step = Math.max(1, Math.floor(dates.length / 5));
    ctx.fillStyle = 'rgba(160,160,180,0.35)';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i < dates.length; i += step) {
      ctx.fillText(dates[i]?.slice(5) || '', xScale(i), H - 6);
    }
  }, [historyBars, redrawTick]);

  const handleMouseMove = useCallback((e) => {
    const cs = chartRef.current;
    if (!cs) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;

    const { closes, dates, xScale, pad } = cs;
    let best = 0;
    let bestDist = Infinity;
    closes.forEach((_, i) => {
      const d = Math.abs(xScale(i) - mx);
      if (d < bestDist) { bestDist = d; best = i; }
    });

    if (bestDist < 30 * scaleX && mx >= pad.left) {
      const price = closes[best];
      const pctFromStart = ((price - closes[0]) / closes[0] * 100).toFixed(2);
      const pctFromPrev = best > 0 ? ((price - closes[best - 1]) / closes[best - 1] * 100).toFixed(2) : '0.00';
      const tipX = e.clientX - rect.left;
      const tipY = e.clientY - rect.top;
      setTooltip({ x: tipX, y: tipY, price, date: dates[best], pctFromStart, pctFromPrev });
    } else {
      setTooltip(null);
    }
  }, []);

  const isUp = (dailyChange ?? 0) >= 0;
  const bars = historyBars?.daily;
  const firstClose = bars?.[0]?.close;
  const lastClose = bars?.[bars.length - 1]?.close;
  const periodPct = firstClose && lastClose ? ((lastClose - firstClose) / firstClose * 100).toFixed(2) : null;

  const chartInsights = useMemo(() => {
    const bs = historyBars?.daily;
    if (!bs || bs.length < 5) return null;
    const cls = bs.map(b => b.close).filter(Boolean);
    if (cls.length < 5) return null;
    const last = cls[cls.length - 1];
    const high60 = Math.max(...cls);
    const low60 = Math.min(...cls);
    const mid = (high60 + low60) / 2;
    const sma20Arr = cls.slice(-20);
    const sma20 = sma20Arr.reduce((a, b) => a + b, 0) / sma20Arr.length;
    const prev5 = cls[Math.max(0, cls.length - 6)];
    const momentum5 = ((last - prev5) / prev5) * 100;
    const range60pct = ((high60 - low60) / mid) * 100;
    const recoveryPct = high60 !== low60 ? ((last - low60) / (high60 - low60)) * 100 : 50;
    const fromHighPct = ((last - high60) / high60) * 100;
    const fromLowPct = ((last - low60) / low60) * 100;
    const aboveSMA = last > sma20;
    const strong = Math.abs(momentum5) > 1.5;
    let trendSignal = 'Sideways';
    if (aboveSMA && momentum5 > 0) trendSignal = strong ? 'Strong Uptrend' : 'Uptrend';
    else if (!aboveSMA && momentum5 < 0) trendSignal = strong ? 'Strong Downtrend' : 'Downtrend';
    else if (aboveSMA && momentum5 < 0) trendSignal = 'Pullback';
    else if (!aboveSMA && momentum5 > 0) trendSignal = 'Bounce';
    return { high60, low60, sma20, momentum5, range60pct, recoveryPct, fromHighPct, fromLowPct, aboveSMA, trendSignal };
  }, [historyBars]);

  // No data — compact placeholder, no wasted space
  if (!bars || bars.length === 0) {
    return (
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h2 className="text-xs font-semibold text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted uppercase tracking-wider">NIFTY 60-Day</h2>
        </div>
        <div className="flex items-center justify-center py-6 text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted text-xs">
          Click <span className="text-blue-950 dark:text-neon-cyan font-medium mx-1">Refresh</span> to load price history
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xs font-semibold text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted uppercase tracking-wider">NIFTY 60-Day</h2>
        <div className="flex items-center gap-3">
          {spot ? (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900 dark:text-wcag-text font-mono text-glow-cyan">
                ₹{Math.round(spot).toLocaleString('en-IN')}
              </span>
              <span className="flex items-center gap-1 text-sm font-bold font-mono text-gray-900 dark:text-wcag-text">
                <span className={isUp ? 'text-emerald-700 dark:text-neon-green' : 'text-rose-600 dark:text-neon-red'}>{isUp ? '▲' : '▼'}</span>
                {Math.abs(dailyChange ?? 0).toFixed(0)}
                <span className="text-xs ml-0.5 opacity-70">({Math.abs(dailyChangePct ?? 0).toFixed(2)}%)</span>
              </span>
            </div>
          ) : null}
          {periodPct != null && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
              parseFloat(periodPct) >= 0
                ? 'bg-neon-green/10 border border-neon-green/20 text-emerald-700 dark:text-neon-green'
                : 'bg-neon-red/10 border border-neon-red/20 text-rose-600 dark:text-neon-red'}`}>
              60d: {parseFloat(periodPct) >= 0 ? '+' : ''}{periodPct}%
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair block chart-canvas"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        />
        {tooltip && (
          <div
            className="absolute z-10 pointer-events-none bg-white dark:bg-wcag-bg/95 border border-cyan-500/15 rounded-xl px-3 py-2 text-xs shadow-2xl backdrop-blur-sm"
            style={{
              left: Math.min(tooltip.x + 14, 260),
              top: Math.max(tooltip.y - 70, 0),
            }}
          >
            <div className="text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted mb-1 font-mono">{tooltip.date}</div>
            <div className="text-gray-900 dark:text-wcag-text font-bold text-sm font-mono">
              ₹{Math.round(tooltip.price).toLocaleString('en-IN')}
            </div>
            <div className="font-mono font-semibold mt-0.5 text-gray-900 dark:text-wcag-text flex items-center gap-1">
              <span className={parseFloat(tooltip.pctFromPrev) >= 0 ? 'text-emerald-700 dark:text-neon-green' : 'text-rose-600 dark:text-neon-red'}>{parseFloat(tooltip.pctFromPrev) >= 0 ? '▲' : '▼'}</span>
              Day: {Math.abs(parseFloat(tooltip.pctFromPrev))}%
            </div>
            <div className="text-xs mt-0.5 font-mono text-gray-700 dark:text-wcag-muted flex items-center gap-1">
              <span className={parseFloat(tooltip.pctFromStart) >= 0 ? 'text-emerald-700 dark:text-neon-green' : 'text-rose-600 dark:text-neon-red'}>{parseFloat(tooltip.pctFromStart) >= 0 ? '▲' : '▼'}</span>
              60d: {Math.abs(parseFloat(tooltip.pctFromStart))}%
            </div>
          </div>
        )}
      </div>

      {/* Chart Insights — fills space and tells what the chart is saying */}
      {chartInsights && (
        <div className="mt-3 pt-3 border-t border-white/[0.04] grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2">
          <div className="bg-gray-50 dark:bg-wcag-surface1 border border-white/[0.04] rounded-xl p-2.5 text-center">
            <div className="text-[9px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted uppercase tracking-wider mb-1">60D High</div>
            <div className="text-gray-900 dark:text-wcag-text text-[11px] font-bold font-mono">₹{Math.round(chartInsights.high60).toLocaleString('en-IN')}</div>
            <div className="text-[9px] font-mono text-gray-900 dark:text-wcag-text">{chartInsights.fromHighPct.toFixed(1)}%</div>
          </div>
          <div className="bg-gray-50 dark:bg-wcag-surface1 border border-white/[0.04] rounded-xl p-2.5 text-center">
            <div className="text-[9px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted uppercase tracking-wider mb-1">60D Low</div>
            <div className="text-gray-900 dark:text-wcag-text text-[11px] font-bold font-mono">₹{Math.round(chartInsights.low60).toLocaleString('en-IN')}</div>
            <div className="text-[9px] font-mono text-gray-900 dark:text-wcag-text">+{chartInsights.fromLowPct.toFixed(1)}%</div>
          </div>
          <div className="bg-gray-50 dark:bg-wcag-surface1 border border-white/[0.04] rounded-xl p-2.5 text-center">
            <div className="text-[9px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted uppercase tracking-wider mb-1">SMA 20</div>
            <div className="text-gray-900 dark:text-wcag-text text-[11px] font-bold font-mono">₹{Math.round(chartInsights.sma20).toLocaleString('en-IN')}</div>
            <div className="text-[9px] font-mono text-gray-900 dark:text-wcag-text flex items-center justify-center gap-1">
              <span className={chartInsights.aboveSMA ? 'text-emerald-700 dark:text-neon-green' : 'text-rose-600 dark:text-neon-red'}>{chartInsights.aboveSMA ? '▲' : '▼'}</span>
              {chartInsights.aboveSMA ? 'Above' : 'Below'}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-wcag-surface1 border border-white/[0.04] rounded-xl p-2.5 text-center">
            <div className="text-[9px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted uppercase tracking-wider mb-1">5D Momt.</div>
            <div className="text-[11px] font-bold font-mono text-gray-900 dark:text-wcag-text flex items-center justify-center gap-1">
              <span className={chartInsights.momentum5 >= 0 ? 'text-emerald-700 dark:text-neon-green' : 'text-rose-600 dark:text-neon-red'}>{chartInsights.momentum5 >= 0 ? '▲' : '▼'}</span>
              {Math.abs(chartInsights.momentum5).toFixed(2)}%
            </div>
            <div className="text-[9px] font-mono text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted">
              {Math.abs(chartInsights.momentum5) > 2 ? 'Strong' : Math.abs(chartInsights.momentum5) > 0.5 ? 'Moderate' : 'Weak'}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-wcag-surface1 border border-white/[0.04] rounded-xl p-2.5 text-center">
            <div className="text-[9px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted uppercase tracking-wider mb-1">60D Range</div>
            <div className="text-blue-950 dark:text-neon-cyan/90 text-[11px] font-bold font-mono">{chartInsights.range60pct.toFixed(1)}%</div>
            <div className="text-[9px] font-mono text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted">
              {chartInsights.range60pct > 20 ? 'High Vol' : chartInsights.range60pct > 10 ? 'Normal' : 'Low Vol'}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-wcag-surface1 border border-white/[0.04] rounded-xl p-2.5 text-center">
            <div className="text-[9px] text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted uppercase tracking-wider mb-1">Signal</div>
            <div className="text-[10px] font-bold leading-tight text-gray-900 dark:text-wcag-text">
              <span className={trendColor(chartInsights.trendSignal).split(' ')[0] + ' mr-1'}>{['Strong Uptrend', 'Uptrend', 'Bounce'].includes(chartInsights.trendSignal) ? '▲' : ['Strong Downtrend', 'Downtrend', 'Pullback'].includes(chartInsights.trendSignal) ? '▼' : '●'}</span>
              {chartInsights.trendSignal}
            </div>
            <div className="text-[9px] font-mono text-gray-700 dark:text-wcag-muted dark:text-wcag-muted dark:text-wcag-muted">{Math.round(chartInsights.recoveryPct)}% recovery</div>
          </div>
        </div>
      )}
    </div>
  );
}
