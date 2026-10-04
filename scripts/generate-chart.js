// scripts/generate-chart.js
// يولّد صورة شارت نظيفة باستخدام @neabyte/chart-to-image

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// العملات التي تريد توليد شارتات لها
const COINS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];

// الإطار الزمني للشارت
const TIMEFRAME = '1h';

async function generateCharts() {
  const outputDir = './charts';
  
  // أنشئ مجلد الإخراج إذا لم يكن موجوداً
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const results = [];

  for (const coin of COINS) {
    const symbol = `${coin}/USDT`;
    const outputPath = path.join(outputDir, `${coin.toLowerCase()}-chart.png`);

    console.log(`📊 توليد شارت ${symbol} على ${TIMEFRAME}...`);

    try {
      // استخدام CLI الخاص بالحزمة
      const cmd = `npx @neabyte/chart-to-image --symbol ${symbol} --timeframe ${TIMEFRAME} --output ${outputPath} --theme dark --width 1200 --height 800 --ema`;
      
      execSync(cmd, { 
        stdio: 'inherit',
        timeout: 60000 // 60 ثانية كحد أقصى
      });

      if (fs.existsSync(outputPath)) {
        console.log(`  ✅ تم: ${outputPath}`);
        results.push({ coin, symbol, path: outputPath, success: true });
      } else {
        console.log(`  ❌ فشل: الملف غير موجود`);
        results.push({ coin, symbol, path: outputPath, success: false });
      }
    } catch (error) {
      console.error(`  ❌ خطأ في ${coin}: ${error.message}`);
      results.push({ coin, symbol, path: outputPath, success: false, error: error.message });
    }
  }

  return results;
}

module.exports = { generateCharts, COINS, TIMEFRAME };

// للاختبار المباشر
if (require.main === module) {
  generateCharts()
    .then(results => {
      const success = results.filter(r => r.success).length;
      console.log(`\n🎉 اكتمل: ${success}/${results.length} شارت`);
      results.forEach(r => {
        console.log(`  ${r.success ? '✅' : '❌'} ${r.symbol}`);
      });
    })
    .catch(err => {
      console.error('❌ خطأ عام:', err);
      process.exit(1);
    });
}
