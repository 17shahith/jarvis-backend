import express from 'express';
import { analyzeVision } from '../controllers/vision.controller.js';

const router = express.Router();

router.get('/analyze', analyzeVision);

export default router;
