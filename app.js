import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routers
import authRoutes from './routes/auth.routes.js';
import aiRoutes from './routes/ai.routes.js';
import weatherRoutes from './routes/weather.routes.js';
import spotifyRoutes from './routes/spotify.routes.js';
import systemRoutes from './routes/system.routes.js';
import visionRoutes from './routes/vision.routes.js';

// Import callback controller directly for Spotify compatibility redirect
import { callback as spotifyCallback } from './controllers/spotify.controller.js';
import { launchApp as launchSystemApp } from './controllers/system.controller.js';

// Middlewares
import { errorHandler } from './middleware/error.middleware.js';
import { requireAuth } from './middleware/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic security and compression
app.use(helmet({
  contentSecurityPolicy: false, // Turn off CSP for development/iframe support
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Standard logger
app.use(morgan('dev'));

// Session support
app.use(session({
  secret: process.env.SESSION_SECRET || 'jarvis_neural_session_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static frontend files
const frontendPath = path.resolve(__dirname, '../frontend');
app.use(express.static(frontendPath, { index: false }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/system', requireAuth, systemRoutes);
app.use('/api/vision', requireAuth, visionRoutes);

app.post('/api/launch/whatsapp', (req, res, next) => {
  req.body = { ...(req.body || {}), appName: 'whatsapp' };
  return launchSystemApp(req, res, next);
});

// Direct Spotify compatibility Callback Route (Required for SPOTIPY_REDIRECT_URI compatibility)
app.get('/callback', spotifyCallback);

// Navigation redirects for the legacy static frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});
app.get('/login', (req, res) => res.redirect('/'));
app.get('/dashboard', (req, res) => res.redirect('/'));

// Global Error Handler
app.use(errorHandler);

export default app;
