// scripts/generate-chart.js
// يولّد صور شارت لعملات متعددة

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COINS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];
const TIMEFRAME = '1h';
const OUTPUT_DIR = './charts';

async function generateCharts() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const results = [];

  for (const coin of COINS) {
    const symbol = `${coin}/USDT`;
    const outputPath = path.join(OUTPUT_DIR, `${coin.toLowerCase()}-chart.png`);

    console.log(`📊 توليد شارت ${symbol} على ${TIMEFRAME}...`);

    try {
      const cmd = [
        'npx', '@neabyte/chart-to-image',
        '--symbol', symbol,
        '--timeframe', TIMEFRAME,
        '--output', outputPath,
        '--theme', 'dark',
        '--width', '1200',
        '--height', '800',
        '--ema'
      ].join(' ');

      execSync(cmd, { stdio: 'inherit', timeout: 90000 });

      if (fs.existsSync(outputPath)) {
        const size = fs.statSync(outputPath).size;
        console.log(`  ✅ ${outputPath} (${(size / 1024).toFixed(1)} KB)`);
        results.push({ coin, symbol, path: outputPath, success: true, size });
      } else {
        results.push({ coin, symbol, path: outputPath, success: false });
      }
    } catch (error) {
      console.error(`  ❌ فشل ${coin}: ${error.message.slice(0, 100)}`);
      results.push({ coin, symbol, path: outputPath, success: false, error: error.message });
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
      results.forEach(r => console.log(`  ${r.success ? '✅' : '❌'} ${r.symbol}`));
    })
    .catch(err => { console.error(err); process.exit(1); });
}
