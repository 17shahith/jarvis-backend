import axios from 'axios';
import { logger } from '../config/db.config.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const queryAI = async (prompt, modelName = null, options = {}) => {
  const groqKey = process.env.GROQ_API_KEY;
  const groqModel = modelName || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  if (!groqKey) {
    logger.error('GROQ_API_KEY is not set.');
    return '';
  }

  try {
    const response = await axios.post(GROQ_API_URL, {
      model: groqModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024
    }, {
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });

    return response.data?.choices[0]?.message?.content || '';
  } catch (error) {
    logger.error(`Groq query failed: ${error.message}`);
    return '';
  }
};
