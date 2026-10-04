// scripts/generate-chart.js
// يجلب كل أزواج USDT، يختار عشوائياً، مع إعادة المحاولة عند الفشل

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const OUTPUT_DIR = './charts';
const MAX_ATTEMPTS = 5; // عدد المحاولات قبل الاستسلام

// 1. جلب كل أزواج USDT المتاحة
async function fetchAllUsdtPairs() {
  try {
    const res = await axios.get('https://api.binance.us/api/v3/exchangeInfo', {
      timeout: 20000
    });

    const pairs = res.data.symbols
      .filter(s => s.quoteAsset === 'USDT' && s.status === 'TRADING')
      .map(s => s.baseAsset);

    const unique = [...new Set(pairs)];
    console.log(`📊 عدد العملات المتاحة: ${unique.length}`);
    return unique;
  } catch (err) {
    console.log(`⚠️ فشل جلب القائمة: ${err.message}`);
    return ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK'];
  }
}

// 2. خلط المصفوفة (Fisher-Yates)
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 3. توليد شارت TradingView
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

  // تحقق من ظهور الشارت (هل الصفحة تحتوي على كانفاس؟)
  const hasCanvas = await page.evaluate(() => {
    return document.querySelectorAll('canvas').length > 0;
  });

  if (!hasCanvas) {
    await browser.close();
    throw new Error('الشارت لم يُحمّل (لا يوجد canvas)');
  }

  await page.mouse.move(5, 5);
  await page.waitForTimeout(500);
  await page.screenshot({ path: output });
  await browser.close();
}

// 4. الدالة الرئيسية مع إعادة المحاولة
async function generateCharts() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const allCoins = await fetchAllUsdtPairs();
  const shuffled = shuffle(allCoins);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const coin = shuffled[attempt - 1];
    if (!coin) break;

    const symbol = `BINANCE:${coin}USDT`;
    const output = path.join(OUTPUT_DIR, `${coin.toLowerCase()}-chart.png`);

    console.log(`\n🎲 محاولة ${attempt}/${MAX_ATTEMPTS}: ${coin}`);

    try {
      await captureChart(symbol, '60', output);

      // تحقق من حجم الصورة (شارت فارغ يكون صغيراً جداً)
      const size = fs.statSync(output).size;
      if (size < 20000) {
        throw new Error(`الصورة صغيرة جداً (${(size / 1024).toFixed(1)} KB) — قد تكون فارغة`);
      }

      console.log(`  ✅ نجح: ${output} (${(size / 1024).toFixed(1)} KB)`);
      return [{
        coin,
        symbol,
        interval: '60',
        path: output,
        success: true,
        size,
        attempts: attempt,
      }];
    } catch (err) {
      console.log(`  ❌ فشل: ${err.message}`);

      // احذف الملف الفاشل
      if (fs.existsSync(output)) {
        fs.unlinkSync(output);
      }

      // انتظر قبل المحاولة التالية
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
