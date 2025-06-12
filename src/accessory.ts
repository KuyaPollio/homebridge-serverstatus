import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { ServerStatusPlatform } from './platform';
import { ServerConfig } from './settings';
import * as ping from 'ping';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

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

    // Get or create the ContactSensor service
    // Using ContactSensor as it provides open/closed status perfect for server connectivity
    this.service = this.accessory.getService(this.platform.Service.ContactSensor) || 
                   this.accessory.addService(this.platform.Service.ContactSensor);

    // Set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.serverConfig.name);

    // Register handlers for the ContactSensorState characteristic
    this.service.getCharacteristic(this.platform.Characteristic.ContactSensorState)
      .onGet(this.getContactSensorState.bind(this));

    // Start monitoring the server
    this.startMonitoring();
  }

  /**
   * Handle requests to get the current value of the "Contact Sensor State" characteristic
   * CONTACT_DETECTED (0) = server is up (connected)
   * CONTACT_NOT_DETECTED (1) = server is down (disconnected)
   */
  async getContactSensorState(): Promise<CharacteristicValue> {
    const isUp = await this.checkServerStatus();
    this.platform.log.debug(`[${this.serverConfig.name}] Status:`, isUp ? 'UP (Contact Detected)' : 'DOWN (Contact Not Detected)');
    
    // Return the appropriate ContactSensorState value
    return isUp 
      ? this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED
      : this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
  }

  /**
   * Check server status using the configured method (ping or HTTP)
   */
  private async checkServerStatus(): Promise<boolean> {
    const method = this.serverConfig.method || this.platform.config.defaultMethod || 'ping';
    
    try {
      if (method === 'http') {
        return await this.httpCheck();
      } else {
        return await this.pingCheck();
      }
    } catch (error) {
      this.platform.log.error(`[${this.serverConfig.name}] ${method.toUpperCase()} check error:`, error);
      return false;
    }
  }

  /**
   * Ping the server to check if it's up
   */
  private async pingCheck(): Promise<boolean> {
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
   * HTTP/HTTPS check to see if server responds with 200 status
   */
  private async httpCheck(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const timeout = this.serverConfig.timeout || this.platform.config.defaultTimeout || 5000;
        let url = this.serverConfig.url;
        
        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = `http://${url}`;
        }

        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;

        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port || (isHttps ? 443 : 80),
          path: urlObj.pathname || '/',
          method: 'GET',
          timeout: timeout,
          headers: {
            'User-Agent': 'Homebridge-ServerStatus/1.0'
          }
        };

        const req = client.request(options, (res) => {
          // Accept any 2xx status code as success
          const isSuccess = res.statusCode && res.statusCode >= 200 && res.statusCode < 300;
          
          this.platform.log.debug(
            `[${this.serverConfig.name}] HTTP ${res.statusCode} ${isSuccess ? '✅' : '❌'}`
          );
          
          resolve(isSuccess || false);
          
          // Consume response data to free up memory
          res.on('data', () => {});
        });

        req.on('error', (error) => {
          this.platform.log.debug(`[${this.serverConfig.name}] HTTP request error:`, error.message);
          resolve(false);
        });

        req.on('timeout', () => {
          this.platform.log.debug(`[${this.serverConfig.name}] HTTP request timeout`);
          req.destroy();
          resolve(false);
        });

        req.end();
        
      } catch (error) {
        this.platform.log.error(`[${this.serverConfig.name}] HTTP check setup error:`, error);
        resolve(false);
      }
    });
  }

  /**
   * Start periodic monitoring of the server
   */
  private startMonitoring() {
    const interval = this.serverConfig.interval || this.platform.config.defaultInterval || 60000; // Default 1 minute

    // Initial check
    this.performStatusCheck();

    // Set up periodic checking
    this.pingInterval = setInterval(() => {
      this.performStatusCheck();
    }, interval);

    this.platform.log.info(`[${this.serverConfig.name}] Started monitoring with ${interval}ms interval`);
  }

  /**
   * Check server status and update HomeKit if status changed
   */
  private async performStatusCheck() {
    try {
      const isUp = await this.checkServerStatus();
      
      if (isUp !== this.currentStatus) {
        this.currentStatus = isUp;
        
        // Update the characteristic value
        const contactState = isUp 
          ? this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED
          : this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
          
        this.service.updateCharacteristic(this.platform.Characteristic.ContactSensorState, contactState);
        
        this.platform.log.info(`[${this.serverConfig.name}] Status changed: ${isUp ? 'UP (Contact Detected)' : 'DOWN (Contact Not Detected)'}`);
      }
    } catch (error) {
      this.platform.log.error(`[${this.serverConfig.name}] Error checking status:`, error);
      
      // If there's an error, consider the server down
      if (this.currentStatus !== false) {
        this.currentStatus = false;
        this.service.updateCharacteristic(
          this.platform.Characteristic.ContactSensorState, 
          this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED
        );
        this.platform.log.info(`[${this.serverConfig.name}] Status changed: DOWN (Contact Not Detected - due to error)`);
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