import * as spotifyService from '../services/spotify.service.js';
import { logger } from '../config/db.config.js';

export const getStatus = async (req, res) => {
  try {
    const profile = await spotifyService.getProfile();
    if (profile) {
      res.status(200).json({
        connected: true,
        user: profile.display_name || profile.id,
        message: 'Connected to Spotify API'
      });
    } else {
      res.status(200).json({ connected: false, message: 'Not authorized. Please connect Spotify.' });
    }
  } catch (error) {
    logger.error(`Spotify status controller error: ${error.message}`);
    res.status(200).json({ connected: false, message: 'Error checking connection.' });
  }
};

export const login = (req, res) => {
  const url = spotifyService.getAuthorizeUrl();
  if (url) {
    res.redirect(url);
  } else {
    res.status(400).send('Spotify Client ID must be configured in your .env file.');
  }
};

export const callback = async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send('Spotify auth code missing.');
  }

  try {
    await spotifyService.handleCallback(code);
    // Redirect back to dashboard. We'll host our dashboard at /dashboard.html
    res.redirect('/dashboard.html');
  } catch (error) {
    logger.error(`Spotify callback controller error: ${error.message}`);
    res.status(400).send(`Authentication failed: ${error.message}`);
  }
};

export const logout = (req, res) => {
  try {
    spotifyService.logoutSpotify();
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error(`Spotify logout error: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const current = async (req, res) => {
  try {
    const data = await spotifyService.getCurrentPlayback();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const play = async (req, res) => {
  const { query } = req.body || {};
  try {
    const data = await spotifyService.playPlayback(query);
    res.status(200).json(data);
  } catch (error) {
    const status = error.message.includes('Premium') ? 403 : 500;
    res.status(status).json({ error: error.message });
  }
};

export const pause = async (req, res) => {
  try {
    const data = await spotifyService.pausePlayback();
    res.status(200).json(data);
  } catch (error) {
    const status = error.message.includes('Premium') ? 403 : 500;
    res.status(status).json({ error: error.message });
  }
};

export const next = async (req, res) => {
  try {
    const data = await spotifyService.nextPlayback();
    res.status(200).json(data);
  } catch (error) {
    const status = error.message.includes('Premium') ? 403 : 500;
    res.status(status).json({ error: error.message });
  }
};

export const prev = async (req, res) => {
  try {
    const data = await spotifyService.prevPlayback();
    res.status(200).json(data);
  } catch (error) {
    const status = error.message.includes('Premium') ? 403 : 500;
    res.status(status).json({ error: error.message });
  }
};
