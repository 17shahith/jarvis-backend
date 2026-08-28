import * as spotifyService from '../services/spotify.service.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const getStatus = async (req, res, next) => {
  try {
    const profile = await spotifyService.getProfile();
    if (profile) {
      return ApiResponse.success(res, 'Connected to Spotify API', {
        connected: true,
        authenticated: true,
        user: profile.display_name || profile.id
      });
    }
    return ApiResponse.success(res, 'Spotify not connected', { connected: false, authenticated: false });
  } catch (error) {
    next(error);
  }
};

export const login = (req, res) => {
  const url = spotifyService.getAuthorizeUrl();
  if (url) {
    res.redirect(url);
  } else {
    return ApiResponse.error(res, 'Spotify Client ID missing in configuration', [], 400);
  }
};

export const callback = async (req, res, next) => {
  const { code } = req.query;
  if (!code) {
    return ApiResponse.error(res, 'Spotify auth code missing', [], 400);
  }

  try {
    await spotifyService.handleCallback(code);
    res.redirect('/');
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  spotifyService.logoutSpotify();
  return ApiResponse.success(res, 'Spotify disconnected successfully');
};

export const current = async (req, res, next) => {
  try {
    const data = await spotifyService.getCurrentPlayback();
    return ApiResponse.success(res, 'Current playback retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const play = async (req, res, next) => {
  const { query } = req.body || {};
  try {
    const data = await spotifyService.playPlayback(query);
    return ApiResponse.success(res, data.message || 'Playback started', data);
  } catch (error) {
    next(error);
  }
};

export const pause = async (req, res, next) => {
  try {
    const data = await spotifyService.pausePlayback();
    return ApiResponse.success(res, 'Playback paused', data);
  } catch (error) {
    next(error);
  }
};

export const next = async (req, res, next) => {
  try {
    const data = await spotifyService.nextPlayback();
    return ApiResponse.success(res, 'Skipped to next song', data);
  } catch (error) {
    next(error);
  }
};

export const prev = async (req, res, next) => {
  try {
    const data = await spotifyService.prevPlayback();
    return ApiResponse.success(res, 'Skipped to previous song', data);
  } catch (error) {
    next(error);
  }
};
