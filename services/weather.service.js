import axios from 'axios';
import { logger } from '../config/db.config.js';

let cachedWeather = null;
let lastWeatherFetch = 0;
const WEATHER_CACHE_DURATION = 900 * 1000; // 15 minutes in milliseconds

const WMO_EMOJI_MAP = {
  "113": "☀️",  // Sunny/Clear
  "116": "🌤️",  // Partly Cloudy
  "119": "☁️",  // Cloudy
  "122": "☁️",  // Overcast
  "143": "🌫️",  // Mist
  "176": "🌧️",  // Patchy rain nearby
  "179": "🌨️",  // Patchy snow nearby
  "182": "🌨️",  // Patchy sleet nearby
  "185": "🌨️",  // Patchy freezing drizzle nearby
  "200": "⛈️",  // Thundery outbreaks nearby
  "227": "❄️",  // Blowing snow
  "230": "❄️",  // Blizzard
  "248": "🌫️",  // Fog
  "260": "🌫️",  // Freezing fog
  "263": "🌧️",  // Patchy light drizzle
  "266": "🌧️",  // Light drizzle
  "281": "🌧️",  // Freezing drizzle
  "284": "🌧️",  // Heavy freezing drizzle
  "293": "🌧️",  // Patchy light rain
  "296": "🌧️",  // Light rain
  "299": "🌧️",  // Moderate rain at times
  "302": "🌧️",  // Moderate rain
  "305": "🌧️",  // Heavy rain at times
  "308": "🌧️",  // Heavy rain
  "311": "🌧️",  // Light freezing rain
  "314": "🌧️",  // Moderate or heavy freezing rain
  "317": "🌨️",  // Light sleet
  "320": "🌨️",  // Moderate or heavy sleet
  "323": "❄️",  // Patchy light snow
  "326": "❄️",  // Light snow
  "329": "❄️",  // Patchy moderate snow
  "332": "❄️",  // Moderate snow
  "335": "❄️",  // Patchy heavy snow
  "338": "❄️",  // Heavy snow
  "350": "🌨️",  // Ice pellets
  "353": "🌧️",  // Light rain shower
  "356": "🌧️",  // Moderate or heavy rain shower
  "359": "🌧️",  // Torrential rain shower
  "362": "🌨️",  // Light sleet showers
  "365": "🌨️",  // Moderate or heavy sleet showers
  "368": "❄️",  // Light snow showers
  "371": "❄️",  // Moderate or heavy snow showers
  "374": "🌨️",  // Light showers of ice pellets
  "377": "🌨️",  // Moderate or heavy showers of ice pellets
  "386": "⛈️",  // Patchy light rain in thunder
  "389": "⛈️",  // Moderate or heavy rain in thunder
  "392": "❄️",  // Patchy light snow in thunder
  "395": "❄️",  // Moderate or heavy snow in thunder
};

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
    const weatherCode = cond.weatherCode;

    const emoji = WMO_EMOJI_MAP[weatherCode] || "🌤️";

    const result = {
      success: true,
      city: cityName,
      temp: `${tempC}°C`,
      condition: weatherDesc,
      emoji: emoji,
      source: 'live'
    };

    cachedWeather = result;
    lastWeatherFetch = now;
    return result;
  } catch (error) {
    logger.error(`Weather fetch error: ${error.message}`);
    if (cachedWeather) {
      return cachedWeather;
    }
    // Fallback data
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
