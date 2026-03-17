import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Clock, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useRefresh, useData } from './hooks/useRefresh';
import { MetricsGrid, SpotTicker } from './components/MetricsGrid';
import { NewsSection } from './components/News';
import { Positions } from './components/Positions';
import { TradeRadar } from './components/Radar';
import { ElliottWave } from './components/Elliott';
import { MacroPrices } from './components/Macro';
import { Sentiment } from './components/Sentiment';
import { SupportResistance } from './components/SupportResistance';
import { PriceChart } from './components/PriceChart';
import { OIChart } from './components/OIChart';
import { computePositionPnL } from './utils/blackscholes';

const API = import.meta.env.VITE_API_URL || '/api';

// ─── Progress Overlay ─────────────────────────────────────────────────────────
function ProgressOverlay({ progress }) {
  if (!progress || progress.pct === 0 || progress.pct >= 100) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-[calc(100%-2rem)] max-w-[420px] bg-gray-950 border border-cyan-500/10 rounded-2xl p-8 shadow-2xl text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <RefreshCw size={18} className="text-cyan-400 animate-spin" />
          <span className="text-sm font-semibold text-white tracking-wide">Refreshing Market Data</span>
        </div>
        <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full bg-gradient-to-r from-neon-cyan to-neon-green rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress.pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mb-5">
          <span>{progress.text || 'Processing…'}</span>
          <span className="font-bold text-cyan-400 font-mono">{progress.pct}%</span>
        </div>
        {[
          [10, 'Fetching NIFTY Spot'],
          [25, 'Fetching Option Chain'],
          [40, 'Calculating OI Walls & Max Pain'],
          [55, 'Fetching FII/DII'],
          [70, 'Fetching News & Macro'],
          [85, 'Calculating Sentiment & Elliott'],
          [100, 'Building Dashboard'],
        ].map(([threshold, label]) => (
          <div key={label} className={`flex items-center gap-2 text-xs py-0.5 transition-colors ${progress.pct >= threshold ? 'text-neon-green' : 'text-gray-700'}`}>
            <span className="w-4 text-center">{progress.pct >= threshold ? '✓' : '○'}</span>
            <span>{label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ data, isRefreshing, progress, onRefresh }) {
  return (
    <div className="bg-gray-950/95 border-b border-white/[0.04] backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan/30 to-neon-green/20 border border-neon-cyan/20 flex items-center justify-center">
            <span className="text-[11px] font-black text-neon-cyan">N</span>
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-black tracking-tight text-white leading-none">
              NIFTY<span className="text-neon-cyan">PRO</span>
              <span className="text-gray-500 font-medium text-[10px] ml-1.5 tracking-wide">Market Intelligence Terminal</span>
            </div>
            <div className="text-[9px] text-gray-600 font-medium tracking-widest uppercase">Developed by Akshat Saxena</div>
          </div>
        </div>

        {/* Spot ticker — always visible when data loaded */}
        {data && (
          <div className="ml-0 sm:ml-2 min-w-0">
            <SpotTicker spot={data.spot} dailyChange={data.dailyChange} dailyChangePct={data.dailyChangePct} />
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Connection indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px]">
            {data ? (
              <><Wifi size={10} className="text-neon-green" /><span className="text-neon-green/70">LIVE</span></>
            ) : (
              <><WifiOff size={10} className="text-gray-600" /><span className="text-gray-600">OFFLINE</span></>
            )}
          </div>

          {/* Timestamp */}
          {data?.timestamp && (
            <div className="hidden md:flex items-center gap-1.5 text-[10px] text-gray-600">
              <Clock size={10} />
              <span>{new Date(data.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-neon-cyan/80 to-neon-green/60 hover:from-neon-cyan hover:to-neon-green/80 disabled:opacity-40 rounded-lg text-[11px] font-semibold text-gray-950 transition-all shadow-lg"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{isRefreshing ? `${progress.pct}%` : 'Refresh'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { data, loading, setData } = useData();
  const [pnlData, setPnlData] = useState([]);

  const onDataReady = useCallback((d) => setData(d), [setData]);
  const { progress, isRefreshing, error, startRefresh } = useRefresh(onDataReady);

  const loadPnL = useCallback(() => {
    fetch(`${API}/positions`)
      .then((r) => r.ok ? r.json() : [])
      .then((rawPositions) => {
        if (!data || !rawPositions.length) { setPnlData([]); return; }
        const computed = rawPositions.map(pos =>
          computePositionPnL(pos, data.chain, data.spot, data.avgIV)
        );
        setPnlData(computed);
      })
      .catch(() => setPnlData([]));
  }, [data]);

  useEffect(() => { loadPnL(); }, [data, loadPnL]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      <ProgressOverlay progress={isRefreshing ? progress : null} />

      <Header
        data={data}
        isRefreshing={isRefreshing}
        progress={progress}
        onRefresh={startRefresh}
      />

      <main className="max-w-screen-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">
        {/* No data state */}
        {!loading && !data && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh] gap-5"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan/10 to-neon-green/5 border border-neon-cyan/10 flex items-center justify-center">
              <AlertCircle size={28} className="text-gray-600" />
            </div>
            <div className="text-center">
              <p className="text-gray-300 text-sm font-medium mb-1">No Market Data</p>
              <p className="text-gray-600 text-xs">Load the dashboard to see real-time NIFTY intelligence</p>
            </div>
            <button
              onClick={startRefresh}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-neon-cyan/80 to-neon-green/60 hover:from-neon-cyan hover:to-neon-green/80 rounded-xl text-sm font-semibold text-gray-950 transition-all shadow-lg"
            >
              <RefreshCw size={15} /> Load Dashboard
            </button>
          </motion.div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 h-44 animate-pulse"
              >
                <div className="h-3 bg-gray-800 rounded w-1/3 mb-4" />
                <div className="h-2 bg-gray-800/60 rounded w-full mb-2" />
                <div className="h-2 bg-gray-800/60 rounded w-2/3" />
              </motion.div>
            ))}
          </div>
        )}

        {/* ── DASHBOARD ───────────────────────────────────────────────── */}
        {data && (
          <>
            {/* Banners */}
            {error && (
              <div className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded-xl px-4 py-2.5">
                ⚠️ {error}
              </div>
            )}
            {data._stale && (
              <div className="text-xs text-amber-400 bg-amber-950/20 border border-amber-900/30 rounded-xl px-4 py-2.5 flex items-start gap-2">
                <AlertCircle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Some data unavailable ({data._stale.sections.join(', ')}).
                  {data._stale.prevTimestamp && (
                    <> Showing data from {new Date(data._stale.prevTimestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })} IST.</>
                  )}
                </span>
              </div>
            )}

            {/* Row 1: Price chart + Sentiment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <PriceChart historyBars={data.historyBars} spot={data.spot} dailyChange={data.dailyChange} dailyChangePct={data.dailyChangePct} />
              </div>
              <Sentiment data={data} />
            </div>

            {/* Row 2: Key metrics */}
            <MetricsGrid data={data} />

            {/* Row 3: OI Chart */}
            <OIChart
              chain={data.chain} spot={data.spot} maxPain={data.maxPain}
              callWall={data.callWall} putWall={data.putWall}
              totalCEOI={data.totalCEOI} totalPEOI={data.totalPEOI}
              netOIChange={data.netOIChange} chainSource={data.chainSource}
            />

            {/* Row 4: Elliott Wave + Support/Resistance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ElliottWave elliottWave={data.elliottWave} spot={data.spot} />
              <SupportResistance
                support={data.support} resistance={data.resistance}
                pivots={data.pivots} gex={data.gex} spot={data.spot}
              />
            </div>

            {/* Row 5: Trade Radar + Positions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TradeRadar setups={data.tradeSetups} />
              <Positions pnlData={pnlData} onRefreshPositions={loadPnL} />
            </div>

            {/* Row 6: News + Macro */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <NewsSection news={data.news} />
              </div>
              <MacroPrices macroPrices={data.macroPrices} />
            </div>

            {/* Footer */}
            <div className="text-center py-6 border-t border-white/[0.04]">
              <p className="text-[11px] text-gray-600 font-semibold tracking-widest uppercase">
                NIFTY PRO Market Intelligence Terminal
              </p>
              <p className="text-[10px] text-gray-700 mt-0.5">
                Developed by <span className="text-neon-cyan/70 font-medium">Akshat Saxena</span>
              </p>
              <p className="text-[9px] text-gray-800 mt-1.5">
                Data: NSE India · Yahoo Finance · ET · Moneycontrol · Reuters · Livemint · Business Standard · CNBC TV18
                <br />⚠️ For educational use only. Not SEBI investment advice.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
