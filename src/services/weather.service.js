import axios from 'axios';
import { logger } from '../config/db.config.js';

let cachedWeather = null;
let lastWeatherFetch = 0;
const WEATHER_CACHE_DURATION = 900 * 1000;

export const fetchWeather = async () => {
  const now = Date.now();
  if (cachedWeather && (now - lastWeatherFetch < WEATHER_CACHE_DURATION)) {
    return cachedWeather;
  }

  const city = process.env.WEATHER_CITY || 'Delhi';
  const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;

  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 5000
    });

    const data = response.data;
    const cond = data.current_condition[0];
    const area = data.nearest_area[0];
    const cityName = area.areaName[0].value;
    const tempC = cond.temp_C;
    const weatherDesc = cond.weatherDesc[0].value;

    const result = {
      success: true,
      city: cityName,
      temp: `${tempC}°C`,
      condition: weatherDesc,
      emoji: '🌤️',
      source: 'live'
    };

    cachedWeather = result;
    lastWeatherFetch = now;
    return result;
  } catch (error) {
    logger.warn(`Weather fetch error: ${error.message}`);
    return {
      success: true,
      city: city,
      temp: '24°C',
      condition: 'Mostly Cloudy',
      emoji: '🌤️',
      source: 'fallback'
    };
  }
};
