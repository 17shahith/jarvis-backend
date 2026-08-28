import express from 'express';
import * as spotifyController from '../controllers/spotify.controller.js';

const router = express.Router();

router.get('/status', spotifyController.getStatus);
router.get('/login', spotifyController.login);
router.get('/current', spotifyController.current);
router.post('/logout', spotifyController.logout);
router.post('/play', spotifyController.play);
router.post('/pause', spotifyController.pause);
router.post('/next', spotifyController.next);
router.post('/prev', spotifyController.prev);

export default router;
