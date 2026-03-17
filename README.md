# NIFTY Options Intelligence Dashboard

A premium, real-time trading dashboard for NIFTY options analysis. **100% Node.js — no Python.**

## Features

- **Real-time data**: NIFTY spot, India VIX, FII/DII, options chain, macro prices, news headlines
- **Progress bar refresh**: Beautiful full-screen progress (0%→100%) with live status — zero Python errors
- **Technical analysis**: RSI, MACD, ADX, MA200, 81-Week MA, Bollinger Bands — all calculated in JavaScript
- **Options analytics**: Max Pain, PCR, IV Percentile, Call Wall, Put Wall, OI charts
- **Greeks & GEX**: Delta, Gamma, Theta, Vega + Gamma Exposure, squeeze detection
- **Elliott Wave**: Rule-based wave count with targets and probability
- **Trade setups**: 3–5 trade ideas every refresh (Elliott, Low IV, Gamma Squeeze, PCR extreme, Max Pain)
- **My Positions**: Add NIFTY options positions, live P&L, probability of profit, Greeks
- **News**: Multi-source RSS (ET, Moneycontrol, Reuters, Livemint) with sentiment tagging
- **Macro prices**: Brent, Gold, Silver, Dow, Nasdaq, S&P, FTSE, Hang Seng, USD/INR, EUR/USD
- **Tooltips (ℹ)**: Every metric has definition, trading context, high/low implications, exact data source
- **Dark glassmorphism UI**: Zerodha + TradingView + Bloomberg aesthetic, mobile-responsive

---

## Quick Start (Local)

```bash
# 1. Clone / download
cd my-nifty-dashboard

# 2. Install all dependencies
npm run install:all

# 3. Copy .env
cp .env.example .env

# 4. Run (backend + frontend simultaneously)
npm run dev
```

Open: http://localhost:5173

Click **"Refresh All Data"** to fetch live data.

---

## Project Structure

```
my-nifty-dashboard/
├── backend/
│   ├── index.js              # Express server, CRON auto-refresh
│   ├── routes/data.js        # REST API: /api/data, /api/refresh, /api/positions
│   ├── services/fetchers.js  # All data fetching (NSE, Yahoo Finance, RSS news)
│   └── utils/calculations.js # RSI, MACD, ADX, Black-Scholes, GEX, trade setups
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Main dashboard layout + progress overlay
│   │   ├── components/
│   │   │   ├── MetricsGrid.jsx      # All market metrics with ℹ tooltips
│   │   │   ├── News.jsx             # Multi-source news cards
│   │   │   ├── Positions.jsx        # Add/track options positions with live P&L
│   │   │   ├── Radar.jsx            # Trade setup cards (Gamma, Elliott, IV, PCR)
│   │   │   ├── Elliott.jsx          # Elliott Wave panel
│   │   │   ├── Macro.jsx            # Global macro prices
│   │   │   ├── Sentiment.jsx        # Market sentiment + FII/DII + OI
│   │   │   ├── SupportResistance.jsx # S/R zones, pivots, GEX
│   │   │   ├── PriceChart.jsx       # 60-day NIFTY price chart (Canvas)
│   │   │   └── OIChart.jsx          # Options OI bar chart (Canvas)
│   │   ├── hooks/useRefresh.js      # SSE-based refresh hook
│   │   └── utils/
│   │       ├── formatters.js        # ₹, %, number formatting
│   │       └── tooltips.jsx         # All ℹ metric definitions + InfoTooltip component
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── data/                     # Auto-created: snapshot.json, positions.json
├── package.json              # Root: single npm run dev/build/start
├── .env.example
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/data` | Latest dashboard snapshot |
| POST | `/api/refresh` | Trigger full data refresh |
| GET | `/api/refresh/status` | SSE stream of refresh progress (0–100%) |
| GET | `/api/positions` | List saved positions |
| POST | `/api/positions` | Add a position |
| DELETE | `/api/positions/:id` | Delete a position |
| GET | `/api/positions/pnl` | Positions with live P&L, Greeks, probability |

---

## Deploy to Render (Recommended — Free tier)

1. Push code to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect your GitHub repo.
4. Settings:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Root Directory**: (leave empty)
   - **Environment**: Node
5. Add environment variable: `NODE_ENV=production`
6. Deploy! Render gives you a persistent filesystem for `data/` JSON files.

**One-click Deploy** (after GitHub push):
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com)

---

## Deploy to Vercel

> ⚠️ Vercel is serverless — the `data/` JSON persistence won't survive between requests.
> Use Render or Railway for full persistence. Vercel works for demo/read-only.

1. Push to GitHub.
2. Import project on [vercel.com](https://vercel.com).
3. Set **Output Directory** to `frontend/dist`.
4. Add `vercel.json` rewrite rules if needed.
5. The backend won't run continuously on Vercel (serverless). Use Render instead.

---

## Data Sources

| Data | Source |
|------|--------|
| NIFTY Spot + VIX + Options Chain + FII/DII | [nseindia.com](https://nseindia.com) (public API) |
| Price history (OHLCV) | Yahoo Finance unofficial API |
| Macro prices (Gold, Brent, Dow, etc.) | Yahoo Finance (CL=F, GC=F, ^DJI, ^NDX…) |
| News | RSS: Economic Times, Moneycontrol, Reuters, Livemint, Business Line |
| Greeks & indicators | Calculated in `calculations.js` (Black-Scholes, RSI-14, MACD 12-26-9, ADX-14) |

---

## Auto-Refresh

The backend runs a CRON job every 4 hours during market hours (9AM–6PM IST) calling `POST /api/refresh` automatically. No manual intervention needed during trading hours.

---

## ⚠️ Disclaimer

This dashboard is for **educational and informational purposes only**. It is **not SEBI-registered investment advice**. Always conduct your own due diligence before trading options. Options trading involves substantial risk of loss.
