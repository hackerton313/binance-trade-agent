// scripts/generate-chart.js
// يختار عملة عشوائية من قائمة العملات ويولّد شارت TradingView
// الوضع: Dark Theme + RSI + Supertrend + فريم 4h
// مع فحص "doesn't exist" + فحص حجم الملف + 5 محاولات

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = './charts';
const MAX_ATTEMPTS = 5;

// قائمة العملات الجديدة (يتم إزالة التكرار تلقائياً)
const POPULAR_COINS = [
  'BTC', 'ETH', 'BNB', 'XRP', 'SOL', 'TRX', 'DOGE', 'ADA', 'BCH', 'LINK',
  'LTC', 'XLM', 'HBAR', 'AVAX', 'SUI', 'SHIB', 'DOT', 'UNI', 'NEAR', 'AAVE',
  'APT', 'PEPE', 'ICP', 'ETC', 'FIL', 'ATOM', 'ALGO', 'VET', 'POL', 'RENDER',
  'ARB', 'OP', 'INJ', 'STX', 'IMX', 'GRT', 'THETA', 'MKR', 'RUNE', 'SEI',
  'JUP', 'WLD', 'TIA', 'LDO', 'JASMY', 'FLOW', 'SAND', 'MANA', 'AXS', 'EOS',
  'XTZ', 'QNT', 'NEO', 'EGLD', 'KAVA', 'MINA', 'SNX', 'DYDX', 'CRV', 'COMP',
  '1INCH', 'SUSHI', 'CAKE', 'ENS', 'LPT', 'AR', 'CFX', 'ZEC', 'DASH', 'IOTA',
  'KSM', 'ROSE', 'CELO', 'ZIL', 'QTUM', 'ANKR', 'CHZ', 'BAT', 'IOTX', 'HOT',
  'ONE', 'ONT', 'ZRX', 'RVN', 'ICX', 'WOO', 'YFI', 'UMA', 'API3', 'SSV',
  'GMX', 'GALA', 'ENJ', 'APE', 'GMT', 'MAGIC', 'BLUR', 'MEME', 'ORDI', 'SATS',
  '1000SATS', 'TURBO', 'FLOKI', 'BONK', 'WIF', 'BOME', 'NOT', 'PEOPLE', 'DOGS', 'NEIRO',
  'ACT', 'PNUT', 'POPCAT', 'MEW', 'BRETT', 'MOG', 'BABYDOGE', 'SLERF', 'MYRO', 'TNSR',
  'PYTH', 'JTO', 'W', 'WAL', 'JST', 'SUN', 'TWT', 'RAY', 'ORCA', 'KMNO',
  'DRIFT', 'HNT', 'IOT', 'TAO', 'FET', 'AGIX', 'OCEAN', 'AI', 'ARKM', 'NMR',
  'GLM', 'AKT', 'ATH', 'AERO', 'ONDO', 'ENA', 'EIGEN', 'ETHFI', 'PENDLE', 'MORPHO',
  'SAFE', 'ZK', 'ZRO', 'STRK', 'MANTA', 'DYM', 'ALT', 'PORTAL', 'PIXEL', 'AEVO',
  'SCR', 'SAGA', 'LISTA', 'OMNI', 'IO', 'BB', 'REZ', 'SYN', 'CYBER', 'ID',
  'HIGH', 'HOOK', 'EDU', 'XAI', 'RONIN', 'RON', 'ILV', 'YGG', 'GODS', 'GTC',
  'LQTY', 'CVX', 'BAL', 'BNT', 'KNC', 'OXT', 'STORJ', 'SKL', 'CELR', 'CTSI',
  'DENT', 'DUSK', 'LRC', 'MTL', 'NKN', 'OGN', 'OMG', 'PERP', 'RLC', 'STG',
  'TRB', 'T', 'COTI', 'DGB', 'DCR', 'SC', 'WAXP', 'IOST', 'LSK', 'ARPA',
  'CTK', 'FLM', 'FLUX', 'SYS', 'DODO', 'BAKE', 'BEL', 'BURGER', 'ALPHA', 'DEGO',
  'FORTH', 'POND', 'AUDIO', 'MASK', 'MOVR', 'GLMR', 'ASTR', 'ACA', 'KLAY', 'KAIA',
  'C98', 'LINA', 'REEF', 'ATA', 'ALPACA', 'FARM', 'TLM', 'SLP', 'ALICE', 'CHR',
  'DAR', 'FIDA', 'MBOX', 'VOXEL', 'SANTOS', 'PORTO', 'LAZIO', 'CITY', 'PSG', 'BAR',
  'ATM', 'ASR', 'ACM', 'JUV', 'OG', 'LEVER', 'XVG', 'WIN', 'KEY', 'MDX',
  'PUNDIX', 'PROM', 'DIA', 'GHST', 'RAD', 'RARE', 'SUPER', 'AUCTION', 'MAV', 'MAVIA',
  'ACE', 'SFP', 'CVC', 'STMX', 'REQ', 'WRX', 'UTK', 'PHA', 'VTHOR', 'VTHO',
  'XNO', 'NULS', 'STRAX', 'ONG', 'NEWT', 'SXT', 'PROVE', 'PLUME', 'TREE', 'NXPC',
  'MET', 'HOLO'
];

// إزالة التكرار
const UNIQUE_COINS = [...new Set(POPULAR_COINS)];

// خلط المصفوفة
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

  // ✅ فحص "الرمز غير موجود"
  const bodyText = await page.evaluate(() => document.body.innerText || '');
  if (
    bodyText.includes("doesn't exist") ||
    bodyText.includes("does not exist") ||
    bodyText.includes("This symbol")
  ) {
    await browser.close();
    throw new Error('الرمز غير موجود على TradingView');
  }

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

      // ✅ فحص حجم الملف
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
