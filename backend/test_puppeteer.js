const { scrapeUpstoxMaxPain } = require('./services/upstoxScraper');

(async () => {
  console.log('Testing Upstox Scraper...');
  const maxPain = await scrapeUpstoxMaxPain();
  console.log('Final Result:', maxPain);
  process.exit(0);
})();
