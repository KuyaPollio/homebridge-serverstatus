import { API } from 'homebridge';
import { ServerStatusPlatform } from './platform';
import { PLATFORM_NAME } from './settings';

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, ServerStatusPlatform);
}; 