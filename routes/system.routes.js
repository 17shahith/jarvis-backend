import express from 'express';
import { getDiagnostics, launchApp, getHostingStatus } from '../controllers/system.controller.js';

const router = express.Router();

router.get('/diagnostics', getDiagnostics);
router.get('/hosting', getHostingStatus);
router.post('/launch', launchApp);

export default router;
