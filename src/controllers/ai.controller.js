import { queryAI } from '../services/ai.service.js';
import { logger } from '../config/db.config.js';
import { classifyIntent } from '../services/ml.service.js';
import { buildRAGContext } from '../services/rag.service.js';
import { storeInteraction } from '../services/memory.manager.js';
import pluginManager from '../services/plugin.manager.js';
import Evaluation from '../models/evaluation.model.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const handleAIChat = async (req, res, next) => {
  const { prompt, model } = req.body;
  const userId = req.user?.id || null;

  if (!prompt) {
    return ApiResponse.error(res, 'Prompt is required', ['Validation Error'], 400);
  }

  const startTime = Date.now();

  try {
    const classification = await classifyIntent(prompt);
    const intent = classification?.intent || 'general_chat';

    const pluginResult = await pluginManager.executePlugin(intent, prompt, userId);
    if (pluginResult) {
      await storeInteraction('user', prompt, userId, 'task');
      await storeInteraction('assistant', pluginResult.message, userId, 'task');
      
      const latency = Date.now() - startTime;
      const evaluation = new Evaluation({
        modelUsed: 'PluginManager',
        promptLength: prompt.length,
        responseLength: pluginResult.message.length,
        latencyMs: latency,
        memoryHitsCount: 0,
        successRate: 1
      });
      await evaluation.save().catch(err => logger.warn(`Evaluation save error: ${err.message}`));

      return ApiResponse.success(res, 'AI execution successful', {
        response: pluginResult.message,
        intent
      }, 200, { latencyMs: latency });
    }

    const ragContext = await buildRAGContext(prompt, userId);
    const enrichedPrompt = `${ragContext}User prompt: ${prompt}`;
    const aiResponse = await queryAI(enrichedPrompt, model);
    const latency = Date.now() - startTime;

    await storeInteraction('user', prompt, userId, 'episodic');
    await storeInteraction('assistant', aiResponse, userId, 'episodic');

    const evaluation = new Evaluation({
      modelUsed: model || 'llama-3.3-70b-versatile',
      promptLength: prompt.length,
      responseLength: aiResponse.length,
      latencyMs: latency,
      memoryHitsCount: ragContext ? 1 : 0,
      successRate: 1
    });
    await evaluation.save().catch(err => logger.warn(`Evaluation save error: ${err.message}`));

    return ApiResponse.success(res, 'AI query processed successfully', {
      response: aiResponse,
      intent
    }, 200, { latencyMs: latency });
  } catch (error) {
    next(error);
  }
};

export const getAIStatus = (req, res) => {
  return ApiResponse.success(res, 'AI status fetched', {
    provider: 'groq',
    configured: Boolean(process.env.GROQ_API_KEY),
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
  });
};
