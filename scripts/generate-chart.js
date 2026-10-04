const axios = require('axios');
const QuickChart = require('quickchart-js');
const fs = require('fs');
const path = require('path');

// ===== الإعدادات =====
const COINS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];
const TIMEFRAME = '1h';
const OUTPUT_DIR = './charts';
const LIMIT = 48;

// ألوان Binance الدقيقة
const COLORS = {
  background: '#0B0E11',
  grid: '#2B3139',
  text: '#EAECEF',
  bull: '#0ECB81',
  bear: '#F6465D',
  ema9: '#F0B90B',
  ema21: '#5DADE2',
  volumeUp: 'rgba(14, 203, 129, 0.5)',
  volumeDown: 'rgba(246, 70, 93, 0.5)',
};

// ===== 1. جلب البيانات مع Fallback =====
async function fetchKlines(symbol, interval, limit) {
  // حوّل BTC/USDT إلى BTCUSDT
  const apiSymbol = symbol.replace('/', '');

  // 1. Binance US
  try {
    const res = await axios.get(
      `https://api.binance.us/api/v3/klines?symbol=${apiSymbol}&interval=${interval}&limit=${limit}`,
      { timeout: 15000 }
    );
    if (res.data && res.data.length > 0) {
      console.log(`  ✅ جلب ${symbol} من binanceus`);
      return res.data;
    }
  } catch (err) {
    console.log(`  ⚠️ فشل binanceus: ${err.message.slice(0, 50)}`);
  }

  // 2. Binance.com
  try {
    const res = await axios.get(
      `https://api.binance.com/api/v3/klines?symbol=${apiSymbol}&interval=${interval}&limit=${limit}`,
      { timeout: 15000 }
    );
    if (res.data && res.data.length > 0) {
      console.log(`  ✅ جلب ${symbol} من binance.com`);
      return res.data;
    }
  } catch (err) {
    console.log(`  ⚠️ فشل binance.com: ${err.message.slice(0, 50)}`);
  }

  return null;
}

// ===== 2. حساب EMA =====
function calculateEMA(data, period) {
  const k = 2 / (period + 1);
  const ema = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

// ===== 3. تجهيز بيانات الشموع =====
function prepareCandlestickData(klines) {
  return klines.map((k) => ({
    x: k[0],
    o: parseFloat(k[1]),
    h: parseFloat(k[2]),
    l: parseFloat(k[3]),
    c: parseFloat(k[4]),
    v: parseFloat(k[5]),
  }));
}

// ===== 4. توليد صورة الشارت =====
async function generateChartForCoin(symbol, timeframe, outputPath) {
  const klines = await fetchKlines(symbol, timeframe, LIMIT);
  if (!klines || klines.length === 0) {
    throw new Error('لا توجد بيانات');
  }

  const candles = prepareCandlestickData(klines);
  const closes = candles.map((c) => c.c);

  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);

  const lastCandle = candles[candles.length - 1];
  const lastPrice = lastCandle.c;
  const priceChange = ((lastCandle.c - candles[0].c) / candles[0].c) * 100;
  const changeColor = priceChange >= 0 ? COLORS.bull : COLORS.bear;

  const myChart = new QuickChart();
  myChart.setWidth(1200);
  myChart.setHeight(800);
  myChart.setBackgroundColor(COLORS.background);
  myChart.setFormat('png');
  myChart.setDevicePixelRatio(1.5);
  myChart.setVersion('4');
  
  const chartConfig = {
    type: 'candlestick',
    data: {
      datasets: [
        {
          label: `${symbol} ${timeframe}`,
          data: candles,
          color: {
            up: COLORS.bull,
            down: COLORS.bear,
            unchanged: COLORS.text,
          },
          borderColor: {
            up: COLORS.bull,
            down: COLORS.bear,
            unchanged: COLORS.text,
          },
          yAxisID: 'y',
        },
        {
          label: 'EMA 9',
          type: 'line',
          data: closes.map((c, i) => ({ x: candles[i].x, y: ema9[i] })),
          borderColor: COLORS.ema9,
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          yAxisID: 'y',
        },
        {
          label: 'EMA 21',
          type: 'line',
          data: closes.map((c, i) => ({ x: candles[i].x, y: ema21[i] })),
          borderColor: COLORS.ema21,
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          yAxisID: 'y',
        },
        {
          label: 'Volume',
          type: 'bar',
          data: candles.map((c) => ({
            x: c.x,
            y: c.v,
          })),
          backgroundColor: candles.map((c) =>
            c.c >= c.o ? COLORS.volumeUp : COLORS.volumeDown
          ),
          yAxisID: 'volume',
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: `${symbol} · ${timeframe} · $${lastPrice.toFixed(4)} (${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%)`,
        color: changeColor,
        font: {
          size: 20,
          weight: 'bold',
        },
        padding: { top: 10, bottom: 20 },
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: COLORS.text,
          font: { size: 12 },
          usePointStyle: true,
        },
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'hour',
            displayFormats: { hour: 'HH:mm' },
          },
          grid: { color: COLORS.grid, drawBorder: false },
          ticks: { color: COLORS.text, maxTicksLimit: 8 },
        },
        y: {
          position: 'right',
          grid: { color: COLORS.grid, drawBorder: false },
          ticks: {
            color: COLORS.text,
            callback: (value) => value.toFixed(2),
          },
        },
        volume: {
          position: 'left',
          display: false,
        },
      },
    },
  };

  myChart.setConfig(chartConfig);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  await myChart.toFile(outputPath);
  return { price: lastPrice, change: priceChange };
}

// ===== الدالة الرئيسية =====
async function generateCharts() {
  const results = [];

  for (const coin of COINS) {
    const symbol = `${coin}/USDT`;
    const outputPath = path.join(OUTPUT_DIR, `${coin.toLowerCase()}-chart.png`);

    console.log(`📊 توليد شارت ${symbol}...`);

    try {
      const info = await generateChartForCoin(symbol, TIMEFRAME, outputPath);
      const size = fs.statSync(outputPath).size;
      console.log(`  ✅ ${outputPath} (${(size / 1024).toFixed(1)} KB) - السعر: $${info.price}`);

      results.push({
        coin,
        symbol,
        path: outputPath,
        success: true,
        size,
        price: info.price,
        change: info.change,
      });
    } catch (error) {
      console.log(`  ❌ فشل ${coin}: ${error.message}`);
      results.push({ coin, symbol, path: outputPath, success: false, error: error.message });
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  return results;
}

module.exports = { generateCharts, COINS, TIMEFRAME };

if (require.main === module) {
  generateCharts()
    .then((results) => {
      const ok = results.filter((r) => r.success).length;
      console.log(`\n🎉 ${ok}/${results.length} شارت تم توليده`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
