// scripts/main.js
// السكريبت الرئيسي: توليد الشارت + تحليل AI + النشر

import { generateCharts } from './generate-chart.js';
import { postWithImage } from './post-to-square.js';
import { fetchMarketData, analyzeWithAI } from './analyze-coin.js';

function buildFallbackText(coin) {
  const now = new Date().toUTCString().slice(0, 16);
  return `📊 إشارة تداول - $${coin}/USDT

🕐 ${now} UTC

📈 الشارت مرفق أدناه (Supertrend + RSI)

⚠️ إدارة المخاطر:
• لا تخاطر بأكثر من 1-2% من رأس المال
• ضع وقف الخسارة دائماً
• هذه ليست نصيحة مالية، قم ببحثك الخاص (DYOR)

#Crypto #Trading`;
}

async function main() {
  console.log('🚀 بدء التشغيل...\n');

  // 1. توليد الشارت
  console.log('📊 المرحلة 1: توليد الشارت');
  const charts = await generateCharts();
  const successCharts = charts.filter(c => c.success);

  if (successCharts.length === 0) {
    console.log('❌ لم يتم توليد أي شارت، إيقاف');
    process.exit(1);
  }

  const chart = successCharts[0];
  console.log(`\n📊 العملة المختارة: ${chart.coin}`);

  // 2. جلب بيانات السوق
  console.log('\n📈 المرحلة 2: جلب بيانات السوق');
  const marketData = await fetchMarketData(chart.coin);

  let text;

  if (marketData) {
    console.log(`   السعر: $${marketData.currentPrice}`);
    console.log(`   التغير: ${marketData.priceChange.toFixed(2)}%`);
    console.log(`   RSI: ${marketData.rsi.toFixed(1)}`);

    // 3. طلب تحليل AI
    console.log('\n🤖 المرحلة 3: تحليل AI');
    text = await analyzeWithAI(chart.coin, marketData);

    if (text) {
      console.log(`   ✅ تم التحليل (${text.length} حرف)`);
    } else {
      console.log('   ⚠️ فشل AI، استخدام القالب الاحتياطي');
    }
  } else {
    console.log('   ⚠️ فشل جلب البيانات، استخدام القالب الاحتياطي');
  }

  // احتياطي: إذا فشل AI أو البيانات
  if (!text) {
    text = buildFallbackText(chart.coin);
  }

  console.log('\n📝 النص النهائي:');
  console.log('─'.repeat(60));
  console.log(text.slice(0, 300) + (text.length > 300 ? '...' : ''));
  console.log('─'.repeat(60));

  // 4. النشر
  console.log('\n📤 المرحلة 4: النشر على Binance Square');
  const result = postWithImage(text, chart.path);

  if (result.success) {
    console.log('✅ تم النشر بنجاح');
  } else {
    console.log(`❌ فشل النشر: ${result.error}`);
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
