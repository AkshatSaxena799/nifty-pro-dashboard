const axios = require('axios');
const fs = require('fs');
(async () => {
  try {
    const r = await axios.get('https://upstox.com/option-chain/nifty/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    fs.writeFileSync('C:/Users/aksha/Downloads/my-nifty-dashboard/backend/upstox.html', r.data);
    console.log('Saved UPSTOX HTML. Length:', r.data.length);
    // Find Next Data or other JSON chunks
    const matches = r.data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
    if (matches) {
       console.log('Found NEXT_DATA of length', matches[1].length);
       fs.writeFileSync('C:/Users/aksha/Downloads/my-nifty-dashboard/backend/upstox.json', matches[1]);
    } else {
       console.log('No NEXT_DATA');
    }
  } catch(e) {
    console.error(e.message);
  }
})();
