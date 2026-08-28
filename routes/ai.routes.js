import express from 'express';
import { handleAIChat } from '../controllers/ai.controller.js';

const router = express.Router();

router.post('/chat', handleAIChat);

export default router;
