import express from 'express';
import { getAIStatus, handleAIChat } from '../controllers/ai.controller.js';

const router = express.Router();

router.get('/status', getAIStatus);
router.post('/chat', handleAIChat);

export default router;
