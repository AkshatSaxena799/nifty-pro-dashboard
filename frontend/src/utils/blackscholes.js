/**
 * Frontend Black-Scholes pricer with IV skew.
 * FIX #1: Accurate OTM option pricing for Positions LTP.
 * The backend fallback uses flat ATM IV (~18%), which drastically underprices
 * deep OTM puts/calls. This module applies a volatility skew so e.g.
 * 20000 PE (15% OTM) gets ~26% IV instead of 18%, pricing ~₹116 not ₹19.
 */

const LOT_SIZE = 65; // NIFTY lot size — hardcoded

function normCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const poly = t * (0.319381530 +
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

export function bsPrice(S, K, T, r, sigma, type) {
  if (T <= 0 || sigma <= 0) {
    return { price: Math.max(type === 'C' ? S - K : K - S, 0), delta: 0, gamma: 0, theta: 0, vega: 0 };
  }
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

/**
 * Apply NIFTY volatility skew for OTM options.
 * Put skew: +50% absolute IV per 100% OTM distance (steep, realistic for NIFTY).
 * Call skew: +20% absolute IV per 100% OTM distance (milder).
 * Example: baseIV=18%, 20000 PE with spot=23500 → moneyness gap=14.9% → IV=18%+7.5%=25.5%
 */
export function getSkewedIV(baseIV, strike, spot, type) {
  const m = strike / spot;
  if (type === 'PE' || type === 'P') {
    return baseIV + 0.5 * Math.max(0, 1 - m);
  }
  return baseIV + 0.2 * Math.max(0, m - 1);
}

/**
 * Compute P&L for a single position using chain data with IV skew fallback.
 * Called client-side to replace the backend's flat-IV pricing.
 */
export function computePositionPnL(pos, chain, spot, avgIV) {
  const r = 0.065;
  const bsType = pos.type === 'CE' ? 'C' : 'P';
  const T = Math.max((new Date(pos.expiry) - Date.now()) / (365 * 86400000), 0.001);

  // Try direct chain match
  const chainRow = chain?.find(row =>
    row.strike === pos.strike &&
    String(row.expiry).startsWith(String(pos.expiry).slice(0, 10))
  );

  let ltp, iv;
  if (chainRow) {
    ltp = pos.type === 'CE' ? chainRow.CE_LTP : chainRow.PE_LTP;
    iv = ((pos.type === 'CE' ? chainRow.CE_IV : chainRow.PE_IV) || 18) / 100;
  } else {
    // FIX #1: Use skew-adjusted IV instead of flat ATM IV
    const baseIV = (avgIV || 18) / 100;
    iv = getSkewedIV(baseIV, pos.strike, spot, pos.type);
    const result = bsPrice(spot, pos.strike, T, r, iv, bsType);
    ltp = parseFloat(result.price.toFixed(2));
  }

  const greeks = bsPrice(spot, pos.strike, T, r, iv, bsType);

  const pnlPerUnit = pos.side === 'long' ? ltp - pos.entryPrice : pos.entryPrice - ltp;
  const pnl = pnlPerUnit * pos.qty * LOT_SIZE;
  const pnlPct = pos.entryPrice > 0 ? (pnlPerUnit / pos.entryPrice) * 100 : 0;

  // Probability of profit
  let pop = 50;
  if (T > 0 && iv > 0) {
    const d2 = (Math.log(spot / pos.strike) + (r - 0.5 * iv * iv) * T) / (iv * Math.sqrt(T));
    if (bsType === 'C') {
      pop = pos.side === 'long' ? normCDF(d2) : 1 - normCDF(d2);
    } else {
      pop = pos.side === 'long' ? normCDF(-d2) : 1 - normCDF(-d2);
    }
    pop = Math.round(pop * 100);
  }

  return {
    ...pos,
    currentLTP: ltp,
    pnl: parseFloat(pnl.toFixed(2)),
    pnlPct: parseFloat(pnlPct.toFixed(2)),
    probOfProfit: pop,
    greeks: {
      delta: greeks.delta.toFixed(3),
      gamma: greeks.gamma.toFixed(5),
      theta: greeks.theta.toFixed(2),
      vega: greeks.vega.toFixed(3),
    },
  };
}
