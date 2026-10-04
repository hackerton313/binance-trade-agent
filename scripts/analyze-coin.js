// scripts/analyze-coin.js
// يجلب بيانات السوق ويطلب من AI كتابة تحليل

import axios from 'axios';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// 1. جلب بيانات السوق (السعر + RSI)
async function fetchMarketData(coin) {
  const symbol = `${coin}USDT`;
  
  try {
    // السعر الحالي
    const priceRes = await axios.get(
      `https://api.binance.us/api/v3/ticker/24hr?symbol=${symbol}`,
      { timeout: 15000 }
    );
    
    // شموع 1h لحساب RSI
    const klinesRes = await axios.get(
      `https://api.binance.us/api/v3/klines?symbol=${symbol}&interval=1h&limit=50`,
      { timeout: 15000 }
    );
    
    const closes = klinesRes.data.map(k => parseFloat(k[4]));
    const rsi = calculateRSI(closes, 14);
    const currentPrice = parseFloat(priceRes.data.lastPrice);
    const priceChange = parseFloat(priceRes.data.priceChangePercent);
    const high24h = parseFloat(priceRes.data.highPrice);
    const low24h = parseFloat(priceRes.data.lowPrice);
    
    return { currentPrice, priceChange, high24h, low24h, rsi };
  } catch (err) {
    console.log(`⚠️ فشل جلب البيانات: ${err.message}`);
    return null;
  }
}

// 2. حساب RSI
function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) return 50;
  
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - diff) / period;
    }
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// 3. طلب التحليل من Groq
async function analyzeWithAI(coin, data) {
  const prompt = `أنت محلل عملات رقمية محترف. اكتب تحليلاً قصيراً بالعربية لعملة ${coin}.

بيانات السوق:
- السعر الحالي: $${data.currentPrice.toFixed(4)}
- التغير (24 ساعة): ${data.priceChange.toFixed(2)}%
- أعلى سعر (24 ساعة): $${data.high24h.toFixed(4)}
- أدنى سعر (24 ساعة): $${data.low24h.toFixed(4)}
- RSI (14 على 1h): ${data.rsi.toFixed(1)}

المطلوب:
1. اذكر السعر الحالي بوضوح
2. حلّل مؤشر RSI (هل التشبع شراء/بيع؟)
3. اذكر الاتجاه العام
4. أعط توصية واضحة (BUY / SELL / WAIT)
5. اذكر مستويات دعم ومقاومة تقديرية

اجعل النص بين 800 و 1500 حرف.
أضف 2 $CASHTAGS و 2 #hashtags فقط.
اكتب فقط نص المنشور، بدون مقدمات.`;

  try {
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: 'أنت محلل عملات رقمية محترف يكتب لمنصة Binance Square.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    return res.data.choices[0].message.content;
  } catch (err) {
    console.log(`⚠️ فشل AI: ${err.message}`);
    return null;
  }
}

export { fetchMarketData, analyzeWithAI };
