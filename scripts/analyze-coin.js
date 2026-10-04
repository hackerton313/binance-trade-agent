// scripts/analyze-coin.js
// Fetches market data and asks AI to write an English analysis

import axios from 'axios';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function fetchMarketData(coin) {
  const symbol = `${coin}USDT`;

  try {
    const priceRes = await axios.get(
      `https://api.binance.us/api/v3/ticker/24hr?symbol=${symbol}`,
      { timeout: 15000 }
    );

    const klinesRes = await axios.get(
      `https://api.binance.us/api/v3/klines?symbol=${symbol}&interval=4h&limit=50`,
      { timeout: 15000 }
    );

    const closes = klinesRes.data.map(k => parseFloat(k[4]));
    const rsi = calculateRSI(closes, 14);
    const currentPrice = parseFloat(priceRes.data.lastPrice);
    const priceChange = parseFloat(priceRes.data.priceChangePercent);
    const high24h = parseFloat(priceRes.data.highPrice);
    const low24h = parseFloat(priceRes.data.lowPrice);

    if (!currentPrice || currentPrice <= 0 || isNaN(currentPrice)) {
      console.log(`⚠️ Invalid price: ${currentPrice}`);
      return null;
    }

    return { currentPrice, priceChange, high24h, low24h, rsi };
  } catch (err) {
    console.log(`⚠️ Failed to fetch data: ${err.message}`);
    return null;
  }
}

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

async function analyzeWithAI(coin, data) {
  const prompt = `You are a professional crypto analyst. Write a short trade analysis in ENGLISH for $${coin}.

Market Data:
- Current Price: $${data.currentPrice}
- 24h Change: ${data.priceChange}%
- 24h High: $${data.high24h}
- 24h Low: $${data.low24h}
- RSI (14 on 4h): ${data.rsi.toFixed(1)}

⚠️ STRICT RULES (must follow exactly):
- Length: between 400 and 700 characters ONLY — no more
- Do NOT repeat information
- Do NOT explain what RSI is
- ALWAYS use $${coin} (with dollar sign) when mentioning the coin
- End with exactly 2 $CASHTAGS and 2 #hashtags (e.g., $${coin} $BTC #Crypto #Trading)
- Start with ONE sentence: price + trend
- Short paragraph: RSI reading + recommendation (BUY / SELL / WAIT)
- Final sentence: risk management tip
- Write ONLY the post text, no titles or introductions

Tone: professional but engaging, suitable for Binance Square.`;

  try {
    const res = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'qwen/qwen3.8-27b',
        messages: [
          { role: 'system', content: 'You are a professional crypto analyst writing for Binance Square. Be concise and precise. Always include the $ symbol before coin tickers.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 600
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
    console.log(`⚠️ AI failed: ${err.message}`);
    return null;
  }
}

export { fetchMarketData, analyzeWithAI };
