import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { exec } from 'child_process';
import util from 'util';
import { logger } from '../config/db.config.js';
import redis from '../config/redis.js';

const execPromise = util.promisify(exec);

const CACHE_FILE = path.resolve('.spotify_cache');
const SCOPE = 'user-modify-playback-state user-read-playback-state user-read-currently-playing';

// Helper to load token from cache
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

// Helper to save token to cache
const saveCachedToken = (tokenInfo) => {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(tokenInfo, null, 2), 'utf8');
  } catch (err) {
    logger.error(`Error writing spotify cache: ${err.message}`);
  }
};

// Refresh the access token
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
      // Fallback to old refresh token if not returned
      refresh_token: data.refresh_token || refreshToken
    };

    saveCachedToken(updatedToken);
    return updatedToken.access_token;
  } catch (error) {
    logger.error(`Spotify token refresh failed: ${error.response?.data ? JSON.stringify(error.response.data) : error.message}`);
    throw error;
  }
};

// Get valid access token
export const getAccessToken = async () => {
  const tokenInfo = getCachedToken();
  if (!tokenInfo) return null;

  const now = Math.floor(Date.now() / 1000);
  // If expired or expiring in less than 30 seconds
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

// Generate Authorize URL
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

// Exchange auth code for tokens
export const handleCallback = async (code) => {
  const clientId = process.env.SPOTIPY_CLIENT_ID;
  const clientSecret = process.env.SPOTIPY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIPY_REDIRECT_URI || 'http://127.0.0.1:8888/callback';

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', redirectUri);

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  let response;
  try {
    response = await axios.post('https://accounts.spotify.com/api/token', params, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(`Spotify API Error: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }

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

// Logout (Clear Cache)
export const logoutSpotify = () => {
  if (fs.existsSync(CACHE_FILE)) {
    fs.unlinkSync(CACHE_FILE);
  }
};

// Get current playback status
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

// Helper to get active or available devices
const getDevices = async (token) => {
  const response = await axios.get('https://api.spotify.com/v1/me/player/devices', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data?.devices || [];
};

const ensureDesktopSpotifyRunning = async () => {
  try {
    const { stdout } = await execPromise('tasklist /FI "IMAGENAME eq Spotify.exe"');
    if (!stdout.includes('Spotify.exe')) {
      logger.info('Spotify Desktop not running. Attempting to launch...');
      try {
        await execPromise('start spotify:');
        await new Promise(res => setTimeout(res, 4000)); // wait for spin up
      } catch (err) {
        throw new Error('Spotify Desktop does not appear to be installed on this Windows machine.');
      }
    }
  } catch (e) {
    if (e.message.includes('installed')) throw e;
    logger.error(`Error checking Spotify process: ${e.message}`);
  }
};

const ensureDesktopDevice = async (token) => {
  await ensureDesktopSpotifyRunning();
  
  let targetDevice = null;
  const cachedId = await redis.get('jarvis:spotify:desktop_device_id');
  let devices = await getDevices(token);
  
  // Try to find the desktop app device
  const findDesktop = (devs) => devs.find(d => d.type === 'Computer' && !d.name.toLowerCase().includes('web player'));
  targetDevice = findDesktop(devices);

  // If not found, poll for up to 5 seconds
  if (!targetDevice) {
    for (let i = 0; i < 5; i++) {
      await new Promise(res => setTimeout(res, 1000));
      devices = await getDevices(token);
      targetDevice = findDesktop(devices);
      if (targetDevice) break;
    }
  }

  if (!targetDevice) {
    throw new Error('Spotify Desktop device not found. Please ensure the native app is logged in.');
  }

  // If it's not active, transfer playback to it
  if (!targetDevice.is_active) {
    await axios.put('https://api.spotify.com/v1/me/player', {
      device_ids: [targetDevice.id],
      play: false
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    await new Promise(res => setTimeout(res, 500));
  }

  await redis.set('jarvis:spotify:desktop_device_id', targetDevice.id);
  return targetDevice.id;
};

// Play or Search & Play
export const playPlayback = async (query = '') => {
  const token = await getAccessToken();
  if (!token) throw new Error('Spotify not connected');

  const activeDevice = await ensureDesktopDevice(token);

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
    const trackUri = track.uri;
    const albumContext = track.album.uri;
    const artists = track.artists.map(a => a.name).join(', ');

    // Start playback
    await axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${activeDevice}`, {
      context_uri: albumContext,
      offset: { uri: trackUri }
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return {
      success: true,
      track: track.name,
      artists: artists,
      message: `Playing ${track.name} by ${artists}`
    };
  } else {
    // Resume
    await axios.put(`https://api.spotify.com/v1/me/player/play?device_id=${activeDevice}`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return { success: true, message: 'Playback resumed' };
  }
};

// Pause playback
export const pausePlayback = async () => {
  const token = await getAccessToken();
  if (!token) throw new Error('Spotify not connected');

  const activeDevice = await ensureDesktopDevice(token);

  await axios.put(`https://api.spotify.com/v1/me/player/pause?device_id=${activeDevice}`, {}, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return { success: true, message: 'Playback paused' };
};

// Skip to Next
export const nextPlayback = async () => {
  const token = await getAccessToken();
  if (!token) throw new Error('Spotify not connected');

  const activeDevice = await ensureDesktopDevice(token);

  await axios.post(`https://api.spotify.com/v1/me/player/next?device_id=${activeDevice}`, {}, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return { success: true, message: 'Skipped to next song' };
};

// Skip to Previous
export const prevPlayback = async () => {
  const token = await getAccessToken();
  if (!token) throw new Error('Spotify not connected');

  const activeDevice = await ensureDesktopDevice(token);

  await axios.post(`https://api.spotify.com/v1/me/player/previous?device_id=${activeDevice}`, {}, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return { success: true, message: 'Skipped to previous song' };
};

// Get User Profile Info (to check connections)
export const getProfile = async () => {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const response = await axios.get('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    logger.error(`Spotify profile retrieval error: ${error.message}`);
    return null;
  }
};
