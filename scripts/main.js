// scripts/main.js
// السكريبت الرئيسي: توليد الشارت من TradingView + النشر على Binance Square

import { generateCharts } from './generate-chart.js';
import { postWithImage } from './post-to-square.js';

function buildSignalText(coin, timeframe) {
  const now = new Date().toUTCString().slice(0, 16);

  return `📊 إشارة تداول - $${coin}/USDT (${timeframe})

🕐 ${now} UTC

📈 التحليل الفني:
• الإطار الزمني: ${timeframe}
• الشارت مرفق أدناه (Supertrend + RSI)
• راقب مستويات الدعم والمقاومة

⚠️ إدارة المخاطر:
• لا تخاطر بأكثر من 1-2% من رأس المال
• ضع وقف الخسارة دائماً
• هذه ليست نصيحة مالية، قم ببحثك الخاص (DYOR)

#Crypto #Trading`;
}

async function main() {
  console.log('🚀 بدء التشغيل...\n');

  console.log('📊 المرحلة 1: توليد الشارتات');
  const charts = await generateCharts();
  const successCharts = charts.filter((c) => c.success);

  if (successCharts.length === 0) {
    console.log('❌ لم يتم توليد أي شارت، إيقاف');
    process.exit(1);
  }

  // اختر عملة عشوائية من الناجحة
  const chart = successCharts[Math.floor(Math.random() * successCharts.length)];

  console.log(`\n📝 المرحلة 2: النشر - ${chart.coin}`);
  const text = buildSignalText(chart.coin, chart.interval === '60' ? '1h' : chart.interval);

  const result = postWithImage(text, chart.path);

  if (result.success) {
    console.log('✅ تم النشر بنجاح');
  } else {
    console.log(`❌ فشل النشر: ${result.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
