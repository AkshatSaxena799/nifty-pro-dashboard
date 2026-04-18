// Metric tooltip definitions — 100% standard financial definitions
// UPDATED FOR REFINEMENT #2,4,5,6,8 — March 2026
// Added: Market Sentiment, OI Analysis, OI Snapshot, FII/DII, Elliott waves,
//        Support/Resistance zones, Pivot Points, Gamma Exposure, macro labels
export const TOOLTIPS = {
  'NIFTY Spot': {
    definition: 'The current market price of the NIFTY 50 index, representing the weighted average of India\'s 50 largest NSE-listed companies.',
    meaning: 'Primary measure of Indian large-cap equity market performance. All NIFTY options are cash-settled against this value.',
    high: 'Market is in a risk-on environment. Bullish bias. Watch for resistance zones and overbought RSI.',
    low: 'Potential value zone or risk-off. Watch for support zones and oversold RSI for reversal.',
    source: 'NSE India (nseindia.com)',
  },
  'Daily Trend': {
    definition: 'The directional bias of NIFTY over the most recent 5 trading sessions based on price action.',
    meaning: 'Short-term momentum indicator. Determines whether intraday/swing traders should be biased long or short.',
    high: 'Sustained uptrend — strong buy-side pressure. Dip-buying strategy preferred.',
    low: 'Sustained downtrend — sellers in control. Rally-selling strategy preferred.',
    source: 'Calculated from NSE/Yahoo Finance OHLCV data',
  },
  'Weekly Trend': {
    definition: 'The directional bias of NIFTY comparing current week\'s close to the prior 4-week average.',
    meaning: 'Swing trade context. Weekly trend filters out daily noise and confirms structural direction.',
    high: 'Weekly uptrend — higher highs and higher lows on weekly chart. Strong structural support.',
    low: 'Weekly downtrend — lower highs and lower lows. Options sellers may prefer bearish premium strategies.',
    source: 'Calculated from NSE/Yahoo Finance weekly OHLCV data',
  },
  'RSI': {
    definition: 'Relative Strength Index — momentum oscillator measuring the speed and change of price movements on a scale of 0–100.',
    meaning: 'RSI > 70 = overbought (potential reversal down); RSI < 30 = oversold (potential bounce). RSI > 50 = bullish momentum.',
    high: 'RSI > 70: Overbought. Risk of sharp correction. Avoid aggressive long option buys. Consider put spreads.',
    low: 'RSI < 30: Oversold. Bounce likely. Look for bullish call options at support zones.',
    source: 'Calculated from NSE/Yahoo Finance OHLCV (RSI-14)',
  },
  'MACD Histogram': {
    definition: 'Moving Average Convergence Divergence histogram — difference between MACD line (12-26 EMA) and signal line (9 EMA). Measures momentum shifts.',
    meaning: 'Positive and growing histogram = accelerating bullish momentum. Negative and falling = accelerating bearish pressure.',
    high: 'Strong bullish momentum. Trend likely to continue. Favorable for call options / bull spreads.',
    low: 'Strong bearish momentum. Put options and bear spreads favored. Watch for MACD divergence for reversal signals.',
    source: 'Calculated from NSE/Yahoo Finance OHLCV (MACD 12-26-9)',
  },
  'ADX': {
    definition: 'Average Directional Index — measures trend strength (not direction) on a scale of 0–100. Above 25 = strong trend.',
    meaning: 'ADX tells you HOW STRONG the trend is, regardless of direction. Use with RSI/MACD for directional bias.',
    high: 'ADX > 25: Strong trending market. Momentum strategies work well. Buy directional options.',
    low: 'ADX < 20: Weak trend / range-bound market. Premium selling (straddles, iron condors) works better.',
    source: 'Calculated from NSE/Yahoo Finance OHLCV (ADX-14)',
  },
  'MA200': {
    definition: '200-period Simple Moving Average of daily closing prices. Classic long-term trend indicator used by institutions.',
    meaning: 'Price above MA200 = long-term bull market. Price below = long-term bear market. Often key buy/sell decision for FIIs.',
    high: 'Price trading well above MA200. Long-term bull market intact. Dips toward MA200 are buy opportunities.',
    low: 'Price below MA200. Long-term bear phase. Rallies toward MA200 may face selling pressure.',
    source: 'Calculated from NSE/Yahoo Finance daily OHLCV',
  },
  '81-Week MA': {
    definition: '81-period Weekly Simple Moving Average — equivalent to ~1.5 years of data. Institutional-grade long-term trend filter.',
    meaning: 'Used by large fund managers. NIFTY historically bounces from 81-Week MA during corrections in bull markets.',
    high: 'NIFTY well above 81-Week MA. Strong secular bull trend. Aggressive call strategies viable.',
    low: 'NIFTY below 81-Week MA. Potential structural bear market or major correction. Defensive approach required.',
    source: 'Calculated from NSE/Yahoo Finance weekly OHLCV',
  },
  'India VIX': {
    definition: 'India Volatility Index — measures 30-day expected volatility of NIFTY options. Often called the "Fear Index".',
    meaning: 'VIX < 14 = complacency (options cheap, good to buy). VIX > 25 = fear (options expensive, good to sell premium).',
    high: 'VIX > 22: High fear. Options extremely expensive (high IV). Selling premium is profitable. Long options costly.',
    low: 'VIX < 14: Complacency. Options cheap. Ideal time to buy calls/puts before an anticipated move.',
    source: 'NSE India (nseindia.com/api/allIndices)',
  },
  'IV Percentile': {
    definition: 'Implied Volatility Percentile — what percentage of historical trading days had IV lower than today\'s IV. Range: 0–100.',
    meaning: 'IV%ile < 25: IV is historically cheap → buy options. IV%ile > 75: IV is expensive → sell premium strategies.',
    high: 'IV > 75th percentile. Options overpriced by market fear. Sell premium: iron condors, straddles, credit spreads.',
    low: 'IV < 25th percentile. Options underpriced. Buy options: calls, puts, straddles for low-cost directional bets.',
    source: 'Calculated from NSE options chain IV data',
  },
  'Vol Expansion Setup': {
    definition: 'A Boolean signal that activates when IV is low AND Bollinger Bands are squeezed, indicating a coiled-spring explosive move is imminent.',
    meaning: 'When both VIX/IV are low AND BB squeeze is present, historically the next move is sharp and fast in either direction.',
    high: 'Setup ACTIVE: Buy straddles or strangles immediately. The market is about to make a big move.',
    low: 'Setup INACTIVE: Normal conditions. Focus on directional or premium-selling strategies instead.',
    source: 'Calculated from NSE/Yahoo Finance IV + Bollinger Band width',
  },
  // ── Market Sentiment (REFINEMENT #2) ────────────────────────────────────────
  'Market Sentiment': {
    definition: 'Composite Sentiment Score derived from five weighted market signals: PCR (25%), India VIX (25%), IV Percentile (15%), FII Net Flows (20%), RSI (15%). Score ranges approximately from −60 (extreme bearish) to +60 (extreme bullish).',
    meaning: 'A single actionable number that tells you the combined market mood. Positive = bulls in control; negative = bears dominant. Used to bias options strategy direction (calls vs puts, buy vs sell).',
    high: 'Score > +20 (Bullish): Strong positive confluence — PCR elevated, VIX low, FII buying, RSI > 50. Buy calls/bull spreads near support. Score > +40 = strongly bullish (>+1.5% weekly return historically likely).',
    low: 'Score < −20 (Bearish): Weak confluence — low PCR, high VIX, FII selling, RSI < 50. Buy puts/bear spreads near resistance. Score < −40 = strongly bearish (<−1.5% weekly return historically likely).',
    source: 'NSE India (PCR, VIX, options chain) + Yahoo Finance (RSI) — internal composite calculation',
  },
  // ── Open Interest Analysis (REFINEMENT #1, 4) ────────────────────────────────
  'OI Analysis': {
    definition: 'Open Interest (OI) is the total number of outstanding options contracts (calls or puts) that have not been settled. The OI chart shows CE OI (calls, bearish resistance) vs PE OI (puts, bullish support) at each strike price.',
    meaning: 'High CE OI at a strike = strong call writing (resistance). High PE OI at a strike = strong put writing (support). The strike with maximum CE OI is the Call Wall — the market tends to struggle above it. The Put Wall is the floor.',
    high: 'High total OI: More open positions = larger hedging requirements for dealers. Gamma effects amplify price moves near large OI strikes at expiry.',
    low: 'Low total OI: Fewer open positions = less gamma exposure, smoother price moves, less directional conviction from options market.',
    source: 'NSE India options chain API (nseindia.com/api/option-chain-indices?symbol=NIFTY)',
  },
  'Open Interest Snapshot': {
    definition: 'A summary of the current state of the entire NIFTY options market: total call vs put open interest, net change on the day, the strongest support/resistance strikes (walls), Max Pain point, and overall OI concentration.',
    meaning: 'For options traders, this snapshot defines the battlefield: where are the big bets placed? The call wall caps upside; the put wall floors downside; Max Pain is the expiry magnet. Net OI Change shows if money is flowing into calls (bearish signal) or puts (bullish).',
    high: 'High CE OI relative to PE OI (PCR < 0.8): Call-heavy — market makers are short calls, creating negative gamma. Moves above call wall are amplified. Watch for breakout or reversal at call wall.',
    low: 'High PE OI relative to CE OI (PCR > 1.3): Put-heavy — strong institutional hedging or bearish bets. Put wall acts as magnetic support. Below put wall, selling accelerates.',
    source: 'NSE India options chain API (nseindia.com/api/option-chain-indices?symbol=NIFTY)',
  },
  // ── FII vs DII (REFINEMENT #3) ───────────────────────────────────────────────
  'FII vs DII Flows': {
    definition: 'FII (Foreign Institutional Investors) / FPI (Foreign Portfolio Investors) are overseas funds investing in Indian markets. DII (Domestic Institutional Investors) includes Indian mutual funds, insurance companies, and banks. Flows are net Buy minus Sell in ₹ Crores for the most recent trading day.',
    meaning: 'FII flows drive Indian market direction — they are the dominant force. Positive FII net = foreign money coming in = bullish. Negative = foreign selling = bearish. DIIs typically act as counterbalance, buying when FIIs sell (supporting the market).',
    high: 'FII Net > +2000 Cr: Strong foreign buying. Bullish signal. NIFTY likely to rally. Options: buy calls, avoid selling premium into strength.',
    low: 'FII Net < −2000 Cr: Heavy FII selling. Bearish pressure. NIFTY likely weak. Watch for DII buying at support to stabilize.',
    source: 'NSE India (nseindia.com/reports/fii-dii and /api/fiidiiTradeReact)',
  },
  // ── Max Pain ─────────────────────────────────────────────────────────────────
  'Max Pain': {
    definition: 'The NIFTY price level at which the total value of outstanding options (calls + puts) is minimized — i.e., options sellers profit most.',
    meaning: 'Expiry week: NIFTY is gravitationally pulled toward Max Pain as market makers manage their book. Important expiry-level forecast.',
    high: 'Spot well above Max Pain: Expect gradual drift downward toward Max Pain on expiry week.',
    low: 'Spot well below Max Pain: Expect upward drift as market makers push spot toward their profit zone.',
    source: 'Calculated from NSE options chain open interest data',
  },
  'PCR': {
    definition: 'Put-Call Ratio (OI-based) — total Put Open Interest divided by total Call Open Interest. Key sentiment indicator.',
    meaning: 'PCR > 1.2: Market is hedging heavily (bearish sentiment, but contrarian buy signal). PCR < 0.8: Complacency (potential top).',
    high: 'PCR > 1.5: Extreme put buying = deep fear = contrarian BULLISH signal. Market may be near bottom.',
    low: 'PCR < 0.7: Extreme call buying = euphoria = contrarian BEARISH signal. Watch for correction.',
    source: 'Calculated from NSE options chain open interest data',
  },
  'Options Chain Bias': {
    definition: 'The directional bias derived from comparing total Call OI vs Put OI across the entire options chain.',
    meaning: 'Put Heavy = more downside protection bought (institutional hedging). Call Heavy = bullish speculation dominant.',
    high: 'Call Heavy: Bullish expectations dominant. Market makers short calls → gamma exposure to upside.',
    low: 'Put Heavy: Bearish fear or hedging dominant. Market makers short puts → supports downside.',
    source: 'Calculated from NSE options chain open interest',
  },
  'Technical Bias': {
    definition: 'Composite bias from: RSI position, MACD histogram sign, price vs MA50/MA200, and weekly RSI. Scoring model.',
    meaning: 'Provides a single-word summary of all technical indicators combined for quick decision making.',
    high: 'Bullish: 4+ of 5 technical indicators aligned bullishly. High-conviction buy signals across timeframes.',
    low: 'Bearish: 4+ of 5 technical indicators aligned bearishly. High-conviction short/put-buying environment.',
    source: 'Calculated from NSE/Yahoo Finance OHLCV multi-indicator model',
  },
  'Structure Bias': {
    definition: 'The market structure trend based on price relative to key moving averages (MA50 and MA200).',
    meaning: 'Bull structure: price > MA50 > MA200 (healthy uptrend). Bear structure: price < MA50 < MA200.',
    high: 'Bullish: All MAs stacked correctly. Trend-following long strategies preferred.',
    low: 'Bearish: MAs stacked in bear order. Trend-following short strategies or cash preferred.',
    source: 'Calculated from NSE/Yahoo Finance MA data',
  },
  // ── Elliott Wave per-wave definitions (REFINEMENT #5) ──────────────────────
  'Elliott Wave 1': {
    definition: 'Wave 1 is the first impulse wave in a new bullish cycle. It often goes unrecognised as a rally within a bear market. Characterised by low volume and public skepticism.',
    meaning: 'In NIFTY context: Wave 1 often starts from a major support zone after Wave C (bear market bottom). RSI turns from oversold, price crosses above 20-week MA. A nascent bullish trend is beginning.',
    high: 'High probability of Wave 1 completion: Confirms the new uptrend has started. Buy calls at support; entering early in the cycle gives best risk/reward. Wave 2 pullback will follow — use it to add positions.',
    low: 'Low probability: Wave 1 may fail / be a bear market rally. Keep stops tight. Confirm with volume and RSI holding above 40.',
    source: 'Standard Elliott Wave Theory (R.N. Elliott) + NSE price action confirmation',
  },
  'Elliott Wave 2': {
    definition: 'Wave 2 is a corrective wave that retraces Wave 1, typically 50–78.6% (Fibonacci). It tests investor conviction. Volume is lower than Wave 1.',
    meaning: 'In NIFTY context: Wave 2 creates a buying opportunity — the "second chance" to enter the bull trend. RSI dips but stays above 40. Price stays above Wave 1 origin (critical rule — if violated, it is NOT Wave 2).',
    high: 'High probability of Wave 2 bottom: Excellent buy signal. Enter with tight stop below Wave 1 origin. This is the lowest-risk entry for the upcoming Wave 3 (typically the strongest wave).',
    low: 'Low probability: Wave 2 may extend deeper or the structure may shift. If price breaks Wave 1 origin, the bullish count is invalid.',
    source: 'Standard Elliott Wave Theory (R.N. Elliott) + NSE price action confirmation',
  },
  'Elliott Wave 3': {
    definition: 'Wave 3 is the strongest and most profitable impulse wave. It cannot be the shortest of waves 1, 3, 5. Typically extends 1.618x Wave 1 (Fibonacci). Volume surges. Strong bullish momentum.',
    meaning: 'In NIFTY context: Wave 3 drives the most significant bull run. FIIs accumulate, MACD accelerates, RSI > 60. All retail participation eventually joins. The highest-conviction bullish environment.',
    high: 'High probability of Wave 3 extension (>1.618x): Maximum bull momentum. Aggressive call buying / bull spreads appropriate. Target = Wave 1 length × 1.618 added to Wave 2 low.',
    low: 'Low probability / Wave 3 truncating: Early warning of exhaustion. Reduce long exposure; start watching for Wave 4 setup.',
    source: 'Standard Elliott Wave Theory (R.N. Elliott) + NSE price action confirmation',
  },
  'Elliott Wave 4': {
    definition: 'Wave 4 is a corrective wave after the Wave 3 peak. It is typically less deep than Wave 2 (often 23.6–38.2% Fibonacci retracement of Wave 3). Wave 4 often consolidates sideways.',
    meaning: 'In NIFTY context: Wave 4 is the "pause before the final push." It must not overlap with Wave 1 territory. Options traders use this range to sell premium (straddles, iron condors) as the market consolidates.',
    high: 'High probability of Wave 4 bottom: Prepare for Wave 5 (final bullish push). Buy calls near Wave 4 support. Sell puts to fund call buying.',
    low: 'Low probability: Wave 4 may deepen into Wave 1 territory (rule violation). If so, recount — the structure may be Wave A/B/C instead.',
    source: 'Standard Elliott Wave Theory (R.N. Elliott) + NSE price action confirmation',
  },
  'Elliott Wave 5': {
    definition: 'Wave 5 is the final impulse wave of the bullish cycle. Often narrower than Wave 3. RSI may diverge negatively (price makes new high but RSI does not). Volume often lower than Wave 3.',
    meaning: 'In NIFTY context: Wave 5 is the "last hurrah" of the bull market. Extreme optimism at top. The start of a corrective ABC down follows. Monitor negative RSI divergence as the early warning.',
    high: 'High probability of Wave 5 extension: Be cautious with long options — time decay may hurt. Consider selling OTM call spreads to profit from the final push with limited risk, or buying protective puts.',
    low: 'Low probability / Wave 5 truncation (fails to set new high): Very bearish signal — market is weak. The corrective wave A has likely already started. Switch to bearish strategies immediately.',
    source: 'Standard Elliott Wave Theory (R.N. Elliott) + NSE price action confirmation',
  },
  'Elliott Wave A': {
    definition: 'Wave A is the first corrective wave after a completed 5-wave impulse. It initiates the bearish correction. Many traders mistake it for a temporary dip to buy — dangerous.',
    meaning: 'In NIFTY context: Wave A is the initial sharp decline from the Wave 5 top. Volume picks up on the sell-off. RSI crosses below 50. FIIs begin net selling. The key signal that the bull cycle has ended.',
    high: 'High probability of Wave A in progress: Sell rallies. Avoid long calls. Buy protective puts or bear spreads. Do NOT buy the dip — Wave C will make a new low.',
    low: 'Low probability: Wave A may be just a Wave 4 pullback in an ongoing impulse. Wait for clear break of Wave 4 low to confirm the corrective cycle.',
    source: 'Standard Elliott Wave Theory (R.N. Elliott) + NSE price action confirmation',
  },
  'Elliott Wave B': {
    definition: 'Wave B is a counter-trend rally within the larger corrective ABC structure. It often retraces 50–78.6% of Wave A. Trap for bulls — appears to be a new Bull run resuming.',
    meaning: 'In NIFTY context: Wave B is the "dead cat bounce" — temporary relief rally that fools retail. Volume on Wave B is usually lower than Wave A. Key opportunity: sell the rally or buy puts near Wave B top.',
    high: 'High probability of Wave B top: Prime opportunity to enter bearish positions. Sell calls / buy puts. Wave C (the most damaging wave in corrections) follows. Risk/reward is excellent.',
    low: 'Low probability: Wave B may extend (irregular correction). If Wave B exceeds Wave 5 high, reassess — a new impulse may have started.',
    source: 'Standard Elliott Wave Theory (R.N. Elliott) + NSE price action confirmation',
  },
  'Elliott Wave C': {
    definition: 'Wave C is the final and most aggressive corrective wave. It equals Wave A in length (or extends to 1.618x). Often the most emotionally painful sell-off, panic-driven.',
    meaning: 'In NIFTY context: Wave C sees FII capitulation, retail panic, and maximum bearish news. RSI reaches oversold. VIX spikes. The bottom of Wave C is the best long-term buying opportunity for the next 5-wave cycle.',
    high: 'High probability of Wave C approaching completion: Extreme fear = buy opportunity. Begin accumulating NIFTY calls or ETFs at support zones. Avoid increasing short positions near Wave C end.',
    low: 'Low probability: Wave C may extend further. Apply Fibonacci extensions (1.618x, 2.0x Wave A) as potential targets. Do not call the bottom early.',
    source: 'Standard Elliott Wave Theory (R.N. Elliott) + NSE price action confirmation',
  },
  'Elliott Wave A/C': {
    definition: 'The current market position is in a corrective ABC cycle — either Wave A (initial decline) or Wave C (final decline). Both phases are bearish. The market is correcting a prior 5-wave bull impulse.',
    meaning: 'In NIFTY context: This signals a bearish correction phase with potential for 8–15% drawdown depending on severity. RSI < 45, price below key MAs, VIX elevated. Avoid aggressive buying until Wave C completes.',
    high: 'High probability that A/C is nearly done: Start looking for bullish reversal signals — RSI divergence, VIX spike then decline, high-volume capitulation days. Phase-in long positions carefully.',
    low: 'Low probability / early in correction: Remain defensive. Sell rallies. Use bear spreads or long puts. Protect existing holdings with hedges.',
    source: 'Standard Elliott Wave Theory (R.N. Elliott) + NSE price action confirmation',
  },
  // ── Support & Resistance (REFINEMENT #6) ──────────────────────────────────────
  'Support Zones': {
    definition: 'Price levels where buying pressure has historically overwhelmed selling, causing price to reverse upward. Derived from classical pivot point calculation using last 5 daily bars (High + Low + Close ÷ 3 as pivot, then projections below).',
    meaning: 'For options traders: Support zones define where put writers will defend strikes. Buying calls near support gives favorable risk/reward. Put buyers should place targets before support. Support = floor where sellers become scarce.',
    high: 'Price at/near support AND bouncing: High-conviction long entry zone. Buy OTM calls or enter bull call spreads. The risk/reward is best here.',
    low: 'Price breaks BELOW support (support becomes resistance): Bearish confirmation. Exit longs immediately. Buy puts targeting the next support level (S2, S3). Expect accelerated selling.',
    source: 'Classical Pivot Point formula (DeMark/Floor Trader) — calculated from NSE/Yahoo Finance OHLCV data',
  },
  'Resistance Zones': {
    definition: 'Price levels where selling pressure has historically overwhelmed buying, causing price to reverse downward. Derived from pivot calculations (projections above the pivot point).',
    meaning: 'For options traders: Resistance zones define where call writers defend strikes (Call Wall aligns with resistance). Buy puts near resistance for high-probability reversals. Resistance = ceiling where buyers become exhausted.',
    high: 'Price breaks ABOVE resistance (resistance flips to support): Extremely bullish. Aggressive call buying / add to longs. Next resistance becomes the new target.',
    low: 'Price stalls at resistance and rejects: Bearish reversal setup. Sell calls (if IV is high enough), buy puts, scale out of long positions. Classic option premium-selling opportunity.',
    source: 'Classical Pivot Point formula (DeMark/Floor Trader) — calculated from NSE/Yahoo Finance OHLCV data',
  },
  'Classical Pivot Points': {
    definition: 'Floor trader pivot points calculated from the previous session\'s High (H), Low (L), Close (C): P = (H+L+C)/3, R1 = 2P−L, R2 = P+(H−L), R3 = H+2(P−L), S1 = 2P−H, S2 = P−(H−L), S3 = L−2(H−P).',
    meaning: 'Pivot points are the most widely used institutional intraday and swing levels. The central Pivot (P) acts as the bias switch — above P = bullish intraday; below P = bearish. Used by prop desks, HFTs, and algorithmic systems globally.',
    high: 'Price above central Pivot (P) all session: Bullish day. Target R1, R2. Options: buy ATM/slightly OTM calls at open for intraday move.',
    low: 'Price below central Pivot (P): Bearish day. Target S1, S2. Options: put buying at pivot retest for entries.',
    source: 'Standard Classical Pivot Point formula — NSE OHLCV data via Yahoo Finance (^NSEI)',
  },
  'Gamma Exposure': {
    definition: 'Gamma Exposure (GEX) measures the total dollar (₹) gamma of all outstanding option positions scaled by open interest and lot size. Net GEX = Σ(CE gamma × CE OI − PE gamma × PE OI) × lot size × spot.',
    meaning: 'GEX tells you how market makers (dealers) will REACT to price moves. Positive GEX: dealers are long gamma → they sell rallies and buy dips → market is range-bound. Negative GEX: dealers are short gamma → they buy rallies and sell dips → moves are AMPLIFIED.',
    high: 'High Positive GEX (> ₹5B): Dealers long gamma — they dampen volatility. Market stays in range. Sell premium (straddles, condors) as realized vol will be low.',
    low: 'Negative GEX / Gamma Squeeze ACTIVE: Dealers short gamma — every move gets amplified. BUY directional options for explosive moves. Avoid selling naked premium.',
    source: 'Calculated from NSE options chain (GEX = Σ gamma × OI × lot size × spot). Lot Size = 65',
  },
  // ── Macro tooltips (REFINEMENT #8) ─────────────────────────────────────────
  'Brent Oil (LCO)': {
    definition: 'Brent Crude Oil — the international benchmark for crude oil prices sourced from the North Sea. Priced in USD per barrel (bbl). Ticker: BZ=F.',
    meaning: 'India imports 85%+ of its crude oil, primarily Brent-linked. Rising Brent = higher inflation + wider Current Account Deficit + rupee weakness = negative for Indian equities and monetary policy.',
    high: 'Brent > $90/bbl: Inflationary pressure in India. RBI may delay rate cuts or hike. FIIs exit EM equities. Rupee weakens. Bearish for NIFTY, especially consumer and paint sectors.',
    low: 'Brent < $70/bbl: Reduces India\'s import bill, improves CAD, eases inflation. Positive for INR, bonds, and equities. Potential for RBI rate cuts = rally fuel.',
    source: 'Yahoo Finance (BZ=F)',
  },
  'Crude Oil WTI': {
    definition: 'West Texas Intermediate — the US domestic crude oil benchmark. Slightly lighter than Brent. Traded on NYMEX. Ticker: CL=F. Usually trades $2–5 below Brent.',
    meaning: 'Tracks Brent closely. WTI movements signal global oil demand-supply dynamics, US shale production levels, and OPEC+ policy. India\'s oil companies reference Brent, but WTI leads global sentiment.',
    high: 'WTI > $85/bbl: Global demand strong OR supply constrained (OPEC+ cuts). Similar negative impact on India as Brent — higher fuel costs, inflation, CAD pressure.',
    low: 'WTI < $65/bbl: Oversupply or demand weakness (global slowdown signal). Positive for India\'s trade balance. Watch for recessionary implications in US/global growth.',
    source: 'Yahoo Finance (CL=F)',
  },
  'Gold': {
    definition: 'Spot gold price in USD per troy ounce, the global safe-haven asset.',
    meaning: 'Rising gold = risk-off sentiment globally. Indicates fear, geopolitical risk, or USD weakness.',
    high: 'Gold surging: Safe-haven demand. Risk-off globally. FIIs may exit equities. Bearish for NIFTY short-term.',
    low: 'Gold falling: Risk-on mode. Equities preferred over safe-havens. Positive for NIFTY.',
    source: 'Yahoo Finance (GC=F)',
  },
  'Silver': {
    definition: 'Spot silver price in USD per troy ounce. Both safe-haven and industrial metal.',
    meaning: 'Silver tracks gold for safe-haven demand, but also reflects industrial production outlook (EV, solar).',
    high: 'High silver: Risk-off OR strong industrial demand. Watch gold-silver ratio for signals.',
    low: 'Low silver: Weak industrial demand or risk-on (gold not needed). Neutral-to-positive for equities.',
    source: 'Yahoo Finance (SI=F)',
  },
  'Dow Jones': {
    definition: 'Dow Jones Industrial Average — price-weighted index of 30 major US blue-chip companies.',
    meaning: 'NIFTY and Dow have 70%+ correlation over medium-term. US market direction sets overnight sentiment for India.',
    high: 'Dow rallying: Positive global equity sentiment. FIIs buy EM equities. Bullish pre-open for NIFTY.',
    low: 'Dow falling significantly: Global risk-off. FIIs sell India. Gap-down open for NIFTY.',
    source: 'Yahoo Finance (^DJI)',
  },
  'Nasdaq 100 (US Tech)': {
    definition: 'Nasdaq 100 — tracks 100 largest non-financial US companies, dominated by mega-cap tech (Apple, Microsoft, Nvidia).',
    meaning: 'Indian IT stocks (Infosys, TCS, Wipro) track Nasdaq closely. Nasdaq moves directly impact NIFTY IT components.',
    high: 'Nasdaq rallying: IT sector strength → Positive for NIFTY (IT is 12%+ weight). Risk appetite high.',
    low: 'Nasdaq falling: IT selling → NIFTY IT drags. Tech valuations compress.',
    source: 'Yahoo Finance (^NDX)',
  },
  'S&P 500': {
    definition: 'S&P 500 — market-cap weighted index of 500 largest US public companies. Key global benchmark.',
    meaning: 'Strongest single global indicator for FII sentiment toward emerging markets including India.',
    high: 'S&P 500 bull run: Ample global liquidity. FIIs deploy capital in EM. Bullish for NIFTY.',
    low: 'S&P 500 bear: Risk-off, dollar strengthens, FIIs pull money from EM. Bearish for NIFTY.',
    source: 'Yahoo Finance (^GSPC)',
  },
  'USD/INR': {
    definition: 'US Dollar to Indian Rupee exchange rate. How many rupees per 1 USD.',
    meaning: 'Rupee depreciation = higher inflation + import costs + FII outflows. Strong rupee = stability + FII confidence.',
    high: 'USD/INR rising (rupee weakening): Negative for FII returns on India investments → FII selling pressure.',
    low: 'USD/INR falling (rupee strengthening): Positive for FII returns → attracts foreign flows → bullish for NIFTY.',
    source: 'Yahoo Finance (USDINR=X)',
  },
  'EUR/USD': {
    definition: 'Euro to US Dollar exchange rate. Most traded currency pair globally. Indicator of USD strength.',
    meaning: 'Strong EUR/USD = weak USD = positive for EM commodities and foreign capital flows to India.',
    high: 'EUR/USD high (USD weak): Commodities rise, EM gets inflows, gold rises. Mixed for NIFTY.',
    low: 'EUR/USD low (USD strong): Commodities fall, EM outflows accelerate. Negative for NIFTY.',
    source: 'Yahoo Finance (EURUSD=X)',
  },
  'FTSE 100': {
    definition: 'UK\'s FTSE 100 index — 100 largest companies on the London Stock Exchange.',
    meaning: 'European market health indicator. FIIs managing global portfolios track UK/EU markets alongside India.',
    high: 'FTSE rallying: Global risk appetite strong. Positive for broader EM equities.',
    low: 'FTSE falling: European risk-off. May indicate global macro headwinds.',
    source: 'Yahoo Finance (^FTSE)',
  },
  'Hang Seng (Hong Kong)': {
    definition: 'Hang Seng Index — benchmark for Hong Kong-listed securities, heavily weighted toward Chinese equities (Alibaba, Tencent, HSBC, etc.). Tracks China macro health.',
    meaning: 'China is India\'s largest trading partner and competitor for FII allocation. Hang Seng rallies = China growth optimism → may draw FII capital from India short-term OR signal positive Asian EM flows.',
    high: 'Hang Seng surging (>+2%): China rebound narrative strong. Positive Asian sentiment may spill into India. Watch whether FIIs rotate INTO China (negative for India) or treat it as rising tide for all EM.',
    low: 'Hang Seng falling (>−2%): China growth fears, regulatory crackdowns, or geopolitical tensions. FIIs may prefer India as China-alternative EM. Relative outperformance of India vs China is bullish for FII India flows.',
    source: 'Yahoo Finance (^HSI)',
  },
  'News Sentiment': {
    definition: 'Aggregated sentiment score across recent financial news from Economic Times, Moneycontrol, Reuters, Livemint, Business Line.',
    meaning: 'Quantifies whether current news flow is net positive or negative for Indian equity markets.',
    high: 'Majority Bullish: Positive macro catalysts, rate cuts, strong earnings, FII buying. Supports upside.',
    low: 'Majority Bearish: Geopolitical risk, rate hikes, FII selling, weak global cues. Pressure on NIFTY.',
    source: 'RSS feeds: Economic Times, Moneycontrol, Reuters, Livemint, Business Line, Business Standard, CNBC TV18',
  },
  // ── OI Chart per-metric tooltips ──────────────────────────────────────────
  'Total CE OI': {
    definition: 'Total Call Open Interest — the sum of all outstanding call option contracts across all strike prices for the nearest expiry.',
    meaning: 'High CE OI = heavy call writing by institutions = resistance. Total CE OI rising = bearish pressure building.',
    high: 'Rising total CE OI: Bearish — institutions selling calls aggressively, expecting market to stay below call wall.',
    low: 'Falling total CE OI: Call unwinding — reduces resistance overhead. Bullish if PCR rises.',
    source: 'NSE India options chain API (nseindia.com/api/option-chain-indices?symbol=NIFTY)',
  },
  'Total PE OI': {
    definition: 'Total Put Open Interest — the sum of all outstanding put option contracts across all strike prices for the nearest expiry.',
    meaning: 'High PE OI = heavy put writing = strong support. Rising PE OI = institutions confident market holds above put wall.',
    high: 'Rising total PE OI: Institutions selling puts → expect market to hold above support. Bullish confidence signal.',
    low: 'Falling total PE OI: Put unwinding — support weakening. Bearish if accompanied by rising CE OI.',
    source: 'NSE India options chain API (nseindia.com/api/option-chain-indices?symbol=NIFTY)',
  },
  'Call Wall': {
    definition: 'The strike price with the highest call open interest. Acts as the strongest resistance level from options positioning.',
    meaning: 'Market makers who sold calls hedge by selling the underlying near call wall, creating real selling pressure at that strike.',
    high: 'Very high CE OI at call wall: Extremely strong resistance — unlikely to break without a major catalyst.',
    low: 'Low CE OI at call wall: Weak resistance — market can push through more easily.',
    source: 'NSE India options chain API (nearest expiry)',
  },
  'Put Wall': {
    definition: 'The strike price with the highest put open interest. Acts as the strongest support level from options positioning.',
    meaning: 'Market makers who sold puts hedge by buying the underlying near put wall, creating real buying support.',
    high: 'Very high PE OI at put wall: Very strong support — unlikely to break below without a major event.',
    low: 'Low PE OI at put wall: Weak support — increased risk of breakdown.',
    source: 'NSE India options chain API (nearest expiry)',
  },
  'Net OI Change': {
    definition: 'Net change in Open Interest for the day = change in CE OI − change in PE OI. Measures directional money flow into options.',
    meaning: 'Positive: More calls being added than puts = bearish positioning. Negative: more puts added = bullish positioning.',
    high: 'Positive & large: Aggressive call writing — strong bearish bet from institutions.',
    low: 'Negative & large: Aggressive put writing — strong bullish bet. Institutions confident market holds support.',
    source: 'NSE India options chain API',
  },
  // ── Predictive Synthesis & Neo Waves ─────────────────────────────────────
  'Global AI Prediction Engine': {
    definition: 'Mathematical synthesis matrix computing deterministic Gap thresholds and Session Trajectories by merging Macro Data, Neo-Wave structures, Gamma squeezes, and FII aggregates.',
    meaning: 'Highly aggregated top-level engine that removes subjective emotional charting by physically colliding all backend variables against options pricing formulas to derive empirical outputs.',
    high: 'Predicted output shows high confidence (e.g. > 85% Gap Up). Extreme multi-algorithm confluence.',
    low: 'Output shows low confidence (~50%). Market implies heavy structural deadlock.',
    source: 'Algorithm Backend Pipeline',
  },
  'Neo Wave Extensions': {
    definition: 'Advanced Elliott Wave expansion enforcing explicit time and proportionality criteria (Rule of Neutrality, Diametric structures) to eliminate subjectivity in standard Elliott counts.',
    meaning: 'Stricter, more deterministic logic than standard Elliott Waves. If a Neo Wave overlaps unexpectedly, standard ABC formations convert into Diametric 7-leg setups.',
    high: 'Confirmation of active Impulsive Mono-waves indicating pure undiluted directional momentum.',
    low: 'Invalidation of structural timeframe leading to tight Stops and corrective distribution.',
    source: 'Neo Wave Heuristics Processor',
  },
  'Neo Wave Monowave': {
    definition: 'The fundamental unit of Neo Wave theory. A single, uncorrected directional price movement between two pivotal points.',
    meaning: 'Indicates pure, relentless momentum. Valid until price retraces heavily and violates proportional bounds.',
    high: 'Strong impulsive move; trend continuation highly probable without immediate hedges.',
    low: 'Exhausted Monowave implies imminent consolidation.',
    source: 'Neo Wave Structural Matrix',
  },
  'Neo Wave Diametric Formations': {
    definition: 'A 7-legged structural pattern (A-B-C-D-E-F-G) uniquely defined by Neo Wave. Driven by the Rule of Neutrality where overlapping time/price logic prevents standard impulse behavior.',
    meaning: 'The market is experiencing a complex contracting or expanding consolidation where no single direction sustains.',
    high: 'Late-stage formation (Leg F/G) indicating an explosive impending breakout as time-rules exhaust.',
    low: 'Early-stage formation causing extreme choppy conditions. Avoid directional trades.',
    source: 'Neo Wave Structural Matrix',
  },
  'Neo Wave Bias': {
    definition: 'Algorithmic systemic bias specifically derived from the structural progression of the Neo Wave cycle.',
    meaning: 'Provides a directional skew confirming whether the identified Neo Wave implies upward momentum or downward distribution.',
    high: 'Bullish Bias aligns with upward leg progression.',
    low: 'Bearish Bias aligns with downward distribution legs.',
    source: 'Neo Wave Structural Matrix',
  },
  'Neo Wave Time-rule Invalidated (Stop)': {
    definition: 'Crucial Neo Wave time limit threshold. If price breaks this level, the active pattern has taken too much time strictly violating mathematical ratios of the origin wave.',
    meaning: 'Acts as a strict, emotionless Stop-Loss. Time-rule violations mean the entire wave structure must be dynamically recounted.',
    high: 'Extreme market volatility shattering the modeled formation geometry.',
    low: 'Normal, contained variance inside expected time algorithms.',
    source: 'Neo Wave Heuristics Processor',
  },
  'Neo Wave Contraction (Leg F/G)': {
    definition: 'The final, tightening consolidation phase of a 7-legged Diametric structure, trapping institutional volume inside a decreasing range.',
    meaning: 'Implies the market is fiercely compressing like a coiled spring. The breakout following Leg G is typically extremely sharp and heavily trend-defining.',
    high: 'Breakout imminent. IV expansion likely.',
    low: 'Sustained choppy whip-sawing; avoid directional positions.',
    source: 'Neo Wave Heuristics Processor',
  },
  'Neo Wave Wave E / F': {
    definition: 'The mid-to-late intermediary phase within a complex Diametric structure. Typically, these legs demonstrate overlapping indecisive swings.',
    meaning: 'The market is purposefully accumulating or distributing structurally without yielding an exact top or bottom to trigger momentum formulas.',
    high: 'Violent chop meant to burn options premium decay (Theta).',
    low: 'Sustained sideways ranging action.',
    source: 'Neo Wave Heuristics Processor',
  },
  'Neo Wave Diametric (7-Legged)': {
    definition: 'An advanced, structurally complex correction pattern exclusively analyzed via Neo Wave theory consisting of 7 distinct legs (A-B-C-D-E-F-G).',
    meaning: 'Triggered when Elliott assumptions overlap too heavily. Indicates a uniquely prolonged triangular consolidation governed explicitly by the Rule of Neutrality where no leg is severely longer/deeper than the prior.',
    high: 'Deep structural churn eliminating weak hands from both the bull and bear side.',
    low: 'Lack of macro catalysts forcing internal structural resets.',
    source: 'Neo Wave Heuristics Processor',
  },
  'Predicted Gap Probability': {
    definition: 'Global systemic probability determining the likelihood of an overnight Gap Up or Gap Down at the start of the next trading session.',
    meaning: 'Combines after-hours global macro shifts (Dow, S&P) with institutional delivery tracking (FII Net) to formulate a strict directional open momentum probability.',
    high: 'High probability gap assumes extreme overnight momentum disparity.',
    low: 'Low probability gap suggests a flat, consolidated open mirroring the previous close.',
    source: 'Predictive Synthesis AI',
  },
  'Prediction: Gap Up': {
    definition: 'Algorithm projects the market will open aggressively above previous close.',
    meaning: 'Driven by massive positive FII accumulation and bullish global metrics aligning synchronously.',
    high: 'Extremely bullish pre-open momentum.',
    low: 'Fade the gap if intraday options metrics conflict.',
    source: 'Predictive Synthesis AI',
  },
  'Prediction: Gap Down': {
    definition: 'Algorithm projects the market will breach previous close significantly downwards at open.',
    meaning: 'Triggered by aggressive systemic selling pressure, negative macros, or bearish Put structures.',
    high: 'Extremely bearish pre-open selloff.',
    low: 'Buy-the-dip opportunity if support holds immediately upon gap termination.',
    source: 'Predictive Synthesis AI',
  },
  'Prediction: Flat Open': {
    definition: 'Algorithm projects NIFTY to open largely unchanged within normal variance of the prior close.',
    meaning: 'Implies balanced institutional books and inert global macro forces.',
    high: 'Non-directional opening block.',
    low: 'Option sellers crush IV aggressively at open.',
    source: 'Predictive Synthesis AI',
  },
  'Projected Opening Target': {
    definition: 'The explicitly calculated absolute NIFTY strike boundary computed for the instantaneous morning flash open.',
    meaning: 'Derived strictly against the weighted Gap momentum vectors overlaid precisely on current spot prices.',
    high: 'Upward magnet targeting short liquidation.',
    low: 'Downward magnet triggering stop-losses heavily.',
    source: 'Predictive Synthesis AI',
  },
  'Gap AI Probability Confidence': {
    definition: 'The literal algorithmic confidence score anchoring the specific overnight gap magnitude calculation.',
    meaning: 'Reflects the mathematical coherence among the independent input metrics. If all inputs identically project upwards, the score maximizes.',
    high: 'Extreme unified directional volume.',
    low: 'Clashing inputs leading to higher opening volatility and false breakouts.',
    source: 'Predictive Synthesis AI',
  },
  'Predicted Settlement Matrix': {
    definition: 'A composite target matrix calculating the terminal end-of-session (3:30 PM) settlement zone.',
    meaning: 'Extrapolates intraday algorithmic gravity to determine if bulls or bears control the settlement fixing.',
    high: 'Bulls overwhelming daily distribution to force high expiry.',
    low: 'Bears trapping rallies forcing decay towards lower bounds.',
    source: 'Predictive Synthesis AI',
  },
  'Projected Settlement Target': {
    definition: 'The exact theoretical closing price determined by the option chain gravitational pull and structural technical exhaustion.',
    meaning: 'Synthesizes spot drifting relative to explicitly mapped Upstox Max Pain limits.',
    high: 'Closing price is massively detached from current spot, implying aggressive afternoon trending.',
    low: 'Tightly pinned to current local pivots implying sideways bleed towards expiry.',
    source: 'Predictive Synthesis AI',
  },
  'Trajectory: Bullish Drift': {
    definition: 'The systemic trajectory anticipates a slow, grinding escalation of prices traversing linearly toward higher limits.',
    meaning: 'Implies steady demand outstripping supply continuously throughout the session.',
    high: 'High conviction drift creates immense intraday trending profits for Call buyers.',
    low: 'Failure to sustain drift reverts market sideways.',
    source: 'Predictive Synthesis AI',
  },
  'Trajectory: Bearish Fade': {
    definition: 'The systemic trajectory anticipates morning rallies violently decaying into intense persistent downward distribution.',
    meaning: 'Short sellers aggressively defend overhead call walls leading to a cascading sink into settlement.',
    high: 'Put buyers feast as IV escalates and delta heavily bleeds long portfolios.',
    low: 'A temporary dip buying sequence invalidating the bearish drift.',
    source: 'Predictive Synthesis AI',
  },
  'Trajectory: Rangebound': {
    definition: 'The market is strictly entrapped between massive Call and Put OI walls triggering brutal Gamma hedging suppression.',
    meaning: 'No explicit trend forms. The market oscillates tightly as dealers dampen all momentum aggressively.',
    high: 'Extreme theta decay crushes all directional option buyers.',
    low: 'Breakout imminent if volatility expands against dealer positioning.',
    source: 'Predictive Synthesis AI',
  },
  'Close AI Probability Confidence': {
    definition: 'The mathematical structural integrity of the closing settlement projection based on confluence of intra-day parameters.',
    meaning: 'If Max Pain, Gamma exposure, and technical bias all point to the equivalent zone, this maximizes.',
    high: 'Highly coordinated market conditions enforcing rigorous settlement boundaries.',
    low: 'Low clarity leading to dramatic closing hour (3:00 PM) massive volatility spikes.',
    source: 'Predictive Synthesis AI',
  },
};

// ─── Tooltip Popover Component ────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

export function InfoTooltip({ metric, dynamicReasons, contextText }) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState({});
  const popRef = useRef(null);
  const btnRef = useRef(null);
  const info = TOOLTIPS[metric] || {
    definition: `Algorithmic subsystem variable mapping specifically to tracked metrics under ${metric}.`,
    meaning: 'Natively computed variable from dynamic systemic data flows indicating instantaneous structural intent.',
    high: 'Active structural alignment triggering high algorithmic weight.',
    low: 'Inert or inversely correlated mapping limiting directional confidence.',
    source: 'Real-time Analytics Engine'
  };

  useEffect(() => {
    if (!open) return;

    const updatePos = () => {
      if (!btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      const W = 320;
      
      const spaceBelow = window.innerHeight - rect.bottom - 16;
      const spaceAbove = rect.top - 16;
      const alignUp = spaceAbove > spaceBelow && spaceBelow < 280; 
      
      let calculatedLeft = rect.left > window.innerWidth * 0.5 ? rect.right - W : rect.left;
      
      if (calculatedLeft + W > window.innerWidth - 8) {
        calculatedLeft = window.innerWidth - W - 8;
      }
      calculatedLeft = Math.max(8, calculatedLeft);
      
      const dynamicMaxH = alignUp ? Math.max(200, spaceAbove) : Math.max(200, spaceBelow);
      
      setStyle({
        position: 'fixed',
        zIndex: 999999,
        top: alignUp ? undefined : rect.bottom + 8,
        bottom: alignUp ? window.innerHeight - rect.top + 8 : undefined,
        left: calculatedLeft,
        width: W,
        maxWidth: `calc(100vw - 16px)`,
        maxHeight: `${dynamicMaxH}px`,
      });
    };

    updatePos();

    const scrollHandler = () => updatePos();
    window.addEventListener('scroll', scrollHandler, { capture: true, passive: true });
    window.addEventListener('resize', scrollHandler, { passive: true });

    const mousedownHandler = (e) => {
      if (
        popRef.current && !popRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', mousedownHandler);

    return () => {
      window.removeEventListener('scroll', scrollHandler, { capture: true, passive: true });
      window.removeEventListener('resize', scrollHandler, { passive: true });
      document.removeEventListener('mousedown', mousedownHandler);
    };
  }, [open]);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen((v) => !v);
  };

  const tooltipContent = (
    <div
      ref={popRef}
      className="overflow-y-auto bg-white dark:bg-gray-950/95 border border-gray-200 dark:border-cyan-500/20 rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] dark:shadow-2xl p-4 text-xs dark:backdrop-blur-xl animate-fade-in text-left cursor-default break-words"
      style={style}
    >
      <div className="font-semibold text-blue-900 dark:text-cyan-300 mb-2 flex items-center gap-1.5">
        <Info size={12} className="text-blue-600 dark:text-cyan-500" />
        {metric}
      </div>
      
      {/* Dynamic Context Injection */}
      {((dynamicReasons && dynamicReasons.length > 0) || contextText) && (
        <div className="mb-3 bg-blue-50 dark:bg-cyan-950/30 border border-blue-200 dark:border-cyan-500/20 p-2.5 rounded-lg">
          <p className="text-blue-800 dark:text-cyan-400 font-bold text-[10px] uppercase mb-1.5 tracking-wider font-mono">Live Predictive Drivers</p>
          {contextText && <p className="text-gray-800 dark:text-gray-200 mb-2 leading-relaxed font-medium">{contextText}</p>}
          {dynamicReasons && dynamicReasons.length > 0 && (
            <ul className="space-y-1.5">
              {dynamicReasons.map((reason, idx) => (
                <li key={idx} className="text-gray-800 dark:text-gray-200 flex items-start gap-1.5">
                  <span className="text-blue-600 dark:text-cyan-500 mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="text-gray-800 dark:text-gray-300 mb-2"><span className="text-gray-500 font-bold">Definition: </span>{info.definition}</p>
      <p className="text-gray-800 dark:text-gray-300 mb-2"><span className="text-gray-500 font-bold">Trading context: </span>{info.meaning}</p>
      <p className="text-emerald-700 dark:text-neon-green mb-1"><span className="text-gray-500 font-bold">When HIGH: </span>{info.high}</p>
      <p className="text-rose-600 dark:text-neon-red mb-2"><span className="text-gray-500 font-bold">When LOW: </span>{info.low}</p>
      <p className="text-gray-500 text-[10px]">📊 Source: {info.source}</p>
    </div>
  );

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="inline-flex items-center text-blue-600/70 hover:text-blue-800 dark:text-cyan-500/50 dark:hover:text-cyan-400 transition-colors align-middle ml-0.5 relative z-10"
        aria-label={`Info about ${metric}`}
      >
        <Info size={12} />
      </button>
      {open && createPortal(tooltipContent, document.body)}
    </>
  );
}
