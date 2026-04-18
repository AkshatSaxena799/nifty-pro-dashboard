const puppeteer = require('puppeteer');

let browser = null;

async function getBrowser() {
  if (!browser) {
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--disable-gpu']
      });
    } catch (err) {
      console.error('Puppeteer launch failed:', err);
    }
  }
  return browser;
}

async function scrapeUpstoxMaxPain() {
  const b = await getBrowser();
  if (!b) return null;
  const page = await b.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.goto('https://upstox.com/fno-discovery/open-interest-analysis/nifty-max-pain/', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Evaluate page content to find the number next to Max Pain
    const maxPain = await page.evaluate(() => {
      // Simplistic approach: dump innerText and search for "Max Pain" pattern
      const text = document.body.innerText;
      // "Max Pain: 23,500" or similar
      const match = text.match(/Max\s*Pain\s*\(?₹?\)?\s*:?\s*([\d,]+)/i);
      if (match) return parseInt(match[1].replace(/,/g, ''), 10);
      
      // Secondary heuristic: look for large numbers in specific widgets
      const widgetData = Array.from(document.querySelectorAll('div, span, p')).map(el => el.textContent.trim());
      for (const t of widgetData) {
        let m = t.match(/Max Pain\s*([\d,]+)/i);
        if (m) return parseInt(m[1].replace(/,/g, ''), 10);
      }
      return null;
    });

    console.log('Scraped Upstox Max Pain:', maxPain);
    return maxPain;
  } catch (err) {
    console.error('Error scraping Upstox Max Pain:', err.message);
    return null;
  } finally {
    await page.close();
  }
}

async function scrapeUpstoxOptionChain() {
  // Option chain extraction logic is extremely complex if chart-based
  // We will return null and fallback to NSE if we can't cleanly parse it yet
  return null; 
}

async function scrapeGiftNifty() {
  const b = await getBrowser();
  if (!b) return null;
  const page = await b.newPage();
  let val = null;

  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    
    // Strategy 1: Google Search Finance Widget Heuristic
    try {
      await page.goto('https://www.google.com/search?q=gift+nifty+live+price', { waitUntil: 'domcontentloaded', timeout: 20000 });
      val = await page.evaluate(() => {
        const priceEl = document.querySelector('span[data-attrid="Price"], span[jsname="vWLAgc"]');
        if (priceEl && priceEl.innerText) {
          const txt = priceEl.innerText.replace(/,/g, '');
          const match = txt.match(/(\d{4,5}(?:\.\d{1,2})?)/);
          if (match) {
             const n = parseFloat(match[1]);
             if (n > 20000 && n < 35000) return n;
          }
        }

        const fullText = document.body.innerText || '';
        const widgetMatch = fullText.match(/(\d{2})[,]?(\d{3}(?:\.\d{1,2})?)\s*(?:\n|\r|\+|-).*?Today/i);
        if (widgetMatch) {
           const n = parseFloat(widgetMatch[1] + widgetMatch[2]);
           if (n > 20000 && n < 35000) return n;
        }

        const matches = [...fullText.matchAll(/GIFT Nifty[\s\S]{0,100}?(\d{2})[,]?(\d{3}(?:\.\d{1,2})?)/ig)];
        if (matches.length > 0) {
           const m = matches[0];
           const num = parseFloat(m[1] + m[2]);
           if (num > 20000 && num < 35000) return num;
        }
        return null;
      });
      
      if (val) {
        console.log('Scraped GIFT Nifty (Google Heuristic):', val);
        await page.close();
        return val;
      }
    } catch (err) {
      console.log('Strategy 1 (Google) failed:', err.message);
    }

    // Strategy 2: Investing.com SGX Nifty (GIFT Nifty) fallback
    if (!val) {
      try {
        await page.goto('https://in.investing.com/indices/sgx-nifty-50', { waitUntil: 'domcontentloaded', timeout: 25000 });
        val = await page.evaluate(() => {
          const el = document.querySelector('[data-test="instrument-price-last"]');
          if (el && el.textContent) {
            const num = parseFloat(el.textContent.trim().replace(/,/g, ''));
            if (!isNaN(num) && num > 20000 && num < 40000) return num;
          }
          return null;
        });

        if (val) {
          console.log('Scraped GIFT Nifty (Investing.com):', val);
        }
      } catch (err) {
        console.log('Strategy 2 (Investing.com) failed:', err.message);
      }
    }

  } catch (err) {
    console.error('Error in scrapeGiftNifty:', err.message);
  } finally {
    if (!page.isClosed()) {
      await page.close();
    }
  }
  return val;
}

module.exports = {
  scrapeUpstoxMaxPain,
  scrapeUpstoxOptionChain,
  scrapeGiftNifty
};
