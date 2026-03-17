/**
 * backend/index.js
 * ================
 * Express server entry point.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

const dataRouter = require('./routes/data');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api', dataRouter);

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

// ─── Auto-refresh every 4 hours (market hours only) ─────────────────────────
cron.schedule('0 */4 * * *', async () => {
  const hour = new Date().getUTCHours() + 5; // IST offset
  if (hour >= 9 && hour <= 18) {
    console.log('[CRON] Auto-refreshing dashboard data…');
    try {
      // Trigger refresh internally
      await fetch(`http://localhost:${PORT}/api/refresh`, { method: 'POST' });
    } catch (e) {
      console.warn('[CRON] Auto-refresh failed:', e.message);
    }
  }
});

app.listen(PORT, () => {
  console.log(`\n✅  NIFTY Dashboard backend running on http://localhost:${PORT}`);
  console.log(`    API: http://localhost:${PORT}/api/data`);
  console.log(`    Refresh: POST http://localhost:${PORT}/api/refresh\n`);
});
