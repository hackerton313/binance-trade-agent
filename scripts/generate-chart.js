// scripts/generate-chart.js
// يولّد صور شارت حقيقية من TradingView عبر Playwright

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = './charts';

async function captureChart(symbol, interval, output) {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 800 },
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head><style>
      body { margin: 0; background: #0B0E11; }
      #tv { width: 1200px; height: 800px; }
    </style></head>
    <body>
    <div id="tv"></div>
    <script src="https://s3.tradingview.com/tv.js"></script>
    <script>
    new TradingView.widget({
      "container_id": "tv",
      "symbol": "${symbol}",
      "interval": "${interval}",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "width": 1200,
      "height": 800,
      "studies": [
        "RSI@tv-basicstudies",
        "STD;Supertrend"
      ],
      "hide_top_toolbar": false,
      "save_image": false
    });
    </script>
    </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(10000);
  await page.mouse.move(5, 5);
  await page.waitForTimeout(500);
  await page.screenshot({ path: output });
  await browser.close();
}

async function generateCharts() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const coins = [
    { coin: 'BTC', symbol: 'BINANCE:BTCUSDT', interval: '60' },
    { coin: 'ETH', symbol: 'BINANCE:ETHUSDT', interval: '60' },
    { coin: 'BNB', symbol: 'BINANCE:BNBUSDT', interval: '60' },
    { coin: 'SOL', symbol: 'BINANCE:SOLUSDT', interval: '60' },
    { coin: 'XRP', symbol: 'BINANCE:XRPUSDT', interval: '60' },
  ];

  const results = [];

  for (const { coin, symbol, interval } of coins) {
    const output = path.join(OUTPUT_DIR, `${coin.toLowerCase()}-chart.png`);
    console.log(`📊 توليد شارت ${symbol}...`);

    try {
      await captureChart(symbol, interval, output);
      const size = fs.statSync(output).size;
      console.log(`  ✅ ${output} (${(size / 1024).toFixed(1)} KB)`);
      results.push({ coin, symbol, interval, path: output, success: true, size });
    } catch (err) {
      console.log(`  ❌ فشل ${coin}: ${err.message}`);
      results.push({ coin, symbol, path: output, success: false, error: err.message });
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  return results;
}

export { generateCharts };
