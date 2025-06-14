/**
 * This is the name of the platform that users will use to register the plugin in the Homebridge config.json
 */
export const PLATFORM_NAME = 'ServerStatusPlatform';

/**
 * This must match the name of your plugin as defined in package.json
 */
export const PLUGIN_NAME = 'homebridge-serverstatus';

/**
 * Configuration interface for individual servers
 */
export interface ServerConfig {
  name: string;
  url: string;
  method?: 'ping' | 'http';
  timeout?: number;
  interval?: number;
  ignoreSslErrors?: boolean;
}

/**
 * Main platform configuration interface
 */
export interface ServerStatusPlatformConfig {
  platform: string;
  name?: string;
  servers: ServerConfig[];
  defaultMethod?: 'ping' | 'http';
  defaultTimeout?: number;
  defaultInterval?: number;
  defaultIgnoreSslErrors?: boolean;
} 