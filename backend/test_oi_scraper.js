const puppeteer = require('puppeteer');

(async () => {
  const b = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await b.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    await page.goto('https://upstox.com/fno-discovery/open-interest-analysis/nifty-oi/', { waitUntil: 'networkidle2', timeout: 30000 });
    
    const dump = await page.evaluate(() => {
      // Find tables or complex divs containing numbers
      const rows = Array.from(document.querySelectorAll('tr'));
      if(rows.length > 0) {
         return rows.slice(0, 15).map(r => r.innerText);
      }
      return 'No TRs found.';
    });

    console.log('--- UPSTOX OI ROWS ---');
    console.log(dump);
    console.log('----------------------');
  } catch (err) {
    console.error(err);
  } finally {
    await b.close();
  }
})();
