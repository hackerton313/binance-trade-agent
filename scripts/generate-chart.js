// scripts/generate-chart.js
// يختار عملة عشوائية من قائمة 200 عملة ويولّد شارت TradingView
// الوضع: Dark Theme + RSI + Supertrend + فريم 4h

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = './charts';
const MAX_ATTEMPTS = 5;

// قائمة 200 عملة مشهورة
const POPULAR_COINS = [
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'TRX',
  'LINK', 'MATIC', 'LTC', 'BCH', 'UNI', 'ATOM', 'XLM', 'ETC', 'FIL', 'APT',
  'ARB', 'OP', 'INJ', 'TIA', 'SUI', 'SEI', 'NEAR', 'ICP', 'HBAR', 'VET',
  'ALGO', 'GRT', 'STX', 'IMX', 'FTM', 'SAND', 'MANA', 'AXS', 'CRO', 'AAVE',
  'MKR', 'SNX', 'COMP', 'CRV', '1INCH', 'SUSHI', 'ENJ', 'CHZ', 'ZIL', 'BAT',
  'RNDR', 'FET', 'AGIX', 'OCEAN', 'TAO', 'NMR', 'SHIB', 'PEPE', 'FLOKI', 'BONK',
  'AR', 'KSM', 'ZEC', 'DASH', 'WAVES', 'EGLD', 'THETA', 'CAKE', 'AXL', 'RUNE',
  'GALA', 'APE', 'GMT', 'LDO', 'ENS', 'DYDX', 'MASK', 'SSV', 'BLUR', 'ID',
  'WOO', 'KAVA', 'ROSE', 'CFX', 'MAGIC', 'HIGH', 'MULTI', 'ACH', 'DENT', 'HOT',
  'COTI', 'ANKR', 'STORJ', 'BAND', 'LRC', 'ILV', 'YFI', 'BAL', 'REN', 'KNC',
  'ZRX', 'OMG', 'REP', 'ANT', 'MLN', 'KEEP', 'NU', 'PNT', 'JASMY', 'IOTX',
  'CVC', 'MITH', 'CTSI', 'TRB', 'POWR', 'RLC', 'NKN', 'OGN', 'CTK', 'STMX',
  'DUSK', 'WAN', 'ARK', 'SYS', 'VITE', 'PERP', 'DODO', 'ALPHA', 'BEL', 'CREAM',
  'FOR', 'BURGER', 'PROM', 'ALPACA', 'POND', 'TROY', 'DIA', 'FIS', 'REEF', 'DEGO',
  'VIDT', 'TWT', 'BIFI', 'EPS', 'BOND', 'QUICK', 'POLS', 'MIR', 'LINA', 'LIT',
  'TCT', 'BTS', 'TORN', 'DOCK', 'NULS', 'WTC', 'NAS', 'ICX', 'LSK', 'IOST',
  'ZIL', 'ONT', 'QTUM', 'STRAT', 'NEBL', 'GAS', 'NEO', 'ARK', 'WAVES', 'ZEN',
  'XTZ', 'DGB', 'DCR', 'RDD', 'VIA', 'VTC', 'SYS', 'PIVX', 'NXS', 'GAME',
  'FUN', 'PAY', 'LRC', 'MAN', 'POWR', 'REQ', 'ZRX', 'BAT', 'LOOM', 'NPXS',
  'CMT', 'ELF', 'MFT', 'DENT', 'HOT', 'AVA', 'ENG', 'COSM', 'OCEAN', 'STORJ'
];

const UNIQUE_COINS = [...new Set(POPULAR_COINS)];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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
  await page.waitForTimeout(12000);
  await page.mouse.move(5, 5);
  await page.waitForTimeout(500);
  await page.screenshot({ path: output });
  await browser.close();
}

async function generateCharts() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`📊 قائمة العملات: ${UNIQUE_COINS.length} عملة`);
  const shuffled = shuffle(UNIQUE_COINS);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const coin = shuffled[attempt - 1];
    if (!coin) break;

    const symbol = `BINANCE:${coin}USDT`;
    const output = path.join(OUTPUT_DIR, `${coin.toLowerCase()}-chart.png`);

    console.log(`\n🎲 محاولة ${attempt}/${MAX_ATTEMPTS}: ${coin}`);

    try {
      await captureChart(symbol, '240', output);

      const size = fs.statSync(output).size;
      if (size < 20000) {
        throw new Error(`الصورة صغيرة جداً (${(size / 1024).toFixed(1)} KB)`);
      }

      console.log(`  ✅ نجح: ${output} (${(size / 1024).toFixed(1)} KB)`);
      return [{
        coin,
        symbol,
        interval: '240',
        path: output,
        success: true,
        size,
        attempts: attempt,
      }];
    } catch (err) {
      console.log(`  ❌ فشل: ${err.message}`);

      if (fs.existsSync(output)) {
        fs.unlinkSync(output);
      }

      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n❌ فشلت كل المحاولات (${MAX_ATTEMPTS})`);
  return [{
    coin: null,
    path: null,
    success: false,
    error: `فشلت ${MAX_ATTEMPTS} محاولات`,
  }];
}

export { generateCharts };
