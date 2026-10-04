// scripts/generate-chart.js
// يولّد صورة شارت نظيفة باستخدام neabyte-chart-to-image

const path = require('path');

async function generateChart(symbol, timeframe, outputPath) {
  // ملاحظة: اسم الحزمة الدقيق يجب التحقق منه من npm
  // هذا placeholder — سنستخدم الطريقة الصحيحة بعد التحقق
  console.log(`📊 توليد شارت ${symbol} على ${timeframe}`);
  console.log(`📁 المسار: ${outputPath}`);
  return outputPath;
}

module.exports = { generateChart };

// للاختبار المباشر
if (require.main === module) {
  generateChart('BTC/USDT', '1h', './chart.png')
    .then(() => console.log('✅ تم'))
    .catch(err => console.error('❌', err));
}
