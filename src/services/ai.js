const config = require('../config');

class AIService {
  constructor() {
    this.apiKey = config.openrouter.apiKey;
    this.baseUrl = config.openrouter.baseUrl;
    this.model = config.openrouter.model;
  }

  async analyze(symbol, multiTimeframeData) {
    const prompt = this.buildMultiTimeframePrompt(symbol, multiTimeframeData);

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
              content: `أنت خبير في تحليل سوق العملات الرقمية. قم بتحليل البيانات الفنية من عدة إطارات زمنية واستخرج القرار النهائي مع الأسباب. كن مختصاً ومباشراً.`
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
        throw new Error(data.error?.message || 'AI analysis failed');
      }

      return {
        analysis: data.choices[0].message.content,
        model: this.model,
        usage: data.usage
      };
    } catch (error) {
      throw new Error(`AI Analysis Error: ${error.message}`);
    }
  }

  buildMultiTimeframePrompt(symbol, data) {
    const { timeframes, alignment } = data;

    let prompt = `تحليل ${symbol} على عدة إطارات زمنية:\n\n`;

    for (const [tf, analysis] of Object.entries(timeframes)) {
      prompt += `
=== الإطار الزمني: ${tf} ===
الاتجاه: ${analysis.summary.trend}
RSI: ${analysis.rsi.value.toFixed(2)} (${analysis.rsi.signal})
EMA20: ${analysis.ema20.value.toFixed(2)} - السعر ${analysis.ema20.trend === 'above' ? 'فوق' : 'تحت'}
EMA50: ${analysis.ema50.value.toFixed(2)} - السعر ${analysis.ema50.trend === 'above' ? 'فوق' : 'تحت'}
السعر الحالي: ${analysis.supportResistance.currentPrice}
الدعم: ${analysis.supportResistance.support}
المقاومة: ${analysis.supportResistance.resistance}
Order Blocks: ${analysis.orderBlocks.map(ob => `${ob.type} @ ${ob.level}`).join(', ') || 'لا يوجد'}
FVG: ${analysis.fairValueGaps.map(fvg => `${fvg.type} ${fvg.bottom}-${fvg.top}`).join(', ') || 'لا يوجد'}
`;
    }

    prompt += `
=== تحليل التوافق بين الإطارات ===
توافق الاتجاهات: ${alignment.trendAlignment ? 'متوافق' : 'غير متوافق'}
الاتجاه السائد: ${alignment.dominantTrend}
تنافر RSI: ${alignment.rsiDivergence ? 'يوجد' : 'لا يوجد'}
نقاط التوافق: ${alignment.overallScore}/100

يرجى تقديم:
1. تحليل لكل إطار زمني بشكل موجز
2. مستوى توافق الإطارات (متوافق/غير متوافق)
3. القرار النهائي: شراء / بيع / انتظار
4. أسباب القرار (3 أسباب رئيسية)
5. نقاط الدخول والخروج:
   - نقطة الدخول
   - وقف الخسارة
   - هدف الربح 1
   - هدف الربح 2
6. نسبة المخاطرة إلى العائد
7. مستوى الثقة في القرار (منخفض/متوسط/مرتفع)`;

    return prompt;
  }
}

module.exports = new AIService();
