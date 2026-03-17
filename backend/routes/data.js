/**
 * routes/data.js
 * ==============
 * REST API routes. Express router.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { runFullRefresh } = require('../services/fetchers');

const router = express.Router();

// Data persistence paths
const DATA_DIR = path.join(__dirname, '../../data');
const SNAPSHOT_PATH = path.join(DATA_DIR, 'snapshot.json');
const POSITIONS_PATH = path.join(DATA_DIR, 'positions.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ─── In-memory snapshot cache (last 2 refreshes) ──────────────────────────────
let _snapshots = [null, null]; // [latest, previous]
let _refreshing = false;
let _progress = { pct: 0, text: '' };

const SNAPSHOT_PREV_PATH = path.join(DATA_DIR, 'snapshot_prev.json');

function loadSnapshot() {
  if (_snapshots[0]) return _snapshots[0];
  if (fs.existsSync(SNAPSHOT_PATH)) {
    try { _snapshots[0] = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8')); } catch {}
  }
  if (fs.existsSync(SNAPSHOT_PREV_PATH)) {
    try { _snapshots[1] = JSON.parse(fs.readFileSync(SNAPSHOT_PREV_PATH, 'utf8')); } catch {}
  }
  return _snapshots[0];
}

function saveSnapshot(data) {
  // Current becomes previous
  if (_snapshots[0]) {
    _snapshots[1] = _snapshots[0];
    try { fs.writeFileSync(SNAPSHOT_PREV_PATH, JSON.stringify(_snapshots[1], null, 2)); } catch {}
  }
  _snapshots[0] = data;
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(data, null, 2));
}

// ─── GET /api/data — latest snapshot ──────────────────────────────────────────
router.get('/data', (req, res) => {
  const snap = loadSnapshot();
  if (!snap) return res.status(404).json({ error: 'No data yet. Click Refresh.' });
  res.json(snap);
});

// ─── GET /api/refresh/status — SSE progress stream ───────────────────────────
router.get('/refresh/status', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // Send current progress immediately
  send(_progress);

  const interval = setInterval(() => {
    send(_progress);
    if (_progress.pct >= 100 || !_refreshing) clearInterval(interval);
  }, 500);

  req.on('close', () => clearInterval(interval));
});

// ─── POST /api/refresh — trigger refresh ──────────────────────────────────────
router.post('/refresh', async (req, res) => {
  if (_refreshing) {
    return res.json({ ok: false, message: 'Refresh already in progress' });
  }
  res.json({ ok: true, message: 'Refresh started' });

  _refreshing = true;
  _progress = { pct: 0, text: 'Starting refresh…' };

  try {
    loadSnapshot(); // ensure snapshots loaded from disk
    const prevSnapshot = _snapshots[0] || null;
    const data = await runFullRefresh((pct, text) => {
      _progress = { pct, text };
    }, prevSnapshot);
    saveSnapshot(data);
    _progress = { pct: 100, text: 'Done!' };
  } catch (err) {
    console.error('Refresh error:', err);
    _progress = { pct: 100, text: `Error: ${err.message}` };
  } finally {
    _refreshing = false;
  }
});

// ─── Positions CRUD ───────────────────────────────────────────────────────────
function loadPositions() {
  if (!fs.existsSync(POSITIONS_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(POSITIONS_PATH, 'utf8')); } catch { return []; }
}

function savePositions(positions) {
  fs.writeFileSync(POSITIONS_PATH, JSON.stringify(positions, null, 2));
}

router.get('/positions', (req, res) => {
  res.json(loadPositions());
});

router.post('/positions', (req, res) => {
  const { type, strike, expiry, qty, entryPrice, side } = req.body;
  if (!type || !strike || !expiry || !qty || !entryPrice || !side) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const positions = loadPositions();
  const pos = {
    id: Date.now().toString(),
    type: String(type).toUpperCase(),       // CE or PE
    strike: parseFloat(strike),
    expiry: String(expiry),
    qty: parseInt(qty, 10),
    entryPrice: parseFloat(entryPrice),
    side: String(side).toLowerCase(),       // long or short
    createdAt: new Date().toISOString(),
  };
  positions.push(pos);
  savePositions(positions);
  res.json(pos);
});

router.delete('/positions/:id', (req, res) => {
  const positions = loadPositions().filter((p) => p.id !== req.params.id);
  savePositions(positions);
  res.json({ ok: true });
});

// ─── Computed P&L for positions ───────────────────────────────────────────────
router.get('/positions/pnl', (req, res) => {
  const snap = loadSnapshot();
  const positions = loadPositions();
  if (!snap || positions.length === 0) return res.json([]);

  const { bsPrice, probOfProfit } = require('../utils/calculations');
  const spot = snap.spot || 23500;
  const chain = snap.chain || [];

  const result = positions.map((pos) => {
    // Find current LTP from chain if available
    const chainRow = chain.find(
      (r) => r.strike === pos.strike && String(r.expiry).startsWith(pos.expiry.slice(0, 10))
    );
    const currentLTP = chainRow ? (pos.type === 'CE' ? chainRow.CE_LTP : chainRow.PE_LTP) : null;

    // Fallback: BS price
    const T = Math.max((new Date(pos.expiry) - Date.now()) / (365 * 86400000), 0.001);
    const iv = (chainRow ? (pos.type === 'CE' ? chainRow.CE_IV : chainRow.PE_IV) : snap.avgIV || 18) / 100;
    const bsVal = bsPrice(spot, pos.strike, T, 0.065, iv, pos.type === 'CE' ? 'C' : 'P');
    const ltp = currentLTP || parseFloat(bsVal.price.toFixed(2));

    // UPDATED FOR FIX #4 — LOT SIZE = 65 hardcoded
    const lotSize = 65;
    const pnlPerUnit = pos.side === 'long' ? ltp - pos.entryPrice : pos.entryPrice - ltp;
    const pnl = pnlPerUnit * pos.qty * lotSize;
    const pnlPct = pos.entryPrice > 0 ? (pnlPerUnit / pos.entryPrice) * 100 : 0;
    const pop = probOfProfit(spot, pos.strike, T, 0.065, iv, pos.type === 'CE' ? 'C' : 'P', pos.side);

    return {
      ...pos, currentLTP: ltp, pnl: parseFloat(pnl.toFixed(2)),
      pnlPct: parseFloat(pnlPct.toFixed(2)), probOfProfit: pop,
      greeks: {
        delta: bsVal.delta.toFixed(3),
        gamma: bsVal.gamma.toFixed(5),
        theta: bsVal.theta.toFixed(2),
        vega: bsVal.vega.toFixed(3),
      },
    };
  });

  res.json(result);
});

module.exports = router;
