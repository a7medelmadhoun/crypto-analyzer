module.exports = {
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openrouter/alpha'
  },
  exchange: {
    name: 'binance',
    defaultTimeframe: '1h',
    candleLimit: 50
  },
  server: {
    port: process.env.PORT || 3000
  }
};
