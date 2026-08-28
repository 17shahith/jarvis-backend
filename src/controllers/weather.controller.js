import { fetchWeather } from '../services/weather.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const getWeather = async (req, res, next) => {
  try {
    const weatherData = await fetchWeather();
    return ApiResponse.success(res, 'Weather data retrieved', weatherData);
  } catch (error) {
    next(error);
  }
};
