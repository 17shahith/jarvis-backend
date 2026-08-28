import { spawn } from 'child_process';
import path from 'path';
import { logger } from '../config/db.config.js';

// Resolve virtualenv Python path depending on platform
const getPythonPath = () => {
  const isWindows = process.platform === 'win32';
  return isWindows 
    ? path.resolve('.venv', 'Scripts', 'python.exe')
    : path.resolve('.venv', 'bin', 'python');
};

const getScriptPath = () => {
  return path.resolve('backend', 'python', 'classifier.py');
};

/**
 * Invokes python DecisionTreeClassifier routing model
 */
export const classifyIntent = (text) => {
  return new Promise((resolve) => {
    const pythonPath = getPythonPath();
    const scriptPath = getScriptPath();
    
    logger.info(`Running classical ML classification for: "${text.substring(0, 30)}..."`);

    const py = spawn(pythonPath, [scriptPath, '--predict', text]);

    let dataBuffer = '';
    let errorBuffer = '';

    py.stdout.on('data', (data) => {
      dataBuffer += data.toString();
    });

    py.stderr.on('data', (data) => {
      errorBuffer += data.toString();
    });

    py.on('close', (code) => {
      if (code !== 0) {
        logger.error(`ML script exited with code ${code}. Error: ${errorBuffer.trim()}`);
        return resolve(fallbackRegexClassifier(text));
      }

      try {
        const result = JSON.parse(dataBuffer.trim());
        resolve(result);
      } catch (err) {
        logger.error(`Failed to parse ML output: ${err.message}. Raw: ${dataBuffer}`);
        resolve(fallbackRegexClassifier(text));
      }
    });
  });
};

/**
 * Safe Regex TF-IDF style fallback if Python is offline
 */
const fallbackRegexClassifier = (rawText) => {
  const text = rawText.toLowerCase().trim();
  
  if (text.includes('play') || text.includes('music') || text.includes('spotify') || 
      text.includes('pause') || text.includes('resume') || text.includes('skip') || text.includes('track')) {
    return { intent: 'play_music', confidence: 0.95 };
  }
  
  if (text.includes('weather') || text.includes('temp') || text.includes('forecast') || 
      text.includes('rain') || text.includes('sunny')) {
    return { intent: 'get_weather', confidence: 0.95 };
  }
  
  if (text.includes('open') || text.includes('launch') || text.includes('whatsapp') || 
      text.includes('youtube') || text.includes('gmail') || text.includes('instagram')) {
    return { intent: 'open_app', confidence: 0.95 };
  }

  if (text.includes('shut down') || text.includes('shutdown') || text.includes('goodbye') || text.includes('bye')) {
    return { intent: 'shutdown', confidence: 0.99 };
  }

  return { intent: 'general_chat', confidence: 0.8 };
};
