import { fetchWeather } from '../services/weather.service.js';
import { logger } from '../config/db.config.js';

export const getWeather = async (req, res) => {
  try {
    const weatherData = await fetchWeather();
    res.status(200).json(weatherData);
  } catch (error) {
    logger.error(`Weather controller failed: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to retrieve weather data.' });
  }
};
