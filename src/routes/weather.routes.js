import express from 'express';
import { getWeather } from '../controllers/weather.controller.js';

const router = express.Router();

router.get('/', getWeather);
router.get('/current', getWeather);

export default router;
