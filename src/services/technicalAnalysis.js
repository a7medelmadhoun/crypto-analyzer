class TechnicalAnalysis {
  calculateRSI(candles, period = 14) {
    const closes = candles.map(c => c.close);
    let gains = [], losses = [];

    for (let i = 1; i < closes.length; i++) {
      const diff = closes[i] - closes[i - 1];
      gains.push(diff > 0 ? diff : 0);
      losses.push(diff < 0 ? Math.abs(diff) : 0);
    }

    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < gains.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    }

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const value = 100 - (100 / (1 + rs));

    let signal = 'neutral';
    if (value > 70) signal = 'overbought';
    else if (value < 30) signal = 'oversold';
    else if (value > 50) signal = 'bullish';
    else signal = 'bearish';

    return { value, signal };
  }

  calculateEMA(candles, period) {
    const closes = candles.map(c => c.close);
    const multiplier = 2 / (period + 1);
    let ema = closes[0];

    for (let i = 1; i < closes.length; i++) {
      ema = (closes[i] - ema) * multiplier + ema;
    }

    return {
      value: ema,
      price: closes[closes.length - 1],
      trend: closes[closes.length - 1] > ema ? 'above' : 'below'
    };
  }

  calculateOrderBlocks(candles) {
    const orderBlocks = [];
    for (let i = 2; i < candles.length; i++) {
      const curr = candles[i - 1];
      const next = candles[i];

      if (curr.close > curr.open && next.close < next.open && next.close < curr.open) {
        orderBlocks.push({ type: 'bearish', level: curr.high, index: i - 1 });
      }

      if (curr.close < curr.open && next.close > next.open && next.close > curr.open) {
        orderBlocks.push({ type: 'bullish', level: curr.low, index: i - 1 });
      }
    }
    return orderBlocks.slice(-3);
  }

  calculateFairValueGaps(candles) {
    const fvgs = [];
    for (let i = 2; i < candles.length; i++) {
      const first = candles[i - 2];
      const third = candles[i];

      if (first.high < third.low) {
        fvgs.push({ type: 'bullish', top: third.low, bottom: first.high, index: i - 1 });
      }
      if (first.low > third.high) {
        fvgs.push({ type: 'bearish', top: first.low, bottom: third.high, index: i - 1 });
      }
    }
    return fvgs.slice(-3);
  }

  calculateSupportResistance(candles) {
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const closes = candles.map(c => c.close);

    const recentHigh = Math.max(...highs.slice(-10));
    const recentLow = Math.min(...lows.slice(-10));
    const currentPrice = closes[closes.length - 1];

    const levels = [];
    for (let i = 1; i < candles.length - 1; i++) {
      if (highs[i] > highs[i - 1] && highs[i] > highs[i + 1]) {
        levels.push({ type: 'resistance', value: highs[i] });
      }
      if (lows[i] < lows[i - 1] && lows[i] < lows[i + 1]) {
        levels.push({ type: 'support', value: lows[i] });
      }
    }

    const nearestSupport = levels
      .filter(l => l.type === 'support' && l.value < currentPrice)
      .sort((a, b) => b.value - a.value)[0];

    const nearestResistance = levels
      .filter(l => l.type === 'resistance' && l.value > currentPrice)
      .sort((a, b) => a.value - b.value)[0];

    return {
      recentHigh, recentLow,
      support: nearestSupport?.value || recentLow,
      resistance: nearestResistance?.value || recentHigh,
      currentPrice,
      allLevels: levels.slice(-5)
    };
  }

  analyze(candles) {
    const rsi = this.calculateRSI(candles);
    const ema20 = this.calculateEMA(candles, 20);
    const ema50 = this.calculateEMA(candles, 50);
    const orderBlocks = this.calculateOrderBlocks(candles);
    const fvgs = this.calculateFairValueGaps(candles);
    const sr = this.calculateSupportResistance(candles);

    return {
      rsi, ema20, ema50, orderBlocks, fairValueGaps: fvgs, supportResistance: sr,
      summary: {
        trend: ema20.trend === 'above' && ema50.trend === 'above' ? 'bullish' :
               ema20.trend === 'below' && ema50.trend === 'below' ? 'bearish' : 'neutral',
        rsiSignal: rsi.signal,
        priceToEma20: ema20.trend,
        priceToEma50: ema50.trend
      }
    };
  }

  analyzeMultiTimeframe(multiTimeframeData) {
    const results = {};

    for (const [timeframe, candles] of Object.entries(multiTimeframeData)) {
      results[timeframe] = this.analyze(candles);
    }

    const timeframes = Object.keys(results);
    const higherTf = timeframes[0];
    const lowerTf = timeframes[timeframes.length - 1];

    const allAnalyses = Object.values(results);
    const alignment = {
      trendAlignment: allAnalyses.every(r => r.summary.trend === allAnalyses[0].summary.trend),
      dominantTrend: results[higherTf].summary.trend,
      rsiDivergence: results[lowerTf].rsi.signal !== results[higherTf].rsi.signal,
      overallScore: this.calculateAlignmentScore(results)
    };

    return { timeframes: results, alignment };
  }

  calculateAlignmentScore(results) {
    let score = 50;
    const analyses = Object.values(results);

    for (const analysis of analyses) {
      if (analysis.summary.trend === 'bullish') score += 10;
      else if (analysis.summary.trend === 'bearish') score -= 10;

      if (analysis.rsi.signal === 'oversold') score += 5;
      else if (analysis.rsi.signal === 'overbought') score -= 5;

      if (analysis.ema20.trend === 'above') score += 5;
      else score -= 5;
    }

    return Math.max(0, Math.min(100, score));
  }
}

module.exports = new TechnicalAnalysis();
