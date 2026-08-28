import { logger } from '../config/db.config.js';

class PluginManager {
  constructor() {
    this.plugins = new Map();
  }

  /**
   * Registers a new plugin capability
   */
  registerPlugin(name, plugin) {
    if (!plugin.trigger || typeof plugin.execute !== 'function') {
      logger.error(`Failed to register invalid plugin: ${name}`);
      return false;
    }
    this.plugins.set(name, plugin);
    logger.info(`Successfully loaded capabilities plugin: "${name}"`);
    return true;
  }

  /**
   * Evaluates text command against all registered plugins
   */
  async executePlugin(intent, rawText, user = null) {
    for (const [name, plugin] of this.plugins.entries()) {
      const matchIntent = plugin.trigger.intents?.includes(intent);
      const matchKeyword = plugin.trigger.keywords?.some(kw => rawText.toLowerCase().includes(kw));

      if (matchIntent || matchKeyword) {
        logger.info(`Routing action to plugin: "${name}"`);
        try {
          return await plugin.execute(rawText, user);
        } catch (error) {
          logger.error(`Error executing plugin "${name}": ${error.message}`);
          return { success: false, message: `Sir, the ${name} plugin encountered an error.` };
        }
      }
    }
    return null; // No matching plugin
  }
}

const manager = new PluginManager();

// ─── Preset Template 1: Home Automation / IoT Plugin ───
manager.registerPlugin('HomeAutomation', {
  trigger: {
    intents: ['home_control'],
    keywords: ['turn on light', 'turn off light', 'ac temperature', 'smart lock', 'garage']
  },
  execute: async (text) => {
    // Simulated IoT controller commands
    const val = text.toLowerCase();
    let device = 'device';
    let action = 'modulated';

    if (val.includes('light')) device = 'Lights';
    else if (val.includes('ac')) device = 'AC';
    else if (val.includes('lock') || val.includes('door')) device = 'Smart Lock';

    if (val.includes('on')) action = 'activated';
    else if (val.includes('off')) action = 'deactivated';

    return {
      success: true,
      message: `Sir, I have ${action} the home ${device} per your instructions.`,
      speechText: `Sir, I have ${action} the home ${device} per your instructions.`
    };
  }
});

// ─── Preset Template 2: Custom Systems Control ───
manager.registerPlugin('SysAutomation', {
  trigger: {
    intents: ['system_control'],
    keywords: ['clean logs', 'optimize database', 'backup memory']
  },
  execute: async (text) => {
    return {
      success: true,
      message: `Sir, system diagnostics tasks optimization has completed successfully. Uptime looks excellent.`,
      speechText: `Sir, system diagnostics tasks optimization has completed successfully. Uptime looks excellent.`
    };
  }
});

export default manager;
