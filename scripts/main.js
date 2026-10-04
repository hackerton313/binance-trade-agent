// scripts/main.js
// السكريبت الرئيسي: يولّد الشارت + النص + ينشر

const { generateCharts } = require('./generate-chart');
const { postWithImage } = require('./post-to-square');
const fs = require('fs');

function buildSignalText(coin, timeframe) {
  const now = new Date().toUTCString().slice(0, 16);
  
  return `📊 إشارة تداول - ${coin}/USDT (${timeframe})

🕐 التوقيت: ${now} UTC

📈 التحليل:
• العملة: $${coin}
• الإطار الزمني: ${timeframe}
• الشارت مرفق أدناه

💡 راقب مستويات الدعم والمقاومة الظاهرة على الشارت قبل الدخول.

⚠️ إدارة المخاطر:
• لا تخاطر بأكثر من 1-2% من رأس المال
• ضع وقف الخسارة دائماً
• هذه ليست نصيحة مالية، قم ببحثك الخاص (DYOR)

#Crypto #Trading`;
}

async function main() {
  console.log('🚀 بدء التشغيل...\n');

  // 1. توليد الشارتات
  console.log('📊 المرحلة 1: توليد الشارتات');
  const charts = await generateCharts();
  const successCharts = charts.filter(c => c.success);

  if (successCharts.length === 0) {
    console.log('❌ لم يتم توليد أي شارت، إيقاف التشغيل');
    process.exit(1);
  }

  // 2. نشر شارت واحد فقط (لتجنب تجاوز الحد اليومي)
  console.log('\n📝 المرحلة 2: النشر');
  const chart = successCharts[0];
  const text = buildSignalText(chart.coin, '1h');

  console.log(`📤 نشر ${chart.coin}...`);
  const result = postWithImage(text, chart.path);

  if (result.success) {
    console.log('✅ تم النشر بنجاح');
  } else {
    console.log(`❌ فشل النشر: ${result.error}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(err => { console.error(err); process.exit(1); });
}
