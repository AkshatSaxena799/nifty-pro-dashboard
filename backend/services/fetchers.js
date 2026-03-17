/**
 * fetchers.js
 * ===========
 * All data-fetching logic. Pure Node.js — no Python.
 * Sources: NSE India, Yahoo Finance (unofficial JSON), RSS feeds.
 *
 * // UPDATED FOR REFINEMENT #1-8 — March 2026
 * Changes:
 *   - Cheerio added for HTML scraping fallback
 *   - FII/DII: forced fresh session + cheerio table fallback
 *   - Synthetic chain: asymmetric CE/PE OI (realistic)
 *   - Call/Put wall: filtered to nearest expiry only
 *   - NSE cookie warm-up with delay + retry
 */

const axios = require('axios');
const cheerio = require('cheerio');
const {
  calcRSI, calcMACD, calcADX, calcSMA, calcEMA, calcBollinger, calcPivots,
  detectElliottWave, calcGEX, calcMaxPain, calcPCR, calcIVPercentile,
  calcSentiment, generateTradeSetups, bsPrice,
} = require('../utils/calculations');

// ─── NSE Cookie Session ───────────────────────────────────────────────────────

const NSE_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

let _nseCookies = '';
let _cookieExpiry = 0;

// UPDATED FOR REFINEMENT #1 — warm NSE session with sequential page visits + delay
async function getNSECookies(forceRefresh = false) {
  if (!forceRefresh && Date.now() < _cookieExpiry) return _nseCookies;
  try {
    // Step 1: Hit homepage
    const r1 = await axios.get('https://www.nseindia.com', {
      headers: {
        'User-Agent': NSE_UA,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000,
    });
    const cookies1 = (r1.headers['set-cookie'] || []).join('; ');

    // Step 2: brief pause then hit a known page to deepen session
    await new Promise((res) => setTimeout(res, 800));
    const r2 = await axios.get('https://www.nseindia.com/market-data/live-equity-market', {
      headers: {
        'User-Agent': NSE_UA,
        'Accept': 'text/html,application/xhtml+xml',
        'Referer': 'https://www.nseindia.com/',
        'Cookie': cookies1,
      },
      timeout: 15000,
    });
    const cookies2 = (r2.headers['set-cookie'] || []).join('; ');
    // Merge cookies (later ones may override)
    const allCookies = [cookies1, cookies2].filter(Boolean).join('; ');
    _nseCookies = allCookies;
    _cookieExpiry = Date.now() + 8 * 60 * 1000; // 8 min
    return _nseCookies;
  } catch (e) {
    console.warn('[NSE] Cookie warm-up failed:', e.message);
    return _nseCookies || '';
  }
}

async function nseGet(path, params = {}) {
  const cookies = await getNSECookies();
  const r = await axios.get(`https://www.nseindia.com${path}`, {
    params,
    headers: {
      'User-Agent': NSE_UA,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.nseindia.com/',
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': cookies,
    },
    timeout: 20000,
  });
  return r.data;
}

// ─── Yahoo Finance OHLCV ──────────────────────────────────────────────────────

async function fetchYahooOHLCV(ticker, range = '2y', interval = '1d') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`;
  const r = await axios.get(url, {
    params: { range, interval, includePrePost: false },
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 15000,
  });
  const res = r.data.chart?.result?.[0];
  if (!res) throw new Error(`No data from Yahoo for ${ticker}`);
  const timestamps = res.timestamp;
  const q = res.indicators.quote[0];
  return timestamps.map((t, i) => ({
    date: new Date(t * 1000).toISOString().slice(0, 10),
    open: q.open[i], high: q.high[i], low: q.low[i],
    close: q.close[i], volume: q.volume[i],
  })).filter((d) => d.close != null);
}

async function fetchNIFTYHistory() {
  const bars = await fetchYahooOHLCV('^NSEI', '2y', '1d');
  return bars;
}

async function fetchNIFTYWeekly() {
  const bars = await fetchYahooOHLCV('^NSEI', '5y', '1wk');
  return bars;
}

// UPDATED FOR FIX #6 — add IST timestamp to each macro item
async function fetchMacroPrice(ticker, label) {
  try {
    const bars = await fetchYahooOHLCV(ticker, '5d', '1d');
    if (bars.length < 2) return { label, price: null, change: null, changePct: null, timestamp: null };
    const last = bars[bars.length - 1];
    const prev = bars[bars.length - 2];
    const change = last.close - prev.close;
    // Format IST timestamp
    const nowIST = new Date(Date.now() + 5.5 * 3600000);
    const istHHMM = nowIST.toISOString().slice(11, 16);
    const [ly, lm, ld] = last.date.split('-');
    const timestamp = `${ld}-${lm}-${ly} ${istHHMM} IST`;
    return {
      label,
      ticker,
      price: last.close,
      change: parseFloat(change.toFixed(2)),
      changePct: parseFloat(((change / prev.close) * 100).toFixed(2)),
      date: last.date,
      timestamp,
    };
  } catch {
    return { label, ticker, price: null, change: null, changePct: null, timestamp: null };
  }
}

// ─── India VIX ────────────────────────────────────────────────────────────────

async function fetchIndiaVIX() {
  try {
    const data = await nseGet('/api/allIndices');
    const vixItem = (data.data || []).find((d) => d.index && d.index.toUpperCase().includes('VIX'));
    if (vixItem) return parseFloat(vixItem.last || vixItem.lastPrice || 0);
  } catch {}
  try {
    const bars = await fetchYahooOHLCV('^INDIAVIX', '5d', '1d');
    return bars[bars.length - 1]?.close || 0;
  } catch {}
  return 0;
}

// ─── Options Chain ────────────────────────────────────────────────────────────

async function fetchOptionsChain(symbol = 'NIFTY') {
  try {
    const data = await nseGet('/api/option-chain-indices', { symbol });
    const underlying = data?.records?.underlyingValue || 0;
    const rawData = data?.records?.data || [];
    const rows = [];
    for (const row of rawData) {
      const strike = row.strikePrice;
      const expiry = row.expiryDate;
      const ce = row.CE || {};
      const pe = row.PE || {};
      rows.push({
        strike, expiry, underlying,
        CE_OI: ce.openInterest || 0,
        CE_chgOI: ce.changeinOpenInterest || 0,
        CE_LTP: ce.lastPrice || 0,
        CE_IV: ce.impliedVolatility || 0,
        CE_volume: ce.totalTradedVolume || 0,
        PE_OI: pe.openInterest || 0,
        PE_chgOI: pe.changeinOpenInterest || 0,
        PE_LTP: pe.lastPrice || 0,
        PE_IV: pe.impliedVolatility || 0,
        PE_volume: pe.totalTradedVolume || 0,
      });
    }
    if (rows.length > 0) return { chain: rows, spot: underlying };
  } catch (e) {
    console.warn('NSE options chain failed, generating synthetic:', e.message);
  }
  return generateSyntheticChain(symbol);
}

// UPDATED FOR REFINEMENT #1 — realistic asymmetric CE/PE OI (no more identical values)
function generateSyntheticChain(symbol, spot = 23500, vix = 18) {
  const step = 50;
  const lo = Math.round(spot * 0.87 / step) * step;
  const hi = Math.round(spot * 1.13 / step) * step;
  const r = 0.065;
  const sigma = vix / 100;
  const today = Date.now();
  const expiries = [7, 28, 56].map((d) => new Date(today + d * 86400000).toISOString().slice(0, 10));
  const rows = [];
  for (const expStr of expiries) {
    const T = Math.max((new Date(expStr) - today) / (365 * 86400000), 0.01);
    for (let K = lo; K <= hi; K += step) {
      const m = K / spot; // moneyness
      const ceIV = sigma * (1 + 0.05 * (m - 1));
      const peIV = sigma * (1 + 0.2 * (1 - m));
      const ceG = bsPrice(spot, K, T, r, ceIV, 'C');
      const peG = bsPrice(spot, K, T, r, peIV, 'P');

      // Base OI bell-curve (highest near ATM)
      const baseOI = Math.max(0, (1 - Math.abs(m - 1) * 6)) * 100000;

      // CE OI: peaks on OTM calls (above spot) — writers build call walls above
      // PE OI: peaks on OTM puts (below spot) — hedgers buy protective puts
      const ceMoneyBias = m > 1.0 ? 1.2 : m > 0.99 ? 0.85 : 0.55; // OTM calls have more OI
      const peMoneyBias = m < 1.0 ? 1.2 : m < 1.01 ? 0.85 : 0.55; // OTM puts have more OI
      // Add expiry-dependent noise
      const noise = () => 0.85 + Math.random() * 0.3;
      const ceOI = Math.round(baseOI * ceMoneyBias * noise());
      const peOI = Math.round(baseOI * peMoneyBias * noise());

      rows.push({
        strike: K, expiry: expStr, underlying: spot,
        CE_OI: ceOI, CE_chgOI: Math.round(ceOI * 0.04 * (Math.random() - 0.3)),
        CE_LTP: parseFloat(ceG.price.toFixed(2)), CE_IV: parseFloat((ceIV * 100).toFixed(2)),
        CE_volume: Math.round(ceOI / 12),
        PE_OI: peOI, PE_chgOI: Math.round(peOI * 0.04 * (Math.random() - 0.3)),
        PE_LTP: parseFloat(peG.price.toFixed(2)), PE_IV: parseFloat((peIV * 100).toFixed(2)),
        PE_volume: Math.round(peOI / 12),
      });
    }
  }
  return { chain: rows, spot };
}

// ─── FII / DII ─────────────────────────────────────────────────────────────────
// UPDATED FOR REFINEMENT #3 — force fresh session + cheerio HTML fallback
// Values from NSE are in ₹ Crores; returned as-is (crores numbers)
async function fetchFIIDII() {
  // Always force-refresh cookies before FII/DII to maximise session freshness
  await getNSECookies(true);
  await new Promise((r) => setTimeout(r, 600));

  const normalize = (v) => {
    if (typeof v === 'number' && !isNaN(v)) return v;
    if (!v) return 0;
    return parseFloat(String(v).replace(/[,₹\s()]/g, '')) || 0;
  };

  const findRow = (arr, keywords) => arr.find((row) => {
    const cat = String(
      row.category || row.Category || row.type || row.Type ||
      row.name || row.Name || row.participant || ''
    ).toUpperCase();
    return keywords.some((k) => cat.includes(k));
  });

  const parseRow = (row) => {
    if (!row) return { buy: 0, sell: 0, net: 0 };
    let buy = 0, sell = 0, net = 0;
    for (const [k, v] of Object.entries(row)) {
      const kl = k.toLowerCase();
      if (kl.includes('buy') || kl.includes('purchase')) buy = normalize(v);
      else if (kl.includes('sell') || kl.includes('sale')) sell = normalize(v);
      else if (kl.includes('net')) net = normalize(v);
    }
    if (net === 0 && (buy !== 0 || sell !== 0)) net = buy - sell;
    return { buy: parseFloat(buy.toFixed(2)), sell: parseFloat(sell.toFixed(2)), net: parseFloat(net.toFixed(2)) };
  };

  const extractDate = (row) => {
    const raw = row?.date || row?.tradeDate || row?.Date || row?.dateString || '';
    if (!raw) {
      const now = new Date();
      return `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    }
    return raw;
  };

  // Strategy 1 & 2: NSE JSON API endpoints
  const endpoints = ['/api/fiidiiTradeReact', '/api/fiiDiiData', '/api/fii-dii-trade'];
  for (const ep of endpoints) {
    try {
      const raw = await nseGet(ep);
      const rows = Array.isArray(raw) ? raw : (raw?.data || []);
      if (!Array.isArray(rows) || rows.length < 2) continue;

      // Find the MOST RECENT date row(s)
      const latestDate = rows.reduce((best, r) => {
        const d = r.date || r.tradeDate || r.Date || '';
        return d > best ? d : best;
      }, '');
      const latestRows = latestDate
        ? rows.filter((r) => (r.date || r.tradeDate || r.Date || '') === latestDate)
        : rows;

      const fiiRow = findRow(latestRows, ['FII', 'FPI', 'FOREIGN', 'FOREIGN PORTFOLIO']);
      const diiRow = findRow(latestRows, ['DII', 'DOMESTIC', 'MUTUAL', 'MF', 'DOMESTIC INSTITUTIONAL']);

      if (!fiiRow && !diiRow) continue;

      const fii = parseRow(fiiRow);
      const dii = parseRow(diiRow);
      if (fii.buy === 0 && fii.sell === 0 && dii.buy === 0 && dii.sell === 0) continue;

      const dataDate = extractDate(fiiRow || diiRow || rows[0]);
      console.log(`[FII/DII] Got data from ${ep} — date: ${dataDate}, FII net: ${fii.net} Cr`);
      return { fii, dii, combined_net: parseFloat((fii.net + dii.net).toFixed(2)), dataDate };
    } catch (e) {
      console.warn(`[FII/DII] Endpoint ${ep} failed:`, e.message);
    }
  }

  // Strategy 3: Cheerio scrape of NSE reports page (looks for embedded JSON or HTML table)
  try {
    const cookies = await getNSECookies();
    const r = await axios.get('https://www.nseindia.com/reports/fii-dii', {
      headers: {
        'User-Agent': NSE_UA,
        'Accept': 'text/html,application/xhtml+xml',
        'Referer': 'https://www.nseindia.com/',
        'Cookie': cookies,
      },
      timeout: 20000,
    });
    const $ = cheerio.load(r.data);

    // Try embedded Next.js __NEXT_DATA__ JSON
    const nextDataStr = $('script#__NEXT_DATA__').html() || '';
    if (nextDataStr.length > 100) {
      const nextData = JSON.parse(nextDataStr);
      const pageArr =
        nextData?.props?.pageProps?.fiiDiiData ||
        nextData?.props?.pageProps?.data ||
        nextData?.props?.initialState?.fiiDii || [];
      if (Array.isArray(pageArr) && pageArr.length >= 2) {
        const fiiRow = findRow(pageArr, ['FII', 'FPI', 'FOREIGN']);
        const diiRow = findRow(pageArr, ['DII', 'DOMESTIC', 'MUTUAL']);
        const fii = parseRow(fiiRow);
        const dii = parseRow(diiRow);
        if (fii.buy !== 0 || dii.buy !== 0) {
          const dataDate = extractDate(fiiRow || diiRow || {});
          console.log('[FII/DII] Got data from cheerio __NEXT_DATA__');
          return { fii, dii, combined_net: parseFloat((fii.net + dii.net).toFixed(2)), dataDate };
        }
      }
    }

    // Try HTML table scraping
    const tableRows = [];
    $('table tbody tr').each((_, tr) => {
      const cells = $(tr).find('td').map((__, td) => $(td).text().trim()).get();
      if (cells.length >= 4) tableRows.push(cells);
    });
    if (tableRows.length >= 2) {
      // Expected columns: Date / Category / Buy / Sell / Net (order may vary)
      const parseCellRow = (cells) => {
        const buy = normalize(cells[2] || cells[1] || '0');
        const sell = normalize(cells[3] || cells[2] || '0');
        const net = normalize(cells[4] || '0') || buy - sell;
        return { buy: parseFloat(buy.toFixed(2)), sell: parseFloat(sell.toFixed(2)), net: parseFloat(net.toFixed(2)) };
      };
      const fiiCells = tableRows.find((c) => ['FII', 'FPI'].some((k) => String(c[1] || c[0]).toUpperCase().includes(k)));
      const diiCells = tableRows.find((c) => ['DII', 'DOMESTIC'].some((k) => String(c[1] || c[0]).toUpperCase().includes(k)));
      if (fiiCells || diiCells) {
        const fii = parseCellRow(fiiCells || ['', '', '0', '0', '0']);
        const dii = parseCellRow(diiCells || ['', '', '0', '0', '0']);
        const dataDate = (fiiCells || diiCells)?.[0] || '';
        console.log('[FII/DII] Got data from cheerio HTML table');
        return { fii, dii, combined_net: parseFloat((fii.net + dii.net).toFixed(2)), dataDate };
      }
    }
  } catch (e) {
    console.warn('[FII/DII] Cheerio scrape failed:', e.message);
  }

  console.warn('[FII/DII] All strategies failed — returning empty');
  return _emptyFII();
}

function _emptyFII() {
  return { fii: { buy: 0, sell: 0, net: 0 }, dii: { buy: 0, sell: 0, net: 0 }, combined_net: 0, dataDate: null };
}

// ─── News (RSS multi-source) ──────────────────────────────────────────────────

async function fetchNews() {
  const feeds = [
    { name: 'Economic Times', url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms' },
    { name: 'Moneycontrol', url: 'https://www.moneycontrol.com/rss/MCtopnews.xml' },
    { name: 'Business Line', url: 'https://www.thehindubusinessline.com/markets/?service=rss' },
    { name: 'Reuters', url: 'https://feeds.reuters.com/reuters/INbusinessNews' },
    { name: 'Livemint', url: 'https://www.livemint.com/rss/markets' },
    { name: 'Business Standard', url: 'https://www.business-standard.com/rss/markets-106.rss' },
    { name: 'CNBC TV18', url: 'https://www.cnbctv18.com/commonfeeds/v1/cne/rss/market.xml' },
    { name: 'NDTV Profit', url: 'https://www.ndtvprofit.com/rss/latest' },
    { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/news/rssindex' },
  ];

  const MARKET_KW = [
    'nifty', 'sensex', 'stock market', 'fii', 'dii', 'rbi', 'fed', 'inflation',
    'gdp', 'earnings', 'rates', 'war', 'geopolit', 'crude', 'oil', 'rupee', 'dollar',
    'trade', 'tariff', 'budget', 'fiscal', 'repo', 'semiconductor', 'tech', 'rally',
    'selloff', 'correction', 'bull', 'bear', 'index', 'bond', 'yield', 'recession',
    'stimulus', 'monetary', 'policy', 'sanction', 'bank', 'import', 'export',
    'manufacturing', 'pmi', 'unemployment', 'opec', 'china', 'economy',
    'ipo', 'buyback', 'dividend', 'merger', 'acquisition', 'fdi', 'forex',
    'market', 'investing', 'share', 'equity', 'debt', 'fund',
  ];

  // Timeframe classification — longest impact first
  const TF_QUARTERLY_KW = [
    'geopolit', 'trade war', 'tariff war', 'election', 'reform', 'structural',
    'sanction', 'budget 202', 'fiscal year', 'foreign policy', 'global recession',
    'trade deal', 'emerging market', 'banking crisis', 'sovereign', 'climate',
    'regulation', 'imf', 'world bank', 'g20', 'g7', 'opec+', 'brics',
    'supply chain', 'energy transition', 'ai regulation', 'nato',
    'trade tension', 'cold war', 'debt crisis', 'default risk',
  ];
  const TF_MONTHLY_KW = [
    'rbi policy', 'rbi governor', 'monetary policy', 'rate cut', 'rate hike',
    'rate decision', 'inflation data', 'cpi', 'wpi', 'gdp', 'pmi data', 'iip',
    'earnings season', 'quarterly result', 'quarterly earning',
    'trade deficit', 'current account', 'fiscal deficit', 'fed meeting',
    'fomc', 'ecb meeting', 'boj', 'central bank', 'repo rate', 'reverse repo',
    'fdi data', 'forex reserve', 'balance of payment', 'credit policy',
  ];
  const TF_WEEKLY_KW = [
    'fii net', 'fii bought', 'fii sold', 'dii net', 'dii bought', 'dii sold',
    'sector rotation', 'weekly expir', 'weekly wrap', 'crude oil', 'brent',
    'gold price', 'silver price', 'bond yield', 'us treasury', 'dollar index',
    'employment data', 'jobless claim', 'non-farm', 'technical outlook',
    'market outlook', 'week ahead', 'weekly review',
  ];
  const TF_BROAD_MONTHLY = ['inflation', 'earnings', 'rbi', 'fed', 'policy', 'deficit', 'gdp', 'growth'];
  const TF_BROAD_WEEKLY = ['crude', 'oil', 'gold', 'fii', 'dii', 'sector', 'yield', 'rupee'];

  function classifyTimeframe(text) {
    const t = text.toLowerCase();
    if (TF_QUARTERLY_KW.some((k) => t.includes(k))) return 'quarterly';
    if (TF_MONTHLY_KW.some((k) => t.includes(k))) return 'monthly';
    if (TF_WEEKLY_KW.some((k) => t.includes(k))) return 'weekly';
    if (TF_BROAD_MONTHLY.some((k) => t.includes(k))) return 'monthly';
    if (TF_BROAD_WEEKLY.some((k) => t.includes(k))) return 'weekly';
    return 'daily';
  }

  // Clean CDATA wrappers and stray ]] artifacts
  function cleanCDATA(str) {
    if (!str) return '';
    return str.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').replace(/\]\]+$/g, '').trim();
  }

  const allItems = [];
  await Promise.allSettled(
    feeds.map(async ({ name, url }) => {
      try {
        const r = await axios.get(url, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        const xml = r.data;
        const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
        for (const item of items.slice(0, 15)) {
          const title = cleanCDATA((item.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
          const link = cleanCDATA(
            (item.match(/<link>([\s\S]*?)<\/link>/) || [])[1] ||
            (item.match(/<guid(?:[^>]*)>([\s\S]*?)<\/guid>/) || [])[1] || ''
          );
          const desc = cleanCDATA((item.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || '');
          const pubDate = cleanCDATA((item.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '');
          const cleanDesc = desc.replace(/<[^>]+>/g, '').trim().slice(0, 200);
          const text = (title + ' ' + cleanDesc).toLowerCase();
          const isRelevant = MARKET_KW.some((kw) => text.includes(kw));
          if (isRelevant && title && link.startsWith('http')) {
            allItems.push({ title, link, summary: cleanDesc, source: name, pubDate });
          }
        }
      } catch (e) {
        console.warn(`News feed failed [${name}]:`, e.message);
      }
    })
  );

  // Deduplicate & merge sources (Jaccard word overlap)
  const merged = [];
  for (const item of allItems) {
    const words = new Set(item.title.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
    const existing = merged.find((u) => {
      const uWords = new Set(u.title.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
      const intersection = [...words].filter((w) => uWords.has(w)).length;
      return intersection / Math.max(words.size, uWords.size) > 0.5;
    });
    if (existing) {
      if (!existing.sources.some((s) => s.name === item.source)) {
        existing.sources.push({ name: item.source, link: item.link });
        existing.confidence++;
      }
    } else {
      merged.push({
        ...item,
        sources: [{ name: item.source, link: item.link }],
        confidence: 1,
      });
    }
  }

  // Sentiment tagging + timeframe classification
  const BULLISH_KW = ['buying', 'rally', 'gains', 'rise', 'positive', 'stimulus', 'rate cut', 'growth', 'strong', 'surge', 'upgrade', 'bullish', 'record high', 'boom'];
  const BEARISH_KW = ['selling', 'fall', 'drop', 'crash', 'negative', 'hawkish', 'war', 'sanction', 'inflation', 'hike', 'recession', 'decline', 'plunge', 'bearish', 'downgrade', 'crisis'];

  const nowTs = Date.now();
  const classified = merged.map((item) => {
    const text = (item.title + ' ' + (item.summary || '')).toLowerCase();
    const bullScore = BULLISH_KW.filter((k) => text.includes(k)).length;
    const bearScore = BEARISH_KW.filter((k) => text.includes(k)).length;
    const sentiment = bullScore > bearScore ? 'Bullish' : bearScore > bullScore ? 'Bearish' : 'Neutral';
    const impact = text.includes('nifty') || text.includes('sensex') || text.includes('index') ? 'Direct' : 'Macro';
    const timeframe = classifyTimeframe(text);
    let daysAgo = 0;
    try { daysAgo = Math.max(0, Math.floor((nowTs - new Date(item.pubDate).getTime()) / 86400000)); } catch {}
    return { ...item, sentiment, impact, timeframe, daysAgo };
  });

  // Sort: multi-source first, then recency
  classified.sort((a, b) => b.confidence - a.confidence || a.daysAgo - b.daysAgo);

  // Strict date gate: reject items older than their timeframe window or missing pubDate
  const maxAgeDays = { quarterly: 90, monthly: 30, weekly: 7, daily: 2 };
  const fresh = classified.filter(item => {
    if (!item.pubDate) return false;
    const maxAge = maxAgeDays[item.timeframe] || 90;
    return item.daysAgo <= maxAge;
  });

  // Per-timeframe caps: quarterly > monthly > weekly > daily
  const caps = { quarterly: 25, monthly: 18, weekly: 12, daily: 8 };
  const result = [];
  const counts = { quarterly: 0, monthly: 0, weekly: 0, daily: 0 };
  for (const item of fresh) {
    if (counts[item.timeframe] < caps[item.timeframe]) {
      result.push(item);
      counts[item.timeframe]++;
    }
  }
  console.log(`[News] Fetched ${allItems.length} raw, ${merged.length} merged, ${result.length} final — D:${counts.daily} W:${counts.weekly} M:${counts.monthly} Q:${counts.quarterly}`);
  return result;
}

// ─── Macro Prices ─────────────────────────────────────────────────────────────
// UPDATED FOR FIX #6 — separate Brent (BZ=F) + WTI (CL=F), timestamps
async function fetchMacroPrices() {
  const macros = [
    { ticker: 'BZ=F', label: 'Brent Oil (LCO)' },
    { ticker: 'CL=F', label: 'Crude Oil WTI' },
    { ticker: 'GC=F', label: 'Gold' },
    { ticker: 'SI=F', label: 'Silver' },
    { ticker: 'EURUSD=X', label: 'EUR/USD' },
    { ticker: 'USDINR=X', label: 'USD/INR' },
    { ticker: '^DJI', label: 'Dow Jones' },
    { ticker: '^NDX', label: 'Nasdaq 100 (US Tech)' },
    { ticker: '^GSPC', label: 'S&P 500' },
    { ticker: '^FTSE', label: 'FTSE 100' },
    { ticker: '^HSI', label: 'Hang Seng (Hong Kong)' },
  ];
  const results = await Promise.all(macros.map((m) => fetchMacroPrice(m.ticker, m.label)));
  return results;
}

// ─── Technical Analysis ───────────────────────────────────────────────────────

function runTechnicals(dailyBars, weeklyBars) {
  const closes = dailyBars.map((b) => b.close).filter(Boolean);
  const highs = dailyBars.map((b) => b.high).filter(Boolean);
  const lows = dailyBars.map((b) => b.low).filter(Boolean);
  const wCloses = weeklyBars.map((b) => b.close).filter(Boolean);

  const spot = closes[closes.length - 1] || 0;
  const rsi = calcRSI(closes);
  const rsiWeekly = calcRSI(wCloses);
  const macd = calcMACD(closes);
  const adx = calcADX(highs, lows, closes);
  const ma20 = calcSMA(closes, 20);
  const ma50 = calcSMA(closes, 50);
  const ma200 = calcSMA(closes, 200);
  const ma81w = calcSMA(wCloses, 81);
  const bb = calcBollinger(closes);
  const pivots = calcPivots(highs, lows, closes);

  const above200 = spot > ma200;
  const above50 = spot > ma50;
  const above81w = spot > ma81w;
  const strongTrend = adx > 25;

  let rsiCond = 'neutral';
  if (rsi > 70) rsiCond = 'overbought';
  else if (rsi > 60) rsiCond = 'bullish zone';
  else if (rsi < 30) rsiCond = 'oversold';
  else if (rsi < 40) rsiCond = 'bearish zone';

  let bias = 'Neutral';
  let biasScore = 0;
  if (above200) biasScore++;
  if (above50) biasScore++;
  if (rsi > 50) biasScore++;
  if (macd.hist > 0) biasScore++;
  if (above81w) biasScore++;
  if (biasScore >= 4) bias = 'Bullish';
  else if (biasScore <= 1) bias = 'Bearish';

  // OI data from chart: support/resistance from pivot
  const support = [pivots.s1, pivots.s2, pivots.s3].map((v) => Math.round(v));
  const resistance = [pivots.r1, pivots.r2, pivots.r3].map((v) => Math.round(v));

  return {
    spot, rsi: parseFloat(rsi.toFixed(2)), rsiWeekly: parseFloat(rsiWeekly.toFixed(2)),
    rsiCondition: rsiCond, macd: { ...macd, hist: parseFloat(macd.hist.toFixed(2)) },
    adx: parseFloat(adx.toFixed(2)), strongTrend,
    ma20: parseFloat(ma20.toFixed(2)), ma50: parseFloat(ma50.toFixed(2)),
    ma200: parseFloat(ma200.toFixed(2)), ma81w: parseFloat(ma81w.toFixed(2)),
    above200, above50, above81w,
    bollinger: bb, bbSqueeze: bb.squeeze,
    pivots, support, resistance, bias,
  };
}

// ─── Full Refresh Pipeline ─────────────────────────────────────────────────────

async function runFullRefresh(onProgress, prevSnapshot = null) {
  const step = (pct, text) => onProgress && onProgress(pct, text);
  const prev = prevSnapshot;
  const stale = [];

  try {
    step(10, 'Fetching NIFTY Spot…');
    await getNSECookies();

    // Kick off all fetches in parallel
    const dailyP = fetchNIFTYHistory().catch((e) => { console.warn('[Fetch] Daily failed:', e.message); return null; });
    const weeklyP = fetchNIFTYWeekly().catch((e) => { console.warn('[Fetch] Weekly failed:', e.message); return null; });
    const vixP = fetchIndiaVIX().catch((e) => { console.warn('[Fetch] VIX failed:', e.message); return null; });
    const optP = fetchOptionsChain('NIFTY').catch((e) => { console.warn('[Fetch] Options failed:', e.message); return null; });
    const fiiP = fetchFIIDII().catch((e) => { console.warn('[Fetch] FII/DII failed:', e.message); return null; });
    const macroP = fetchMacroPrices().catch((e) => { console.warn('[Fetch] Macro failed:', e.message); return null; });
    const newsP = fetchNews().catch((e) => { console.warn('[Fetch] News failed:', e.message); return null; });

    step(25, 'Fetching Option Chain…');
    let dailyBars = await dailyP;
    let weeklyBars = await weeklyP;
    let vix = await vixP;

    // Fallback for price data
    if (!dailyBars || dailyBars.length === 0) {
      if (prev?.historyBars?.daily?.length > 0) {
        dailyBars = prev.historyBars.daily;
        stale.push('NIFTY History');
      } else { dailyBars = []; }
    }
    if (!weeklyBars || weeklyBars.length === 0) {
      if (prev?.historyBars?.weekly?.length > 0) { weeklyBars = prev.historyBars.weekly; }
      else { weeklyBars = []; }
    }
    vix = vix || prev?.vix || 18;

    step(40, 'Calculating OI Walls & Max Pain…');
    const daily = dailyBars || [];
    const weekly = weeklyBars || [];
    const tech = daily.length > 2 ? runTechnicals(daily, weekly) : { spot: 23500, rsi: 50, bias: 'Neutral' };
    const spot = tech.spot || 23500;

    let optData = await optP;
    let chainSource = 'NSE Live';
    if (!optData || !optData.chain || optData.chain.length === 0) {
      if (prev?.chain?.length > 0) {
        optData = { chain: prev.chain, spot: prev.spot };
        chainSource = 'Cached (previous refresh)';
        stale.push('Options Chain');
      } else {
        optData = generateSyntheticChain('NIFTY', spot, vix);
        chainSource = 'Synthetic (NSE unavailable)';
      }
    }

    const chain = optData.chain;
    const maxPain = calcMaxPain(chain);
    const pcr = calcPCR(chain);
    const gex = calcGEX(chain, spot);
    const atm = chain.find((r) => Math.abs(r.strike - spot) < 100) || chain[0];
    const avgIV = atm ? (atm.CE_IV + atm.PE_IV) / 2 : 18;
    const historicalIVs = chain.map((r) => (r.CE_IV + r.PE_IV) / 2);
    const ivPercentile = calcIVPercentile(avgIV, historicalIVs);

    const nearestExpiry = chain.map((r) => r.expiry).filter(Boolean).sort()[0];
    const nearChain = nearestExpiry ? chain.filter((r) => r.expiry === nearestExpiry) : chain;
    const callWall = nearChain.reduce((best, r) => r.CE_OI > (best?.CE_OI || 0) ? r : best, null);
    const putWall = nearChain.reduce((best, r) => r.PE_OI > (best?.PE_OI || 0) ? r : best, null);

    step(55, 'Fetching FII/DII…');
    let fiiDii = await fiiP;
    if (!fiiDii || (!fiiDii.fii?.buy && !fiiDii.fii?.sell && !fiiDii.dii?.buy && !fiiDii.dii?.sell)) {
      if (prev?.fii && (prev.fii.buy || prev.fii.sell)) {
        fiiDii = { fii: prev.fii, dii: prev.dii, combined_net: (prev.fii.net || 0) + (prev.dii?.net || 0), dataDate: prev.fiiDate };
        stale.push('FII/DII');
      } else { fiiDii = _emptyFII(); }
    }

    step(70, 'Fetching News & Macro…');
    let macroPrices = await macroP;
    let news = await newsP;
    if ((!macroPrices || macroPrices.length === 0) && prev?.macroPrices?.length > 0) {
      macroPrices = prev.macroPrices; stale.push('Macro Prices');
    }
    if ((!news || news.length === 0) && prev?.news?.length > 0) {
      news = prev.news; stale.push('News');
    }

    step(85, 'Calculating Sentiment & Elliott…');
    const fii = fiiDii || _emptyFII();
    const sentiment = calcSentiment({
      pcr, vix: vix || 18, ivPercentile,
      fiiNet: fii.fii?.net || 0,
      rsi: tech.rsi || 50,
      adx: tech.adx || 20,
    });

    const wCloses = weekly.map((b) => b.close).filter(Boolean);
    const elliottWave = detectElliottWave(wCloses);

    const LOT_SIZE = 65;
    const tradeSetups = generateTradeSetups({
      spot, chain,
      tech: { bias: tech.bias, rsi: tech.rsi, adx: tech.adx },
      vol: { ivPercentile, vix: vix || 18, bbSqueeze: tech.bbSqueeze },
      sentiment, gex, maxPain, pcr, elliottWave,
      lotSize: LOT_SIZE,
    });

    const optionsBias = pcr > 1.2 ? 'Put Heavy (Bearish hedge)' : pcr < 0.8 ? 'Call Heavy (Bullish)' : 'Balanced';
    const structureBias = tech.above200 && tech.above50 ? 'Bullish' :
      !tech.above200 && !tech.above50 ? 'Bearish' : 'Mixed';

    const dailyCloses = daily.map((b) => b.close).filter(Boolean);
    const dailyTrend = dailyCloses.length > 5 ? (dailyCloses[dailyCloses.length - 1] > dailyCloses[dailyCloses.length - 5] ? 'Uptrend' : 'Downtrend') : 'N/A';
    const weeklyCloses = weekly.map((b) => b.close).filter(Boolean);
    const weeklyTrend = weeklyCloses.length > 4 ? (weeklyCloses[weeklyCloses.length - 1] > weeklyCloses[weeklyCloses.length - 4] ? 'Uptrend' : 'Downtrend') : 'N/A';

    // Change vs prev day
    const prevDayClose = dailyCloses[dailyCloses.length - 2] || spot;
    const dailyChange = spot - prevDayClose;

    // "This Week" change: use daily bars to find last Friday's close (end of previous week)
    let prevWeekClose = spot;
    if (daily.length > 1) {
      const lastBarDate = new Date(daily[daily.length - 1].date + 'T00:00:00');
      const dow = lastBarDate.getDay(); // 0=Sun..6=Sat
      const thisMonday = new Date(lastBarDate);
      thisMonday.setDate(lastBarDate.getDate() - ((dow + 6) % 7)); // roll back to Monday
      thisMonday.setHours(0, 0, 0, 0);
      for (let i = daily.length - 1; i >= 0; i--) {
        const d = new Date(daily[i].date + 'T00:00:00');
        if (d < thisMonday) { prevWeekClose = daily[i].close; break; }
      }
    }
    const weeklyChange = spot - prevWeekClose;

    // OI Change
    const totalCEOI = chain.reduce((s, r) => s + (r.CE_OI || 0), 0);
    const totalPEOI = chain.reduce((s, r) => s + (r.PE_OI || 0), 0);
    const netOIChange = chain.reduce((s, r) => s + (r.CE_chgOI || 0) - (r.PE_chgOI || 0), 0);

    step(100, 'Building Dashboard');

    return {
      timestamp: new Date().toISOString(),
      spot,
      dailyChange: parseFloat(dailyChange.toFixed(2)),
      dailyChangePct: parseFloat(((dailyChange / prevDayClose) * 100).toFixed(2)),
      weeklyChange: parseFloat(weeklyChange.toFixed(2)),
      weeklyChangePct: parseFloat(((weeklyChange / prevWeekClose) * 100).toFixed(2)),
      dailyTrend,
      weeklyTrend,
      tech,
      vix: vix || 18,
      ivPercentile,
      avgIV: parseFloat(avgIV.toFixed(2)),
      maxPain,
      pcr: parseFloat(pcr.toFixed(3)),
      optionsBias,
      structureBias,
      chainSource,
      gex: {
        netGEX: gex.netGEX,
        gammaFlip: gex.gammaFlip,
        isGammaSqueeze: gex.isGammaSqueeze,
        topStrikes: gex.topStrikes,
      },
      callWall: callWall ? { strike: callWall.strike, oi: callWall.CE_OI } : null,
      putWall: putWall ? { strike: putWall.strike, oi: putWall.PE_OI } : null,
      totalCEOI,
      totalPEOI,
      netOIChange,
      fii: fii.fii,
      dii: fii.dii,
      fiiDate: fii.dataDate || null,
      sentiment: { ...sentiment, dailyChange, weeklyChange },
      elliottWave,
      tradeSetups,
      chain: chain.slice(0, 300),
      macroPrices: macroPrices || [],
      news: news || [],
      support: tech.support || [],
      resistance: tech.resistance || [],
      pivots: tech.pivots || {},
      historyBars: {
        daily: daily.slice(-60).map((b) => ({ date: b.date, close: b.close, high: b.high, low: b.low })),
        weekly: weekly.slice(-52).map((b) => ({ date: b.date, close: b.close })),
      },
      _stale: stale.length > 0 ? { sections: stale, prevTimestamp: prev?.timestamp || null } : null,
    };
  } catch (err) {
    // On total failure, still reach 100% and return previous snapshot if available
    step(100, 'Building Dashboard');
    if (prev) {
      console.error('[Refresh] Total failure, returning cached data:', err.message);
      return { ...prev, _stale: { sections: ['All Sections'], prevTimestamp: prev.timestamp } };
    }
    throw err;
  }
}

module.exports = { runFullRefresh, fetchOptionsChain, fetchNews, fetchMacroPrices, fetchFIIDII, fetchIndiaVIX };
