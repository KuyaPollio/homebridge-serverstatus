import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { ServerStatusPlatform } from './platform';
import { ServerConfig } from './settings';
import * as ping from 'ping';

/**
 * Server Status Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class ServerStatusAccessory {
  private service: Service;
  private currentStatus = false;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly platform: ServerStatusPlatform,
    private readonly accessory: PlatformAccessory,
    private readonly serverConfig: ServerConfig,
  ) {
    // Set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Server Status Plugin')
      .setCharacteristic(this.platform.Characteristic.Model, 'Server Monitor')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.generateSerialNumber());

    // Get or create the MotionSensor service
    // Using MotionSensor as it provides a simple on/off status that can trigger automations
    this.service = this.accessory.getService(this.platform.Service.MotionSensor) || 
                   this.accessory.addService(this.platform.Service.MotionSensor);

    // Set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.serverConfig.name);

    // Register handlers for the MotionDetected characteristic
    this.service.getCharacteristic(this.platform.Characteristic.MotionDetected)
      .onGet(this.getMotionDetected.bind(this));

    // Start monitoring the server
    this.startMonitoring();
  }

  /**
   * Handle requests to get the current value of the "Motion Detected" characteristic
   * In our case, motion detected = server is up
   */
  async getMotionDetected(): Promise<CharacteristicValue> {
    const isUp = await this.pingServer();
    this.platform.log.debug(`[${this.serverConfig.name}] Status:`, isUp ? 'UP' : 'DOWN');
    return isUp;
  }

  /**
   * Ping the server to check if it's up
   */
  private async pingServer(): Promise<boolean> {
    try {
      const timeout = this.serverConfig.timeout || this.platform.config.defaultTimeout || 5000;
      
      // Extract hostname from URL if needed
      let host = this.serverConfig.url;
      if (host.startsWith('http://') || host.startsWith('https://')) {
        const url = new URL(host);
        host = url.hostname;
      }

      const result = await ping.promise.probe(host, {
        timeout: timeout / 1000, // ping library expects seconds
        min_reply: 1,
      });

      return result.alive;
    } catch (error) {
      this.platform.log.error(`[${this.serverConfig.name}] Ping error:`, error);
      return false;
    }
  }

  /**
   * Start periodic monitoring of the server
   */
  private startMonitoring() {
    const interval = this.serverConfig.interval || this.platform.config.defaultInterval || 60000; // Default 1 minute

    // Initial check
    this.checkServerStatus();

    // Set up periodic checking
    this.pingInterval = setInterval(() => {
      this.checkServerStatus();
    }, interval);

    this.platform.log.info(`[${this.serverConfig.name}] Started monitoring with ${interval}ms interval`);
  }

  /**
   * Check server status and update HomeKit if status changed
   */
  private async checkServerStatus() {
    try {
      const isUp = await this.pingServer();
      
      if (isUp !== this.currentStatus) {
        this.currentStatus = isUp;
        
        // Update the characteristic value
        this.service.updateCharacteristic(this.platform.Characteristic.MotionDetected, isUp);
        
        this.platform.log.info(`[${this.serverConfig.name}] Status changed: ${isUp ? 'UP' : 'DOWN'}`);
      }
    } catch (error) {
      this.platform.log.error(`[${this.serverConfig.name}] Error checking status:`, error);
      
      // If there's an error, consider the server down
      if (this.currentStatus !== false) {
        this.currentStatus = false;
        this.service.updateCharacteristic(this.platform.Characteristic.MotionDetected, false);
        this.platform.log.info(`[${this.serverConfig.name}] Status changed: DOWN (due to error)`);
      }
    }
  }

  /**
   * Generate a serial number for the accessory
   */
  private generateSerialNumber(): string {
    return Buffer.from(this.serverConfig.name + this.serverConfig.url).toString('base64').slice(0, 10);
  }

  /**
   * Cleanup method to stop monitoring when accessory is removed
   */
  public destroy() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.platform.log.info(`[${this.serverConfig.name}] Stopped monitoring`);
  }
} 