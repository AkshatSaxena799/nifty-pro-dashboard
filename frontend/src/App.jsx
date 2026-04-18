import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Clock, AlertCircle, Wifi, WifiOff, Sun, Moon, Activity, BarChart2 } from 'lucide-react';
import { useRefresh, useData } from './hooks/useRefresh';
import { useTheme } from './hooks/useTheme';
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
import { PredictiveAnalysis } from './components/PredictiveAnalysis';
import { computePositionPnL } from './utils/blackscholes';

const API = import.meta.env.VITE_API_URL || '/api';

// ─── Progress Overlay ─────────────────────────────────────────────────────────
function ProgressOverlay({ progress }) {
  if (!progress || progress.pct === 0 || progress.pct >= 100) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md"
        style={{ background: 'rgba(8,12,20,0.7)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="w-[calc(100%-2rem)] max-w-[420px] rounded-3xl p-8 text-center"
          style={{
            background: 'rgba(13,19,32,0.95)',
            border: '1px solid rgba(206,231,245,0.1)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 32px 80px rgba(0,0,0,0.7)',
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <RefreshCw size={20} className="text-neon-cyan animate-spin" />
              <div className="absolute inset-0 rounded-full bg-neon-cyan/20 blur-md" />
            </div>
            <span className="text-sm font-semibold text-white tracking-wide">Refreshing Market Data</span>
          </div>

          {/* Progress bar */}
          <div className="relative w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #0ea5e9, #5fd88f)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress.pct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>

          <div className="flex justify-between text-[11px] text-wcag-muted mb-5 font-data">
            <span>{progress.text || 'Processing…'}</span>
            <span className="font-bold text-neon-cyan">{progress.pct}%</span>
          </div>

          <div className="space-y-1">
            {[
              [10, 'Fetching NIFTY Spot'],
              [25, 'Fetching Option Chain'],
              [40, 'Calculating OI Walls & Max Pain'],
              [55, 'Fetching FII/DII'],
              [70, 'Fetching News & Macro'],
              [85, 'Calculating Sentiment & Elliott'],
              [100, 'Building Dashboard'],
            ].map(([threshold, label]) => (
              <div key={label} className={`flex items-center gap-2.5 text-[11px] py-0.5 transition-colors ${progress.pct >= threshold ? 'text-neon-green font-semibold' : 'text-white/20'}`}>
                <span className="w-4 text-center text-[10px]">{progress.pct >= threshold ? '✓' : '○'}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Section Divider ────────────────────────────────────────────────────────
function SectionDivider({ label, icon: Icon }) {
  return (
    <div className="section-label my-2">
      {Icon && <Icon size={11} className="shrink-0" />}
      <span>{label}</span>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ data, isRefreshing, progress, onRefresh }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="header-bar shrink-0 z-40 sticky top-0">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3 sm:gap-5">

        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl logo-badge flex items-center justify-center">
            <span className="text-sm font-black" style={{ background: 'linear-gradient(135deg, #0ea5e9, #5fd88f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>N</span>
          </div>
          <div className="hidden sm:flex flex-col justify-center">
            <div className="text-[15px] font-black tracking-tight leading-none mb-0.5">
              <span className="text-gray-900 dark:text-white">NIFTY</span>
              <span style={{ background: 'linear-gradient(90deg, #0ea5e9, #5fd88f)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PRO</span>
            </div>
            <div className="text-[9px] text-gray-500 dark:text-wcag-muted font-semibold tracking-[0.15em] uppercase">Terminal</div>
          </div>
        </div>

        {/* Spot ticker */}
        {data && (
          <div className="ml-0 sm:ml-2 min-w-0">
            <SpotTicker spot={data.spot} dailyChange={data.dailyChange} dailyChangePct={data.dailyChangePct} />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">

          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold mr-1">
            {data ? (
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                  <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-neon-green animate-live-ping" />
                </div>
                <span className="text-emerald-700 dark:text-neon-green/80 font-bold tracking-wide">LIVE</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                <span className="text-gray-500 dark:text-wcag-muted">OFFLINE</span>
              </div>
            )}
          </div>

          {/* Timestamp */}
          {data?.timestamp && (
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-wcag-muted font-data mr-1">
              <Clock size={11} />
              <span>{new Date(data.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl transition-all border text-gray-600 hover:text-gray-900 dark:text-wcag-muted dark:hover:text-white"
            style={{
              background: 'rgba(148,163,184,0.08)',
              borderColor: 'rgba(148,163,184,0.15)',
            }}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn-refresh flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40 transition-all"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{isRefreshing ? `${progress.pct}%` : 'Refresh'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Animated Section ─────────────────────────────────────────────────────────
function FadeSection({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
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
    <div className="min-h-screen flex flex-col bg-[#F0F4F8] text-[#0F172A] dark:bg-[#080C14] dark:text-white font-sans transition-colors duration-300">
      <ProgressOverlay progress={isRefreshing ? progress : null} />
      <Header data={data} isRefreshing={isRefreshing} progress={progress} onRefresh={startRefresh} />

      <main className="flex-1 w-full max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-5 lg:gap-7">

        {/* ─── Empty State ─── */}
        {!loading && !data && (
          <FadeSection>
            <div className="flex-1 flex flex-col items-center justify-center glass-card p-12 mt-10">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 logo-badge">
                <Activity size={32} className="text-sky-500" />
              </div>
              <p className="text-gray-900 dark:text-white text-xl font-bold mb-2">Intelligence Terminal</p>
              <p className="text-gray-500 dark:text-wcag-muted text-sm mb-8 max-w-sm text-center leading-relaxed">
                Load live market data to populate the dashboard with real-time analytics.
              </p>
              <button
                onClick={startRefresh}
                className="btn-refresh flex items-center gap-2.5 px-8 py-3 rounded-xl font-bold text-white"
              >
                <RefreshCw size={17} /> Initialize Terminal
              </button>
            </div>
          </FadeSection>
        )}

        {/* ─── Loading skeleton ─── */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card p-6 h-64 animate-pulse flex flex-col justify-between">
                <div className="h-4 bg-gray-200 dark:bg-white/5 rounded-lg w-1/3 mb-4" />
                <div className="space-y-3">
                  <div className="h-2.5 bg-gray-100 dark:bg-white/[0.03] rounded w-full" />
                  <div className="h-2.5 bg-gray-100 dark:bg-white/[0.03] rounded w-5/6" />
                  <div className="h-2.5 bg-gray-100 dark:bg-white/[0.03] rounded w-4/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Dashboard ─── */}
        {data && (
          <div className="flex flex-col gap-5 lg:gap-7 pb-12 w-full">

            {/* Alerts */}
            {(error || data._stale) && (
              <FadeSection>
                <div className="w-full flex flex-col sm:flex-row gap-3">
                  {error && (
                    <div className="flex-1 text-sm text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl px-5 py-3 flex items-center gap-2 font-semibold">
                      <AlertCircle size={15} className="shrink-0" /> {error}
                    </div>
                  )}
                  {data._stale && (
                    <div className="flex-1 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl px-5 py-3 flex items-center gap-2 font-semibold">
                      <AlertCircle size={15} className="shrink-0" />
                      <span className="truncate">Stale data ({data._stale.sections.join(', ')}). Refresh to update.</span>
                    </div>
                  )}
                </div>
              </FadeSection>
            )}

            {/* ── Market Metrics ── */}
            <FadeSection delay={0.0}>
              <SectionDivider label="Market Overview" icon={Activity} />
              <div className="mt-3 glass-card card-accent-cyan">
                <MetricsGrid data={data} />
              </div>
            </FadeSection>

            {/* ── Price Chart ── */}
            <FadeSection delay={0.06}>
              <SectionDivider label="Price Analysis" icon={Activity} />
              <div className="mt-3 glass-card card-accent-cyan flex flex-col overflow-hidden min-h-[450px] lg:min-h-[550px]">
                <div className="p-4 sm:p-6 flex-1 flex flex-col">
                  <div className="mb-4 flex items-center gap-2">
                    <Activity size={16} className="text-sky-500 dark:text-neon-cyan" />
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Price Chart Analysis</h2>
                  </div>
                  <div className="flex-1 min-h-[350px] lg:min-h-[450px]">
                    <PriceChart historyBars={data.historyBars} spot={data.spot} dailyChange={data.dailyChange} dailyChangePct={data.dailyChangePct} />
                  </div>
                </div>
              </div>
            </FadeSection>

            {/* ── OI Chart ── */}
            <FadeSection delay={0.10}>
              <SectionDivider label="Options Intelligence" icon={BarChart2} />
              <div className="mt-3 glass-card card-accent-green flex flex-col overflow-hidden min-h-[500px] lg:min-h-[600px]">
                <div className="p-4 sm:p-6 flex-1 flex flex-col">
                  <div className="mb-4 flex items-center gap-2">
                    <BarChart2 size={16} className="text-emerald-500 dark:text-neon-green" />
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">Options Chain Intelligence</h2>
                  </div>
                  <div className="flex-1 min-h-[400px] lg:min-h-[500px]">
                    <OIChart chain={data.chain} spot={data.spot} maxPain={data.maxPain} callWall={data.callWall} putWall={data.putWall} totalCEOI={data.totalCEOI} totalPEOI={data.totalPEOI} netOIChange={data.netOIChange} chainSource={data.chainSource} />
                  </div>
                </div>
              </div>
            </FadeSection>

            {/* ── News & Macro ── */}
            <FadeSection delay={0.14}>
              <SectionDivider label="News & Macro" />
              <div className="mt-3 grid grid-cols-1 xl:grid-cols-2 gap-5 lg:gap-7">
                <div className="glass-card card-accent-cyan p-4 sm:p-6 flex flex-col overflow-hidden min-h-[450px]">
                  <NewsSection news={data.news} />
                </div>
                <div className="glass-card card-accent-amber p-4 sm:p-6 flex flex-col overflow-hidden min-h-[450px]">
                  <MacroPrices macroPrices={data.macroPrices} />
                </div>
              </div>
            </FadeSection>

            {/* ── Analytics Grid ── */}
            <FadeSection delay={0.18}>
              <SectionDivider label="Advanced Analytics" />
              <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 lg:gap-7">
                <div className="glass-card card-accent-cyan p-4 sm:p-6 min-h-[350px]">
                  <Sentiment data={data} />
                </div>
                <div className="glass-card card-accent-amber p-4 sm:p-6 min-h-[350px]">
                  <SupportResistance support={data.support} resistance={data.resistance} pivots={data.pivots} gex={data.gex} spot={data.spot} />
                </div>
                <div className="glass-card card-accent-purple p-4 sm:p-6 min-h-[350px]">
                  <ElliottWave elliottWave={data.elliottWave} neoWave={data.neoWave} spot={data.spot} />
                </div>
              </div>
            </FadeSection>

            {/* ── Predictive Core ── */}
            <FadeSection delay={0.22}>
              <SectionDivider label="AI Predictive Engine" />
              <div className="mt-3">
                <PredictiveAnalysis predictions={data.predictions} spot={data.spot} />
              </div>
            </FadeSection>

            {/* ── Trade Setups & Positions ── */}
            <FadeSection delay={0.26}>
              <SectionDivider label="Trade Setups & Positions" />
              <div className="mt-3 flex flex-col gap-5 lg:gap-7">
                <TradeRadar setups={data.tradeSetups} />
                <Positions pnlData={pnlData} onRefreshPositions={loadPnL} />
              </div>
            </FadeSection>

          </div>
        )}
      </main>
    </div>
  );
}
