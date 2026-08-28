import { exec, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { logger } from '../config/db.config.js';

export const launchWhatsApp = async () => {
  return new Promise((resolve, reject) => {
    // 1. Try WhatsApp URI Protocol
    exec('start whatsapp:', (error) => {
      if (!error) {
        logger.info('WhatsApp Desktop launched via URI protocol.');
        return resolve({ success: true, message: 'WhatsApp Desktop launched' });
      }

      // 2. Fallback to common executable installation paths on Windows
      const localAppData = process.env.LOCALAPPDATA || '';
      const programFiles = process.env.PROGRAMFILES || '';
      
      const paths = [
        path.join(localAppData, 'WhatsApp', 'WhatsApp.exe'),
        path.join(localAppData, 'Programs', 'whatsapp-desktop', 'WhatsApp.exe'),
        path.join(programFiles, 'WhatsApp', 'WhatsApp.exe'),
      ];

      for (const p of paths) {
        if (fs.existsSync(p)) {
          try {
            spawn(p, [], { detached: true, stdio: 'ignore' }).unref();
            logger.info(`WhatsApp Desktop launched via path: ${p}`);
            return resolve({ success: true, message: 'WhatsApp Desktop launched' });
          } catch (spawnError) {
            logger.error(`Failed to launch WhatsApp at ${p}: ${spawnError.message}`);
          }
        }
      }

      logger.warn('WhatsApp Desktop executable not found on host machine.');
      reject(new Error('WhatsApp Desktop not found. Please install it from the Microsoft Store.'));
    });
  });
};
