const express = require('express');
const router = express.Router();
const exchangeService = require('../services/exchange');
const technicalAnalysis = require('../services/technicalAnalysis');
const aiService = require('../services/ai');
const chatService = require('../services/chat');
const config = require('../config');

const DEFAULT_TIMEFRAMES = ['1d', '4h', '1h'];

router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'يرجى كتابة رسالتك' });
    }

    const symbols = chatService.extractSymbols(message);

    const analysisCallback = async (symbol) => {
      const multiTimeframeData = await exchangeService.fetchMultiTimeframe(symbol, DEFAULT_TIMEFRAMES);
      const technicalResults = {};
      for (const [tf, candles] of Object.entries(multiTimeframeData)) {
        technicalResults[tf] = technicalAnalysis.analyze(candles);
      }
      const alignment = technicalAnalysis.analyzeMultiTimeframe(multiTimeframeData);
      return {
        timeframes: technicalResults,
        alignment: alignment.alignment,
        lastPrice: multiTimeframeData[DEFAULT_TIMEFRAMES[0]][multiTimeframeData[DEFAULT_TIMEFRAMES[0]].length - 1].close
      };
    };

    const result = await chatService.chat(message, analysisCallback);

    res.json({
      success: true,
      data: {
        message: result.response,
        symbols: result.symbols,
        model: result.model
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/analyze', async (req, res) => {
  try {
    const { symbols, timeframes = DEFAULT_TIMEFRAMES } = req.body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: 'يرجى تقديم مصفوفة من الرموز (symbols)' });
    }

    const results = {};

    for (const symbol of symbols) {
      const multiTimeframeData = await exchangeService.fetchMultiTimeframe(symbol, timeframes);

      const technicalResults = {};
      for (const [tf, candles] of Object.entries(multiTimeframeData)) {
        technicalResults[tf] = technicalAnalysis.analyze(candles);
      }

      const alignment = technicalAnalysis.analyzeMultiTimeframe(multiTimeframeData);
      const aiResult = await aiService.analyze(symbol, alignment);

      results[symbol] = {
        timeframes: technicalResults,
        alignment: alignment.alignment,
        ai: aiResult,
        lastPrice: multiTimeframeData[timeframes[0]][multiTimeframeData[timeframes[0]].length - 1].close
      };
    }

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/technical', async (req, res) => {
  try {
    const { symbol, timeframes = DEFAULT_TIMEFRAMES } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: 'يرجى تقديم الرمز (symbol)' });
    }

    const multiTimeframeData = await exchangeService.fetchMultiTimeframe(symbol, timeframes);
    const results = {};
    for (const [tf, candles] of Object.entries(multiTimeframeData)) {
      results[tf] = technicalAnalysis.analyze(candles);
    }

    const alignment = technicalAnalysis.analyzeMultiTimeframe(multiTimeframeData);

    res.json({
      success: true,
      symbol,
      timeframes,
      data: results,
      alignment: alignment.alignment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/symbols', async (req, res) => {
  try {
    const symbols = await exchangeService.getAvailableSymbols();
    res.json({ success: true, symbols });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
