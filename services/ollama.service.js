import axios from 'axios';
import { logger } from '../config/db.config.js';

export const queryOllamaAPI = async (prompt, modelName = null) => {
  const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
  const defaultModel = process.env.QWEN_MODEL || 'qwen2.5:1.5b';
  const model = modelName || defaultModel;

  try {
    const response = await axios.post(`${host}/api/generate`, {
      model: model,
      prompt: prompt,
      stream: false
    }, {
      timeout: 30000 // 30 seconds timeout
    });

    return response.data?.response || '';
  } catch (error) {
    logger.error(`Ollama integration error: ${error.message}`);
    throw new Error('Sir, I am unable to connect to the Ollama neural network. Please ensure the local server is running.');
  }
};

export const listOllamaModels = async () => {
  const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
  try {
    const response = await axios.get(`${host}/api/tags`, { timeout: 3000 });
    return response.data?.models || [];
  } catch (error) {
    logger.error(`Ollama listing models failed: ${error.message}`);
    return [];
  }
};
