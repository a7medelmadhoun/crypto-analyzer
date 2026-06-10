module.exports = {
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openrouter/owl-alpha'
  },
  exchange: {
    name: 'bybit',
    defaultTimeframe: '1h',
    candleLimit: 50
  },
  server: {
    port: process.env.PORT || 3000
  }
};
