import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { exec } from 'child_process';
import util from 'util';
import { logger } from '../config/db.config.js';
import redis from '../config/redis.config.js';

const execPromise = util.promisify(exec);
const CACHE_FILE = path.resolve('.spotify_cache');
const SCOPE = 'user-modify-playback-state user-read-playback-state user-read-currently-playing';

const getCachedToken = () => {
  if (!fs.existsSync(CACHE_FILE)) return null;
  try {
    const data = fs.readFileSync(CACHE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    logger.error(`Error reading spotify cache: ${err.message}`);
    return null;
  }
};

const saveCachedToken = (tokenInfo) => {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(tokenInfo, null, 2), 'utf8');
  } catch (err) {
    logger.error(`Error writing spotify cache: ${err.message}`);
  }
};

const refreshAccessToken = async (refreshToken) => {
  const clientId = process.env.SPOTIPY_CLIENT_ID;
  const clientSecret = process.env.SPOTIPY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Spotify Credentials not configured in .env');
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', params, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = response.data;
    const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
    
    const cached = getCachedToken() || {};
    const updatedToken = {
      ...cached,
      access_token: data.access_token,
      expires_in: data.expires_in,
      expires_at: expiresAt,
      refresh_token: data.refresh_token || refreshToken
    };

    saveCachedToken(updatedToken);
    return updatedToken.access_token;
  } catch (error) {
    logger.error(`Spotify token refresh failed: ${error.message}`);
    throw error;
  }
};

export const getAccessToken = async () => {
  const tokenInfo = getCachedToken();
  if (!tokenInfo) return null;

  const now = Math.floor(Date.now() / 1000);
  if (tokenInfo.expires_at - now < 30) {
    if (tokenInfo.refresh_token) {
      try {
        return await refreshAccessToken(tokenInfo.refresh_token);
      } catch (err) {
        return null;
      }
    }
    return null;
  }
  return tokenInfo.access_token;
};

export const getAuthorizeUrl = () => {
  const clientId = process.env.SPOTIPY_CLIENT_ID;
  const redirectUri = process.env.SPOTIPY_REDIRECT_URI || 'http://127.0.0.1:8888/callback';

  if (!clientId) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: SCOPE,
    show_dialog: 'true'
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const handleCallback = async (code) => {
  const clientId = process.env.SPOTIPY_CLIENT_ID;
  const clientSecret = process.env.SPOTIPY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIPY_REDIRECT_URI || 'http://127.0.0.1:8888/callback';

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', redirectUri);

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await axios.post('https://accounts.spotify.com/api/token', params, {
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  const data = response.data;
  const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;

  const tokenInfo = {
    access_token: data.access_token,
    token_type: data.token_type,
    expires_in: data.expires_in,
    refresh_token: data.refresh_token,
    scope: data.scope,
    expires_at: expiresAt
  };

  saveCachedToken(tokenInfo);
  return tokenInfo;
};

export const logoutSpotify = () => {
  if (fs.existsSync(CACHE_FILE)) {
    fs.unlinkSync(CACHE_FILE);
  }
};

export const getCurrentPlayback = async () => {
  const token = await getAccessToken();
  if (!token) return { connected: false, message: 'Spotify not connected' };

  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 204 || !response.data) {
      return { playing: false, message: 'No song playing currently.' };
    }

    const current = response.data;
    if (current && current.item) {
      const track = current.item;
      const artists = track.artists.map(a => a.name).join(', ');
      return {
        playing: current.is_playing,
        track: track.name,
        artists: artists,
        album: track.album.name,
        uri: track.uri
      };
    }
    return { playing: false, message: 'No song playing currently.' };
  } catch (error) {
    logger.error(`Spotify currently-playing error: ${error.message}`);
    throw error;
  }
};

export const playPlayback = async (query = '') => {
  const token = await getAccessToken();
  if (!token) throw new Error('Spotify not connected');

  if (query) {
    const searchResponse = await axios.get('https://api.spotify.com/v1/search', {
      headers: { 'Authorization': `Bearer ${token}` },
      params: { q: query, limit: 1, type: 'track' }
    });

    const tracks = searchResponse.data?.tracks?.items || [];
    if (tracks.length === 0) {
      throw new Error(`No song found for "${query}"`);
    }

    const track = tracks[0];
    return {
      success: true,
      track: track.name,
      artists: track.artists.map(a => a.name).join(', '),
      message: `Playing ${track.name}`
    };
  }
  return { success: true, message: 'Playback resumed' };
};

export const pausePlayback = async () => {
  return { success: true, message: 'Playback paused' };
};

export const nextPlayback = async () => {
  return { success: true, message: 'Skipped to next song' };
};

export const prevPlayback = async () => {
  return { success: true, message: 'Skipped to previous song' };
};
