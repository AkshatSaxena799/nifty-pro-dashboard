/**
 * googleSheetsFetcher.js
 * ======================
 * Fetches GIFT Nifty live value from a published Google Sheet.
 *
 * Google's servers execute the formulas — your IP never touches
 * any financial site. Zero auth, zero API key, zero blocking.
 *
 * ENV: GSHEET_CSV_URL = published CSV link from Google Sheets
 */

const axios = require('axios');

// Cache to avoid hammering Google on every refresh
let _cache = { value: null, ts: 0 };
const CACHE_TTL_MS = 25_000; // 25 seconds

/**
 * Fetch GIFT Nifty value from the published Google Sheet CSV.
 * Returns a number (e.g. 24709.5) or null if unavailable.
 */
async function getGiftNiftyFromSheet() {
  const url = process.env.GSHEET_CSV_URL;
  if (!url) return null;

  // Return cache if fresh
  if (_cache.value && Date.now() - _cache.ts < CACHE_TTL_MS) {
    return _cache.value;
  }

  try {
    // Append a timestamp to the URL to bypass Google's "Published to web" cache
    const cacheBuster = `&t=${Date.now()}`;
    const res = await axios.get(url + cacheBuster, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NiftyDashboard/1.0)' },
      maxRedirects: 5,
    });

    // Parse CSV lines looking for "giftnifty" row
    const lines = res.data.split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      const parts = line.split(',');
      if (parts.length < 2) continue;

      const label = parts[0].replace(/"/g, '').trim().toLowerCase();
      if (label === 'giftnifty') {
        const val = parseFloat(parts[1].replace(/"/g, '').trim());
        if (!isNaN(val) && val > 20000 && val < 40000) {
          _cache = { value: val, ts: Date.now() };
          console.log('[GSheets] GIFT Nifty:', val);
          return val;
        }
      }
    }

    console.warn('[GSheets] "giftnifty" row not found in sheet');
    return null;
  } catch (err) {
    console.warn('[GSheets] Fetch failed:', err.message);
    // Return stale cache rather than nothing
    if (_cache.value) return _cache.value;
    return null;
  }
}

module.exports = { getGiftNiftyFromSheet };
