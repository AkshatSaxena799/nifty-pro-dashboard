/**
 * calculations.js
 * ===============
 * Pure-JS technical indicator calculations + Black-Scholes Greeks.
 * No Python, no native addons — runs anywhere Node.js runs.
 */

// ─── Math helpers ────────────────────────────────────────────────────────────

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}

// Cumulative Normal Distribution (Abramowitz & Stegun approximation)
function normCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const poly =
    t * (0.319381530 +
      t * (-0.356563782 +
        t * (1.781477937 +
          t * (-1.821255978 + t * 1.330274429))));
  const phi = (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
  const cdf = 1 - phi * poly;
  return x >= 0 ? cdf : 1 - cdf;
}

function normPDF(x) {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

// ─── RSI ─────────────────────────────────────────────────────────────────────

function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gains += d; else losses -= d;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(d, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// ─── EMA ─────────────────────────────────────────────────────────────────────

function calcEMA(closes, period) {
  if (closes.length < period) return closes[closes.length - 1] || 0;
  const k = 2 / (period + 1);
  let ema = mean(closes.slice(0, period));
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return ema;
}

function calcEMAArray(closes, period) {
  const result = new Array(closes.length).fill(null);
  if (closes.length < period) return result;
  const k = 2 / (period + 1);
  let ema = mean(closes.slice(0, period));
  result[period - 1] = ema;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
    result[i] = ema;
  }
  return result;
}

// ─── MACD ─────────────────────────────────────────────────────────────────────

function calcMACD(closes, fast = 12, slow = 26, signal = 9) {
  if (closes.length < slow + signal) return { macd: 0, signal: 0, hist: 0 };
  const emaFast = calcEMAArray(closes, fast);
  const emaSlow = calcEMAArray(closes, slow);
  const macdLine = emaFast.map((f, i) =>
    f !== null && emaSlow[i] !== null ? f - emaSlow[i] : null
  );
  const macdValid = macdLine.filter((v) => v !== null);
  const signalLine = calcEMAArray(macdValid, signal);
  const lastMACD = macdValid[macdValid.length - 1];
  const lastSignal = signalLine[signalLine.length - 1];
  return {
    macd: lastMACD || 0,
    signal: lastSignal || 0,
    hist: (lastMACD || 0) - (lastSignal || 0),
  };
}

// ─── ADX ─────────────────────────────────────────────────────────────────────

function calcADX(highs, lows, closes, period = 14) {
  if (closes.length < period * 2) return 20;
  const trArr = [], dmPArr = [], dmNArr = [];
  for (let i = 1; i < closes.length; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    const dmP = highs[i] - highs[i - 1] > lows[i - 1] - lows[i]
      ? Math.max(highs[i] - highs[i - 1], 0) : 0;
    const dmN = lows[i - 1] - lows[i] > highs[i] - highs[i - 1]
      ? Math.max(lows[i - 1] - lows[i], 0) : 0;
    trArr.push(tr); dmPArr.push(dmP); dmNArr.push(dmN);
  }
  let atr = mean(trArr.slice(0, period));
  let sdmP = mean(dmPArr.slice(0, period));
  let sdmN = mean(dmNArr.slice(0, period));
  const dxArr = [];
  for (let i = period; i < trArr.length; i++) {
    atr = (atr * (period - 1) + trArr[i]) / period;
    sdmP = (sdmP * (period - 1) + dmPArr[i]) / period;
    sdmN = (sdmN * (period - 1) + dmNArr[i]) / period;
    const diP = atr > 0 ? (sdmP / atr) * 100 : 0;
    const diN = atr > 0 ? (sdmN / atr) * 100 : 0;
    const dx = diP + diN > 0 ? (Math.abs(diP - diN) / (diP + diN)) * 100 : 0;
    dxArr.push(dx);
  }
  return dxArr.length >= period ? mean(dxArr.slice(-period)) : mean(dxArr);
}

// ─── Simple MA ───────────────────────────────────────────────────────────────

function calcSMA(closes, period) {
  if (closes.length < period) return closes[closes.length - 1] || 0;
  return mean(closes.slice(-period));
}

// ─── Bollinger Bands ─────────────────────────────────────────────────────────

function calcBollinger(closes, period = 20, mult = 2) {
  if (closes.length < period) {
    const c = closes[closes.length - 1] || 0;
    return { upper: c, mid: c, lower: c, squeeze: false };
  }
  const slice = closes.slice(-period);
  const mid = mean(slice);
  const sd = stddev(slice);
  const bw = (2 * mult * sd) / mid;
  return { upper: mid + mult * sd, mid, lower: mid - mult * sd, squeeze: bw < 0.04 };
}

// ─── Pivot / Support-Resistance ───────────────────────────────────────────────

function calcPivots(highs, lows, closes) {
  // Classical pivot points based on last 5 daily bars
  const n = Math.min(5, closes.length);
  const H = Math.max(...highs.slice(-n));
  const L = Math.min(...lows.slice(-n));
  const C = closes[closes.length - 1];
  const P = (H + L + C) / 3;
  return {
    pivot: P,
    r1: 2 * P - L, r2: P + (H - L), r3: H + 2 * (P - L),
    s1: 2 * P - H, s2: P - (H - L), s3: L - 2 * (H - P),
  };
}

// ─── Elliott Wave (rule-based) ────────────────────────────────────────────────

function detectElliottWave(weeklyCloses) {
  if (!weeklyCloses || weeklyCloses.length < 20) {
    return { wave: 3, bias: 'Bullish', nextTargets: [], prob: 60 };
  }
  const n = weeklyCloses.length;
  const c = weeklyCloses[n - 1];
  const w52hi = Math.max(...weeklyCloses.slice(-52));
  const w52lo = Math.min(...weeklyCloses.slice(-52));
  const range = w52hi - w52lo;
  const pos = range > 0 ? (c - w52lo) / range : 0.5;
  const rsi = calcRSI(weeklyCloses, 14);
  const ma20 = calcSMA(weeklyCloses, 20);
  const ma50 = calcSMA(weeklyCloses, 50);

  let wave, bias, prob, nextTargets;

  if (pos > 0.80 && rsi > 65) {
    wave = 5; bias = 'Caution'; prob = 55;
    nextTargets = [
      { label: 'Wave 5 extension', level: Math.round(c * 1.03), prob: 40 },
      { label: 'Correction (wave A)', level: Math.round(c * 0.94), prob: 60 },
    ];
  } else if (pos > 0.60 && c > ma20 && ma20 > ma50) {
    wave = 3; bias = 'Bullish'; prob = 65;
    nextTargets = [
      { label: 'Wave 3 target', level: Math.round(c * 1.06), prob: 65 },
      { label: 'Wave 4 pullback', level: Math.round(c * 0.97), prob: 35 },
    ];
  } else if (pos < 0.25 && rsi < 40) {
    wave = 'A/C'; bias = 'Bearish'; prob = 60;
    nextTargets = [
      { label: 'Wave C target', level: Math.round(c * 0.92), prob: 55 },
      { label: 'Reversal (wave 1)', level: Math.round(c * 1.05), prob: 45 },
    ];
  } else if (pos < 0.45 && c > ma20) {
    wave = 1; bias = 'Bullish'; prob = 62;
    nextTargets = [
      { label: 'Wave 1 target', level: Math.round(c * 1.04), prob: 62 },
      { label: 'Wave 2 pullback', level: Math.round(c * 0.975), prob: 38 },
    ];
  } else {
    wave = 2; bias = 'Neutral'; prob = 50;
    nextTargets = [
      { label: 'Wave 2 support', level: Math.round(c * 0.98), prob: 55 },
      { label: 'Resume up (wave 3)', level: Math.round(c * 1.05), prob: 45 },
    ];
  }
  return { wave, bias, prob, nextTargets, rsi: Math.round(rsi), ma20: Math.round(ma20), w52hi: Math.round(w52hi), w52lo: Math.round(w52lo) };
}

// ─── Black-Scholes ────────────────────────────────────────────────────────────

function bsPrice(S, K, T, r, sigma, type) {
  if (T <= 0 || sigma <= 0) return { price: Math.max(type === 'C' ? S - K : K - S, 0), delta: 0, gamma: 0, theta: 0, vega: 0 };
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const sqrtT = Math.sqrt(T);

  let price, delta;
  if (type === 'C') {
    price = S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
    delta = normCDF(d1);
  } else {
    price = K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1);
    delta = normCDF(d1) - 1;
  }

  const gamma = normPDF(d1) / (S * sigma * sqrtT);
  const theta = (-(S * normPDF(d1) * sigma) / (2 * sqrtT) -
    r * K * Math.exp(-r * T) * (type === 'C' ? normCDF(d2) : normCDF(-d2))) / 365;
  const vega = S * normPDF(d1) * sqrtT / 100;

  return { price: Math.max(price, 0), delta, gamma, theta, vega };
}

// ─── IV from market price (Newton-Raphson) ────────────────────────────────────

function calcImpliedVol(marketPrice, S, K, T, r, type) {
  if (T <= 0) return 0;
  let sigma = 0.2;
  for (let i = 0; i < 100; i++) {
    const { price, vega } = bsPrice(S, K, T, r, sigma, type);
    const diff = price - marketPrice;
    if (Math.abs(diff) < 0.01) break;
    if (vega < 1e-8) break;
    sigma -= diff / (vega * 100);
    if (sigma < 0.001) sigma = 0.001;
    if (sigma > 5) sigma = 5;
  }
  return sigma;
}

// ─── Probability of Profit ────────────────────────────────────────────────────

function probOfProfit(S, K, T, r, iv, type, side) {
  // side: 'long' or 'short'
  if (T <= 0 || iv <= 0) return 50;
  const d2 = (Math.log(S / K) + (r - 0.5 * iv * iv) * T) / (iv * Math.sqrt(T));
  let prob;
  if (type === 'C') {
    prob = side === 'long' ? normCDF(d2) : 1 - normCDF(d2);
  } else {
    prob = side === 'long' ? normCDF(-d2) : 1 - normCDF(-d2);
  }
  return Math.round(prob * 100);
}

// ─── GEX (Gamma Exposure) ─────────────────────────────────────────────────────

// UPDATED FOR FIX #4 — LOT SIZE = 65 hardcoded everywhere
function calcGEX(chain, spot, lotSize = 65) {
  let netGEX = 0;
  const strikeGEX = {};
  for (const row of chain) {
    const T = Math.max((new Date(row.expiry) - Date.now()) / (365 * 24 * 3600 * 1000), 1 / 365);
    const r = 0.065;
    const ceIV = (row.CE_IV || 18) / 100;
    const peIV = (row.PE_IV || 18) / 100;
    const ceG = bsPrice(spot, row.strike, T, r, ceIV, 'C').gamma;
    const peG = bsPrice(spot, row.strike, T, r, peIV, 'P').gamma;
    const gex = (ceG * (row.CE_OI || 0) - peG * (row.PE_OI || 0)) * lotSize * spot;
    netGEX += gex;
    strikeGEX[row.strike] = (strikeGEX[row.strike] || 0) + gex;
  }
  const sorted = Object.entries(strikeGEX).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const gammaFlip = sorted.find(([, g]) => Math.abs(g) < netGEX * 0.05)?.[0];
  const isGammaSqueeze = netGEX < 0 && Math.abs(netGEX) > 5e8;
  return { netGEX, gammaFlip: gammaFlip ? Number(gammaFlip) : null, isGammaSqueeze, topStrikes: sorted.slice(0, 5) };
}

// ─── Max Pain ─────────────────────────────────────────────────────────────────

function calcMaxPain(chain) {
  const strikes = [...new Set(chain.map((r) => r.strike))].sort((a, b) => a - b);
  let minPain = Infinity, maxPain = strikes[0];
  for (const K of strikes) {
    const pain = chain.reduce((sum, r) => {
      const ceLoss = Math.max(K - r.strike, 0) * (r.CE_OI || 0);
      const peLoss = Math.max(r.strike - K, 0) * (r.PE_OI || 0);
      return sum + ceLoss + peLoss;
    }, 0);
    if (pain < minPain) { minPain = pain; maxPain = K; }
  }
  return maxPain;
}

// ─── PCR ─────────────────────────────────────────────────────────────────────

function calcPCR(chain) {
  const totalCEOI = chain.reduce((s, r) => s + (r.CE_OI || 0), 0);
  const totalPEOI = chain.reduce((s, r) => s + (r.PE_OI || 0), 0);
  return totalCEOI > 0 ? totalPEOI / totalCEOI : 1;
}

// ─── IV Percentile ────────────────────────────────────────────────────────────

function calcIVPercentile(currentIV, historicalIVs) {
  if (!historicalIVs || historicalIVs.length === 0) return 50;
  const below = historicalIVs.filter((v) => v <= currentIV).length;
  return Math.round((below / historicalIVs.length) * 100);
}

// ─── Overall Market Sentiment ─────────────────────────────────────────────────

function calcSentiment({ pcr, vix, ivPercentile, fiiNet, rsi, adx }) {
  let score = 0;
  // Discrete PCR buckets — avoids fractional scores near the neutral boundary
  // that cause the label to flip with tiny PCR changes (e.g. 0.99 vs 1.01).
  if      (pcr > 1.5)  score += 20;
  else if (pcr > 1.2)  score += 15;
  else if (pcr > 1.05) score +=  8;
  else if (pcr < 0.7)  score -= 20;
  else if (pcr < 0.8)  score -= 15;
  else if (pcr < 0.95) score -=  8;
  // else 0.95–1.05: balanced → 0 (no contribution)
  if (vix < 14) score += 15; else if (vix > 22) score -= 20;
  if (ivPercentile < 30) score += 10; else if (ivPercentile > 70) score -= 10;
  if (fiiNet > 0) score += 15; else if (fiiNet < 0) score -= 15;
  if (rsi > 60) score += 10; else if (rsi < 40) score -= 10;
  if (adx > 25) score += 5;
  // Widened dead-band: ±25 to avoid boundary flicker on marginal data
  const label = score > 25 ? 'Bullish' : score < -25 ? 'Bearish' : 'Neutral';
  return { score: Math.round(score), label };
}

// ─── Trade Setup Generator ───────────────────────────────────────────────────

// UPDATED FOR FIX #4 — LOT SIZE = 65 hardcoded everywhere
function generateTradeSetups({ spot, chain, tech, vol, sentiment, gex, maxPain, pcr, elliottWave, lotSize = 65 }) {
  const setups = [];
  const now = Date.now();
  const r = 0.065;

  // Helper: find nearest strikes
  const strikes = [...new Set(chain.map((r) => r.strike))].sort((a, b) => a - b);
  const nearestStrike = (target) => strikes.reduce((best, s) => Math.abs(s - target) < Math.abs(best - target) ? s : best, strikes[0]);

  // Get a 2-month expiry from chain
  const targetExpiry = chain
    .map((r) => r.expiry)
    .filter((e) => {
      const days = (new Date(e) - now) / 86400000;
      return days > 45 && days < 120;
    })
    .sort()[0] || chain.map((r) => r.expiry).sort()[chain.length - 1];

  const getTDays = (exp) => Math.max((new Date(exp) - now) / (365 * 24 * 3600 * 1000), 1 / 365);

  // ── Setup 1: Elliott Wave direction trade ──────────────────────────────────
  if (elliottWave.bias !== 'Neutral') {
    const isBull = elliottWave.bias === 'Bullish' || tech.bias === 'Bullish';
    const type = isBull ? 'C' : 'P';
    const strikeTarget = isBull ? nearestStrike(spot * 1.03) : nearestStrike(spot * 0.97);
    const expRow = chain.find((r) => r.strike === strikeTarget && r.expiry === targetExpiry) || chain[0];
    const iv = ((expRow?.CE_IV || expRow?.PE_IV || 18)) / 100;
    const T = getTDays(targetExpiry);
    const greeks = bsPrice(spot, strikeTarget, T, r, iv, type);
    const prob = probOfProfit(spot, strikeTarget, T, r, iv, type, 'long');
    const expStr = targetExpiry ? new Date(targetExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    setups.push({
      id: 1,
      direction: isBull ? 'Bullish' : 'Bearish',
      type: type === 'C' ? 'Call Buy' : 'Put Buy',
      strike: strikeTarget,
      expiry: expStr,
      expectedMove: isBull ? '+5 to +8%' : '-5 to -8%',
      probability: prob,
      reasoning: `Elliott Wave ${elliottWave.wave} suggests ${elliottWave.bias} continuation. RSI ${tech.rsi?.toFixed(1)}, ADX ${tech.adx?.toFixed(1)} (${tech.adx > 25 ? 'strong' : 'weak'} trend). ${gex.isGammaSqueeze ? 'Gamma squeeze environment — dealers will amplify moves.' : ''}`,
      greeks: { delta: greeks.delta.toFixed(3), gamma: greeks.gamma.toFixed(5), theta: greeks.theta.toFixed(2), vega: greeks.vega.toFixed(3) },
      lotSize,
      tags: ['Elliott Wave', 'Trend'],
    });
  }

  // ── Setup 2: Low IV expansion play ────────────────────────────────────────
  if (vol.ivPercentile < 30 && vol.vix < 16) {
    const straddle = nearestStrike(spot);
    const expRow = chain.find((r) => r.strike === straddle && r.expiry === targetExpiry) || chain[0];
    const iv = ((expRow?.CE_IV || 18)) / 100;
    const T = getTDays(targetExpiry);
    const ceGr = bsPrice(spot, straddle, T, r, iv, 'C');
    const peGr = bsPrice(spot, straddle, T, r, iv, 'P');
    const totalCost = (expRow?.CE_LTP || ceGr.price) + (expRow?.PE_LTP || peGr.price);
    const breakEvenUp = straddle + totalCost;
    const breakEvenDn = straddle - totalCost;
    const expStr = targetExpiry ? new Date(targetExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    setups.push({
      id: 2,
      direction: 'Neutral (Both)',
      type: 'Long Straddle',
      strike: straddle,
      expiry: expStr,
      expectedMove: `±${((totalCost / spot) * 100).toFixed(1)}% breakeven`,
      probability: 55,
      reasoning: `IV Percentile at ${vol.ivPercentile}th (cheap). VIX ${vol.vix?.toFixed(2)} — low fear. Options are underpriced relative to historical moves. Straddle profits if NIFTY moves >${((totalCost / spot) * 100).toFixed(1)}% either direction. BB Squeeze: ${vol.bbSqueeze ? 'YES — coiled spring!' : 'No'}`,
      greeks: { delta: '≈0', gamma: ((ceGr.gamma + peGr.gamma) / 2).toFixed(5), theta: (ceGr.theta + peGr.theta).toFixed(2), vega: (ceGr.vega + peGr.vega).toFixed(3) },
      lotSize,
      tags: ['Low IV', 'Volatility Expansion', 'Straddle'],
      breakEven: { up: Math.round(breakEvenUp), down: Math.round(breakEvenDn) },
    });
  }

  // ── Setup 3: Gamma Squeeze play ──────────────────────────────────────────
  if (gex.isGammaSqueeze) {
    const isBullishSqueeze = sentiment.score >= 0;
    const type = isBullishSqueeze ? 'C' : 'P';
    const strikeTarget = isBullishSqueeze ? nearestStrike(spot * 1.02) : nearestStrike(spot * 0.98);
    const expRow = chain.find((r) => r.strike === strikeTarget) || chain[0];
    const iv = ((expRow?.CE_IV || expRow?.PE_IV || 18)) / 100;
    const T = getTDays(targetExpiry);
    const greeks = bsPrice(spot, strikeTarget, T, r, iv, type);
    const expStr = targetExpiry ? new Date(targetExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    setups.push({
      id: 3,
      direction: isBullishSqueeze ? 'Bullish' : 'Bearish',
      type: type === 'C' ? 'Call Buy' : 'Put Buy',
      strike: strikeTarget,
      expiry: expStr,
      expectedMove: isBullishSqueeze ? '+3 to +6%' : '-3 to -6%',
      probability: 62,
      reasoning: `Negative Net GEX (${(gex.netGEX / 1e9).toFixed(2)}B) — dealers are short gamma. Any directional move forces dealer hedging that AMPLIFIES price action. ${sentiment.label} sentiment reinforces direction.`,
      greeks: { delta: greeks.delta.toFixed(3), gamma: greeks.gamma.toFixed(5), theta: greeks.theta.toFixed(2), vega: greeks.vega.toFixed(3) },
      lotSize,
      tags: ['Gamma Squeeze', 'Dealer Hedging'],
    });
  }

  // ── Setup 4: PCR contrarian play ──────────────────────────────────────────
  if (pcr > 1.5 || pcr < 0.7) {
    const isExtremePessimism = pcr > 1.5;
    const type = isExtremePessimism ? 'C' : 'P';
    const strikeTarget = isExtremePessimism ? nearestStrike(spot * 1.02) : nearestStrike(spot * 0.98);
    const expRow = chain.find((r) => r.strike === strikeTarget && r.expiry === targetExpiry) || chain[0];
    const iv = ((expRow?.CE_IV || expRow?.PE_IV || 18)) / 100;
    const T = getTDays(targetExpiry);
    const greeks = bsPrice(spot, strikeTarget, T, r, iv, type);
    const expStr = targetExpiry ? new Date(targetExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    setups.push({
      id: 4,
      direction: isExtremePessimism ? 'Bullish (Contrarian)' : 'Bearish (Contrarian)',
      type: type === 'C' ? 'Call Buy' : 'Put Buy',
      strike: strikeTarget,
      expiry: expStr,
      expectedMove: isExtremePessimism ? '+4 to +7%' : '-4 to -7%',
      probability: 58,
      reasoning: `PCR at ${pcr.toFixed(2)} — ${isExtremePessimism ? 'extreme put buying signals capitulation. Market is oversold. Contrarian bounce expected.' : 'extreme call buying signals euphoria. Market overbought. Contrarian drop possible.'}`,
      greeks: { delta: greeks.delta.toFixed(3), gamma: greeks.gamma.toFixed(5), theta: greeks.theta.toFixed(2), vega: greeks.vega.toFixed(3) },
      lotSize,
      tags: ['PCR Extreme', 'Contrarian'],
    });
  }

  // ── Setup 5: Max Pain gravitational pull ─────────────────────────────────
  if (Math.abs(spot - maxPain) > spot * 0.02) {
    const needsDown = spot > maxPain;
    const type = needsDown ? 'P' : 'C';
    const strikeTarget = needsDown ? nearestStrike(spot * 0.985) : nearestStrike(spot * 1.015);
    const expRow = chain.find((r) => r.strike === strikeTarget) || chain[0];
    const iv = ((expRow?.PE_IV || expRow?.CE_IV || 18)) / 100;
    const T = getTDays(targetExpiry);
    const greeks = bsPrice(spot, strikeTarget, T, r, iv, type);
    const expStr = targetExpiry ? new Date(targetExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    setups.push({
      id: 5,
      direction: needsDown ? 'Bearish (Max Pain Pull)' : 'Bullish (Max Pain Pull)',
      type: type === 'C' ? 'Call Buy' : 'Put Buy',
      strike: strikeTarget,
      expiry: expStr,
      expectedMove: `${needsDown ? '-' : '+'}${Math.abs(((spot - maxPain) / spot) * 100).toFixed(1)}%`,
      probability: 55,
      reasoning: `NIFTY spot (${spot.toFixed(0)}) is ${Math.abs(((spot - maxPain) / spot) * 100).toFixed(1)}% ${needsDown ? 'above' : 'below'} Max Pain (${maxPain}). Options market makers profit most at Max Pain — expect gravitational pull.`,
      greeks: { delta: greeks.delta.toFixed(3), gamma: greeks.gamma.toFixed(5), theta: greeks.theta.toFixed(2), vega: greeks.vega.toFixed(3) },
      lotSize,
      tags: ['Max Pain', 'OI Analysis'],
    });
  }

  return setups.slice(0, 5);
}

module.exports = {
  calcRSI, calcEMA, calcEMAArray, calcMACD, calcADX, calcSMA,
  calcBollinger, calcPivots, detectElliottWave,
  bsPrice, calcImpliedVol, probOfProfit,
  calcGEX, calcMaxPain, calcPCR, calcIVPercentile,
  calcSentiment, generateTradeSetups,
};
