const ccxt = require('ccxt');
const config = require('../config');

class ExchangeService {
  constructor() {
    this.exchange = new ccxt[config.exchange.name]({
      enableRateLimit: true,
      options: { defaultType: 'spot' }
    });
  }

  async fetchCandles(symbol, timeframe = config.exchange.defaultTimeframe, limit = config.exchange.candleLimit) {
    try {
      const ohlcv = await this.exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
      return ohlcv.map(candle => ({
        timestamp: candle[0],
        date: new Date(candle[0]),
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      }));
    } catch (error) {
      throw new Error(`Failed to fetch candles for ${symbol}: ${error.message}`);
    }
  }

  async fetchMultiTimeframe(symbol, timeframes, limit = config.exchange.candleLimit) {
    const results = {};
    for (const tf of timeframes) {
      results[tf] = await this.fetchCandles(symbol, tf, limit);
    }
    return results;
  }

  async fetchMultipleSymbols(symbols, timeframes, limit = config.exchange.candleLimit) {
    const results = {};
    for (const symbol of symbols) {
      results[symbol] = await this.fetchMultiTimeframe(symbol, timeframes, limit);
    }
    return results;
  }

  async getAvailableSymbols() {
    const markets = await this.exchange.loadMarkets();
    return Object.keys(markets).filter(s => s.endsWith('/USDT'));
  }
}

module.exports = new ExchangeService();
