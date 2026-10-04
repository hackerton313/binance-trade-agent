// scripts/main.js
// Main script: generate chart + AI analysis + publish

import { generateCharts } from './generate-chart.js';
import { postWithImage } from './post-to-square.js';
import { fetchMarketData, analyzeWithAI } from './analyze-coin.js';

function buildFallbackText(coin) {
  const now = new Date().toUTCString().slice(0, 16);
  return `📊 Trade Signal - $${coin}/USDT (4H)

🕐 ${now} UTC

📈 Chart attached below (RSI + Supertrend)

⚠️ Risk Management:
• Never risk more than 1-2% of your capital
• Always set a stop-loss
• This is not financial advice, do your own research (DYOR)

$${coin} #Crypto #Trading`;
}

async function main() {
  console.log('🚀 Starting agent...\n');

  // 1. Generate chart
  console.log('📊 Phase 1: Generating chart');
  const charts = await generateCharts();
  const successCharts = charts.filter(c => c.success);

  if (successCharts.length === 0) {
    console.log('❌ No chart generated, stopping');
    process.exit(1);
  }

  const chart = successCharts[0];
  console.log(`\n📊 Selected coin: ${chart.coin}`);

  // 2. Fetch market data
  console.log('\n📈 Phase 2: Fetching market data');
  const marketData = await fetchMarketData(chart.coin);

  let text;

  if (marketData) {
    console.log(`   Price: $${marketData.currentPrice}`);
    console.log(`   Change: ${marketData.priceChange.toFixed(2)}%`);
    console.log(`   RSI: ${marketData.rsi.toFixed(1)}`);

    // 3. Request AI analysis
    console.log('\n🤖 Phase 3: AI analysis');
    text = await analyzeWithAI(chart.coin, marketData);

    if (text) {
      console.log(`   ✅ Analysis complete (${text.length} chars)`);
    } else {
      console.log('   ⚠️ AI failed, using fallback template');
    }
  } else {
    console.log('   ⚠️ Failed to fetch data, using fallback template');
  }

  // Fallback: if AI or data failed
  if (!text) {
    text = buildFallbackText(chart.coin);
  }

  console.log('\n📝 Final text:');
  console.log('─'.repeat(60));
  console.log(text.slice(0, 300) + (text.length > 300 ? '...' : ''));
  console.log('─'.repeat(60));

  // 4. Publish
  console.log('\n📤 Phase 4: Publishing to Binance Square');
  const result = postWithImage(text, chart.path);

  if (result.success) {
    console.log('✅ Published successfully');
  } else {
    console.log(`❌ Publish failed: ${result.error}`);
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
