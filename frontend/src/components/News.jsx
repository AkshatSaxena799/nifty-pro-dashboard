// FIX #2: Strict date-based filtering — never show old/stale news
import { useState, useMemo } from 'react';
import { ExternalLink, TrendingUp, TrendingDown, Minus, Calendar, Newspaper } from 'lucide-react';
import { InfoTooltip } from '../utils/tooltips.jsx';

const sentimentIcon = (s) => {
  if (!s) return <Minus size={12} className="text-gray-400" />;
  if (s === 'Bullish') return <TrendingUp size={12} className="text-neon-green" />;
  if (s === 'Bearish') return <TrendingDown size={12} className="text-neon-red" />;
  return <Minus size={12} className="text-yellow-400" />;
};

const sentimentCls = {
  Bullish: 'bg-neon-green/5 text-neon-green/80 border-neon-green/15',
  Bearish: 'bg-neon-red/5 text-neon-red/80 border-neon-red/15',
  Neutral: 'bg-gray-800/25 text-gray-300 border-white/[0.06]',
};

const TABS = [
  { key: 'daily',     label: 'Daily',     icon: '📅', desc: 'Intraday & breaking news' },
  { key: 'weekly',    label: 'Weekly',    icon: '📆', desc: 'This week\'s developments' },
  { key: 'monthly',   label: 'Monthly',   icon: '🗓️', desc: 'Policy & data releases' },
  { key: 'quarterly', label: 'Quarterly', icon: '📊', desc: 'Structural & geopolitical' },
];

function NewsCard({ item }) {
  const cls = sentimentCls[item.sentiment] || sentimentCls.Neutral;
  const dateStr = item.pubDate
    ? new Date(item.pubDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  // Strip any stray ]] from title/summary
  const title = (item.title || '').replace(/\]\]+$/g, '').trim();
  const summary = (item.summary || '').replace(/\]\]+$/g, '').trim();
  const sources = item.sources || [{ name: item.source, link: item.link }];
  return (
    <div className={`rounded-xl border p-3 transition-colors ${cls}`}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">{sentimentIcon(item.sentiment)}</span>
        <div className="flex-1 min-w-0">
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium leading-snug hover:underline flex items-start gap-1 group"
          >
            <span className="line-clamp-2">{title}</span>
            <ExternalLink size={10} className="shrink-0 mt-0.5 opacity-40 group-hover:opacity-100" />
          </a>
          {summary && (
            <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{summary}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {sources.map((s, i) => (
              <a key={i} href={s.link} target="_blank" rel="noopener noreferrer"
                className="text-[10px] font-medium text-gray-500 hover:text-blue-400 transition-colors">
                {s.name}
              </a>
            ))}
            {item.confidence > 1 && (
              <span className="text-[10px] text-blue-400 px-1.5 py-0.5 rounded-full bg-blue-900/30">
                ✓ {item.confidence} sources
              </span>
            )}
            {item.sentiment && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                item.sentiment === 'Bullish' ? 'bg-neon-green/15 text-neon-green' :
                item.sentiment === 'Bearish' ? 'bg-neon-red/15 text-neon-red' :
                'bg-yellow-900/30 text-yellow-500'}`}>
                {item.sentiment}
              </span>
            )}
            {item.impact && (
              <span className={`text-[10px] ${item.impact === 'Direct' ? 'text-blue-400' : 'text-purple-400'}`}>
                {item.impact} Impact
              </span>
            )}
            {dateStr && (
              <span className="text-[10px] text-gray-600 flex items-center gap-0.5">
                <Calendar size={9} />{dateStr}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NewsSection({ news }) {
  const [activeTab, setActiveTab] = useState('daily');

  if (!news || news.length === 0) {
    return (
      <div className="glass-card p-5">
        <h2 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
          <Newspaper size={13} className="text-neon-cyan" /> Market News <InfoTooltip metric="News Sentiment" />
        </h2>
        <p className="text-gray-600 text-xs text-center py-6">Click Refresh to load latest headlines.</p>
      </div>
    );
  }

  // FIX #2: Strict date-based filtering — reject any news older than the tab cutoff
  const MAX_AGE = { daily: 2, weekly: 7, monthly: 30, quarterly: 90 };

  const tabItems = useMemo(() => {
    const maxDays = MAX_AGE[activeTab] || 90;
    const cutoff = Date.now() - maxDays * 86400000;

    return (news || [])
      .filter(item => {
        // Primary filter: timeframe must match the selected tab
        if (item.timeframe && item.timeframe !== activeTab) return false;
        // Date guard: reject stale items
        if (item.pubDate) {
          try {
            const pubTime = new Date(item.pubDate).getTime();
            if (isNaN(pubTime)) return false;
            return pubTime >= cutoff;
          } catch { return false; }
        }
        if (item.daysAgo != null) return item.daysAgo <= maxDays;
        return false;
      })
      .sort((a, b) => {
        const tA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
        const tB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
        return tB - tA; // newest first
      });
  }, [news, activeTab]);

  // Tab counts: timeframe match + date guard
  const getTabCount = (tabKey) => {
    const maxDays = MAX_AGE[tabKey] || 90;
    const cutoff = Date.now() - maxDays * 86400000;
    return (news || []).filter(item => {
      if (item.timeframe && item.timeframe !== tabKey) return false;
      if (item.pubDate) {
        try { return new Date(item.pubDate).getTime() >= cutoff; } catch { return false; }
      }
      return (item.daysAgo ?? Infinity) <= maxDays;
    }).length;
  };

  const bullCount = tabItems.filter((n) => n.sentiment === 'Bullish').length;
  const bearCount = tabItems.filter((n) => n.sentiment === 'Bearish').length;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-400 flex items-center gap-2 uppercase tracking-wider">
          <Newspaper size={13} className="text-neon-cyan" /> Market News
          <InfoTooltip metric="News Sentiment" />
        </h2>
        <span className="flex gap-2 text-[10px] font-mono">
          <span className="text-neon-green">{bullCount} bull</span>
          <span className="text-neon-red">{bearCount} bear</span>
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-3 overflow-x-auto">
        {TABS.map((t) => {
          const cnt = getTabCount(t.key);
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === t.key
                  ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/20'
                  : 'bg-black/20 text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <span>{t.label}</span>
              <span className="text-[10px] font-mono opacity-60">({cnt})</span>
            </button>
          );
        })}
      </div>

      <p className="text-gray-700 text-[10px] mb-3">
        ET · MC · Reuters · Livemint · Business Line · Business Standard · CNBC TV18
      </p>

      {tabItems.length === 0 ? (
        <p className="text-gray-600 text-xs text-center py-6">No {activeTab} news available. Try a different tab.</p>
      ) : (
        <div className="space-y-2.5 max-h-[360px] sm:max-h-[440px] lg:max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
          {tabItems.map((item, i) => (
            <NewsCard key={i} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
