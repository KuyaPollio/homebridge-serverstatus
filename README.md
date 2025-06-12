# Homebridge Server Status Plugin

A Homebridge plugin that monitors the status of your local servers using ping and creates HomeKit sensors that can trigger automations when server status changes.

## Features

- 🔍 **Server Monitoring**: Monitor multiple servers using ping or HTTP/HTTPS requests
- 📱 **HomeKit Integration**: Creates contact sensors in HomeKit (contact detected = server up)
- ⚡ **Dual Check Methods**: Choose between ICMP ping or HTTP status code checking
- ⏰ **Periodic Checks**: Configurable check intervals for each server
- 🔔 **Status Notifications**: HomeKit notifications when server status changes
- ⚙️ **Flexible Configuration**: Individual timeout, interval, and method settings per server
- 🎯 **Automation Ready**: Use server status to trigger HomeKit automations

## Installation

1. Install the plugin through Homebridge Config UI X or manually:

```bash
npm install -g homebridge-serverstatus
```

2. Add the platform to your Homebridge configuration

## Configuration

### Basic Configuration

Add the following to your Homebridge `config.json`:

```json
{
  "platforms": [
    {
      "platform": "ServerStatusPlatform",
      "name": "Server Status",
      "defaultTimeout": 5000,
      "defaultInterval": 60000,
      "servers": [
        {
          "name": "Home Server",
          "url": "192.168.1.100"
        },
        {
          "name": "Web Server",
          "url": "example.com",
          "timeout": 3000,
          "interval": 30000
        }
      ]
    }
  ]
}
```

### Configuration Options

#### Platform Settings

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `platform` | string | `"ServerStatusPlatform"` | **Required** - Platform identifier |
| `name` | string | `"Server Status"` | Platform display name |
| `defaultMethod` | string | `"ping"` | Default check method: `"ping"` or `"http"` |
| `defaultTimeout` | number | `5000` | Default check timeout in milliseconds (1000-30000) |
| `defaultInterval` | number | `60000` | Default check interval in milliseconds (10000-300000) |
| `servers` | array | `[]` | Array of servers to monitor |

#### Server Settings

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | string | ✅ | Display name for the server in HomeKit |
| `url` | string | ✅ | Server hostname, IP address, or URL |
| `method` | string | ❌ | Check method: `"ping"` or `"http"` (overrides default) |
| `timeout` | number | ❌ | Check timeout in milliseconds (overrides default) |
| `interval` | number | ❌ | Check interval in milliseconds (overrides default) |

### Example Configuration

```json
{
  "platforms": [
    {
      "platform": "ServerStatusPlatform",
      "name": "My Servers",
      "defaultMethod": "ping",
      "defaultTimeout": 5000,
      "defaultInterval": 60000,
      "servers": [
        {
          "name": "Home NAS",
          "url": "192.168.1.50",
          "method": "ping",
          "interval": 30000
        },
        {
          "name": "Router",
          "url": "192.168.1.1",
          "method": "ping",
          "timeout": 2000
        },
        {
          "name": "External Website",
          "url": "https://www.google.com",
          "method": "http",
          "interval": 120000
        },
        {
          "name": "Web Server",
          "url": "http://192.168.1.100:8080",
          "method": "http",
          "timeout": 8000,
          "interval": 45000
        },
        {
          "name": "Game Server",
          "url": "gameserver.example.com",
          "method": "ping",
          "timeout": 10000,
          "interval": 30000
        }
      ]
    }
  ]
}
```

## How It Works

1. **Server Monitoring**: The plugin periodically checks each configured server using ping or HTTP
2. **Check Methods**: 
   - **Ping**: Uses ICMP ping to test basic connectivity
   - **HTTP**: Makes HTTP/HTTPS requests and checks for 2xx status codes (200, 201, etc.)
3. **Status Detection**: Successful response indicates the server is "up"
4. **HomeKit Integration**: Each server appears as a contact sensor in HomeKit
5. **Status Mapping**: 
   - Contact Detected = Server is UP ✅ (Connected/Responding)
   - Contact Not Detected = Server is DOWN ❌ (Disconnected/Not Responding)
6. **Automation Trigger**: Status changes trigger HomeKit notifications and can be used in automations

## Usage in HomeKit

### Viewing Status
- Open the Home app on your device
- Each monitored server appears as a contact sensor
- The sensor shows "Contact Detected" when the server is online (connected)
- The sensor shows "Contact Not Detected" when the server is offline (disconnected)

### Creating Automations
1. Open the Home app
2. Go to the Automation tab
3. Create a new automation
4. Choose "A Sensor Detects Something" or "A Sensor Stops Detecting"
5. Select your server contact sensor
6. Configure actions (send notification, control other devices, etc.)

### Example Automations
- **Server Down Alert**: Send notification when contact is no longer detected
- **Backup Server**: Turn on backup systems when main server goes down
- **Status Lights**: Control smart lights to show server status (green = contact detected, red = no contact)
- **Logging**: Trigger shortcuts to log server uptime/downtime

## Troubleshooting

### Server Not Responding
- Verify the server URL/IP address is correct
- Check if the server allows ping requests (some servers block ICMP)
- Try increasing the timeout value
- Ensure your network can reach the server

### Plugin Not Loading
- Check Homebridge logs for error messages
- Verify the configuration syntax is correct
- Ensure all required fields are provided

### HomeKit Not Updating
- Check if the ping interval is appropriate (not too frequent)
- Verify Homebridge is properly connected to HomeKit
- Try restarting Homebridge

## Check Methods

### 🏓 **Ping Method**
- **Protocol**: ICMP (Internet Control Message Protocol)
- **Use Case**: Basic connectivity testing, network devices, servers
- **Pros**: Very fast, minimal overhead, tests basic network connectivity
- **Cons**: Some servers/firewalls block ICMP, doesn't test actual services
- **Best For**: Routers, switches, basic server connectivity

### 🌐 **HTTP Method**
- **Protocol**: HTTP/HTTPS requests
- **Use Case**: Web servers, API endpoints, web applications
- **Pros**: Tests actual service availability, works through firewalls, more accurate for web services
- **Cons**: Slightly higher overhead, requires HTTP service
- **Status Codes**: Accepts any 2xx response (200, 201, 202, etc.) as "up"
- **Best For**: Websites, web servers, APIs, applications

### 🤔 **Which Method to Choose?**
- **Network Equipment** (routers, switches): Use `ping`
- **Web Servers/Websites**: Use `http` 
- **API Endpoints**: Use `http`
- **Basic Server Connectivity**: Use `ping`
- **Servers Behind Firewalls**: Try `http` if `ping` fails

## Technical Details

- **Ping Method**: Uses ICMP ping to test connectivity
- **HTTP Method**: Makes GET requests and checks for 2xx status codes
- **URL Support**: Automatically extracts hostname from HTTP/HTTPS URLs
- **Error Handling**: Network errors are treated as server down status
- **Performance**: Lightweight with minimal resource usage
- **Reliability**: Built-in retry logic and error recovery

## Development

### Building from Source

```bash
git clone https://github.com/your-username/homebridge-serverstatus.git
cd homebridge-serverstatus
npm install
npm run build
```

### Project Structure

```
src/
├── index.ts          # Plugin entry point
├── platform.ts       # Main platform class
├── accessory.ts      # Server monitoring accessory
└── settings.ts       # Configuration interfaces
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the Homebridge logs for error details
- Ensure your configuration follows the examples above

---

**Made with ❤️ for the Homebridge community** 