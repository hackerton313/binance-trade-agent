// scripts/generate-chart.js
// يولّد صور شارت مع نظام Fallback بين عدة مصادر

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COINS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];
const TIMEFRAME = '1h';
const OUTPUT_DIR = './charts';

// الترتيب: نجرّب binanceus أولاً، ثم binance، ثم kraken، ثم coinbase
const EXCHANGES = ['binanceus', 'kraken', 'coinbase', 'binance'];

function tryGenerate(symbol, exchange, outputPath) {
  const cmd = [
    'npx', '@neabyte/chart-to-image',
    '--symbol', symbol,
    '--timeframe', TIMEFRAME,
    '--output', outputPath,
    '--theme', 'dark',
    '--width', '1200',
    '--height', '800',
    '--ema',
    '--exchange', exchange
  ].join(' ');

  try {
    execSync(cmd, { stdio: 'pipe', timeout: 90000 });
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 5000) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function generateCharts() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results = [];

  for (const coin of COINS) {
    const symbol = `${coin}/USDT`;
    const outputPath = path.join(OUTPUT_DIR, `${coin.toLowerCase()}-chart.png`);

    console.log(`📊 توليد شارت ${symbol}...`);
    let success = false;
    let usedExchange = null;

    for (const exchange of EXCHANGES) {
      console.log(`  🔄 تجربة ${exchange}...`);
      if (tryGenerate(symbol, exchange, outputPath)) {
        success = true;
        usedExchange = exchange;
        break;
      }
    }

    if (success) {
      const size = fs.statSync(outputPath).size;
      console.log(`  ✅ نجح مع ${usedExchange} (${(size / 1024).toFixed(1)} KB)`);
      results.push({ coin, symbol, path: outputPath, success: true, size, exchange: usedExchange });
    } else {
      console.log(`  ❌ فشل بجميع المصادر`);
      results.push({ coin, symbol, path: outputPath, success: false });
    }
  }

  return results;
}

module.exports = { generateCharts, COINS, TIMEFRAME };

if (require.main === module) {
  generateCharts()
    .then(results => {
      const ok = results.filter(r => r.success).length;
      console.log(`\n🎉 ${ok}/${results.length} شارت تم توليده`);
      results.forEach(r => console.log(`  ${r.success ? '✅' : '❌'} ${r.symbol} ${r.exchange ? '(' + r.exchange + ')' : ''}`));
    })
    .catch(err => { console.error(err); process.exit(1); });
}
