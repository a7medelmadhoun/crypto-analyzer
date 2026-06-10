const config = require('../config');

class ChatService {
  constructor() {
    this.apiKey = config.openrouter.apiKey;
    this.baseUrl = config.openrouter.baseUrl;
    this.model = config.openrouter.model;

    this.symbolMap = {
      'bitcoin': 'BTC/USDT',
      'بتكوين': 'BTC/USDT',
      'بيتكوين': 'BTC/USDT',
      'btc': 'BTC/USDT',
      'ether': 'ETH/USDT',
      'ethereum': 'ETH/USDT',
      'اثير': 'ETH/USDT',
      'اتيريوم': 'ETH/USDT',
      'eth': 'ETH/USDT',
      'solana': 'SOL/USDT',
      'سولانا': 'SOL/USDT',
      'sol': 'SOL/USDT',
      'ripple': 'XRP/USDT',
      'ريبل': 'XRP/USDT',
      'xrp': 'XRP/USDT',
      'dogecoin': 'DOGE/USDT',
      'دوجكوين': 'DOGE/USDT',
      'doge': 'DOGE/USDT',
      'cardano': 'ADA/USDT',
      'كاردانو': 'ADA/USDT',
      'ada': 'ADA/USDT',
      'polkadot': 'DOT/USDT',
      'بولكادوت': 'DOT/USDT',
      'dot': 'DOT/USDT',
      'avalanche': 'AVAX/USDT',
      'افالانشي': 'AVAX/USDT',
      'avax': 'AVAX/USDT',
      'link': 'LINK/USDT',
      'تشين لينك': 'LINK/USDT',
      'polygon': 'MATIC/USDT',
      'بوليغون': 'MATIC/USDT',
      'matic': 'MATIC/USDT'
    };
  }

  extractSymbols(message) {
    const lowerMsg = message.toLowerCase();
    const foundSymbols = [];

    for (const [key, value] of Object.entries(this.symbolMap)) {
      if (lowerMsg.includes(key)) {
        if (!foundSymbols.includes(value)) {
          foundSymbols.push(value);
        }
      }
    }

    return foundSymbols.length > 0 ? foundSymbols : ['BTC/USDT'];
  }

  async chat(message, analysisCallback) {
    const symbols = this.extractSymbols(message);

    const analysisResults = {};
    for (const symbol of symbols) {
      analysisResults[symbol] = await analysisCallback(symbol);
    }

    const prompt = this.buildChatPrompt(message, symbols, analysisResults);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://crypto-analyzer.app',
          'X-Title': 'Crypto Analyzer'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `أنت مساعد ذكي متخصص في تحليل العملات الرقمية. المستخدم يسألك عن تحليل عملة معينة. قدم له تحليل شاملاً مع قرار نهائي واضح وأسباب الدخول. كن مختصاً ومباشراً.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 2000
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Chat analysis failed');
      }

      return {
        response: data.choices[0].message.content,
        symbols: symbols,
        model: this.model
      };
    } catch (error) {
      throw new Error(`Chat Error: ${error.message}`);
    }
  }

  buildChatPrompt(message, symbols, results) {
    let prompt = `طلب المستخدم: ${message}\n\n`;

    for (const symbol of symbols) {
      const data = results[symbol];
      prompt += `
=== تحليل ${symbol} ===
السعر الحالي: ${data.lastPrice}
الإطار اليومي:
  - الاتجاه: ${data.timeframes['1d']?.summary.trend || 'غير متاح'}
  - RSI: ${data.timeframes['1d']?.rsi.value.toFixed(2) || 'غير متاح'} (${data.timeframes['1d']?.rsi.signal || ''})
  - EMA20: ${data.timeframes['1d']?.ema20.trend || 'غير متاح'}
  - EMA50: ${data.timeframes['1d']?.ema50.trend || 'غير متاح'}
  - الدعم: ${data.timeframes['1d']?.supportResistance.support || 'غير متاح'}
  - المقاومة: ${data.timeframes['1d']?.supportResistance.resistance || 'غير متاح'}

الإطار 4 ساعات:
  - الاتجاه: ${data.timeframes['4h']?.summary.trend || 'غير متاح'}
  - RSI: ${data.timeframes['4h']?.rsi.value.toFixed(2) || 'غير متاح'} (${data.timeframes['4h']?.rsi.signal || ''})
  - EMA20: ${data.timeframes['4h']?.ema20.trend || 'غير متاح'}
  - EMA50: ${data.timeframes['4h']?.ema50.trend || 'غير متاح'}
  - الدعم: ${data.timeframes['4h']?.supportResistance.support || 'غير متاح'}
  - المقاومة: ${data.timeframes['4h']?.supportResistance.resistance || 'غير متاح'}

الإطار ساعة:
  - الاتجاه: ${data.timeframes['1h']?.summary.trend || 'غير متاح'}
  - RSI: ${data.timeframes['1h']?.rsi.value.toFixed(2) || 'غير متاح'} (${data.timeframes['1h']?.rsi.signal || ''})
  - EMA20: ${data.timeframes['1h']?.ema20.trend || 'غير متاح'}
  - EMA50: ${data.timeframes['1h']?.ema50.trend || 'غير متاح'}
  - الدعم: ${data.timeframes['1h']?.supportResistance.support || 'غير متاح'}
  - المقاومة: ${data.timeframes['1h']?.supportResistance.resistance || 'غير متاح'}

توافق الإطارات: ${data.alignment.trendAlignment ? 'متوافق' : 'غير متوافق'}
الاتجاه السائد: ${data.alignment.dominantTrend}
نقاط التوافق: ${data.alignment.overallScore}/100
`;
    }

    prompt += `
يرجى الرد بالشكل التالي:
1. ملخص موجز لكل عملة
2. القرار النهائي: شراء / بيع / انتظار
3. أسباب القرار (3 أسباب واضحة)
4. نقاط الدخول والخروج
5. مستوى المخاطرة`;

    return prompt;
  }
}

module.exports = new ChatService();
