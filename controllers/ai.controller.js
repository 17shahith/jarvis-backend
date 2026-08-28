import { queryAI } from '../services/ai.service.js';
import { logger } from '../config/db.config.js';
import { classifyIntent } from '../services/ml.service.js';
import { buildRAGContext } from '../services/rag.service.js';
import { storeInteraction } from '../services/memory.manager.js';
import pluginManager from '../services/plugin.manager.js';
import Evaluation from '../models/evaluation.model.js';

export const handleAIChat = async (req, res) => {
  const { prompt, model } = req.body;
  const userId = req.session?.user?.id || req.user?.id || null;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const startTime = Date.now();

  try {
    // 1. Classical ML Intent classification routing
    const classification = await classifyIntent(prompt);
    const intent = classification?.intent || 'general_chat';
    const confidence = classification?.confidence || 0.0;

    logger.info(`ML routing classified intent as: ${intent} (${confidence})`);

    // 2. Check and execute plugins (IoT / Home / System Automation)
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
      await evaluation.save();

      return res.status(200).json({
        success: true,
        response: pluginResult.message,
        intent: intent
      });
    }

    // 3. Retrieval-Augmented Generation (RAG) Memory Retrieval
    const ragContext = await buildRAGContext(prompt, userId);
    
    // 4. Enrich prompt with memory context
    const enrichedPrompt = `${ragContext}User prompt: ${prompt}`;

    // 5. Query active AI model (e.g., Ollama or OpenAI)
    const aiResponse = await queryAI(enrichedPrompt, model);
    const latency = Date.now() - startTime;

    // 6. Save structured & semantic memories (MongoDB & Pinecone)
    await storeInteraction('user', prompt, userId, 'episodic');
    await storeInteraction('assistant', aiResponse, userId, 'episodic');

    // 7. Save AI Performance Evaluation log
    const evaluation = new Evaluation({
      modelUsed: model || 'qwen2.5:1.5b',
      promptLength: prompt.length,
      responseLength: aiResponse.length,
      latencyMs: latency,
      memoryHitsCount: ragContext ? 1 : 0,
      successRate: 1
    });
    await evaluation.save();

    res.status(200).json({
      success: true,
      response: aiResponse,
      intent: intent
    });
  } catch (error) {
    logger.error(`AI Controller Error: ${error.message}`);
    const latency = Date.now() - startTime;
    
    // Log failure evaluation
    try {
      const evaluation = new Evaluation({
        modelUsed: model || 'qwen2.5:1.5b',
        promptLength: prompt.length,
        responseLength: 0,
        latencyMs: latency,
        memoryHitsCount: 0,
        successRate: 0
      });
      await evaluation.save();
    } catch (logErr) {
      logger.error(`Failed to write evaluation error log: ${logErr.message}`);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Error occurred during AI processing.'
    });
  }
};
