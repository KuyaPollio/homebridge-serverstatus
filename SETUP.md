# Setup Instructions

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Plugin
```bash
npm run build
```

### 3. Test the Plugin (Optional)
You can link the plugin locally for testing:
```bash
npm link
```

Then in your Homebridge config directory:
```bash
npm link homebridge-serverstatus
```

### 4. Configure Homebridge

Add the platform configuration to your Homebridge `config.json`:

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
          "name": "Router",
          "url": "192.168.1.1"
        },
        {
          "name": "Home Server",
          "url": "192.168.1.100"
        }
      ]
    }
  ]
}
```

### 5. Restart Homebridge

After adding the configuration, restart your Homebridge instance.

## Development

### Watch Mode
For development, you can use watch mode to automatically rebuild on changes:
```bash
npm run watch
```

### File Structure
- `src/index.ts` - Main plugin entry point
- `src/platform.ts` - Platform implementation
- `src/accessory.ts` - Individual server accessory
- `src/settings.ts` - Configuration interfaces
- `config.schema.json` - Configuration UI schema
- `example-config.json` - Example configuration

### Debugging
- Check Homebridge logs for error messages
- Verify your configuration matches the schema
- Test ping connectivity manually if servers aren't responding

## Homebridge UI Integration

This plugin includes a configuration schema (`config.schema.json`) that provides a user-friendly interface in Homebridge Config UI X for easy setup without manually editing JSON files.

## Publishing (For Maintainers)

1. Update version in `package.json`
2. Build the project: `npm run build`
3. Publish to npm: `npm publish`

## Features Implemented

✅ **Core Functionality**
- Server monitoring via ICMP ping
- HomeKit motion sensor integration
- Configurable timeouts and intervals
- Multiple server support

✅ **Configuration**
- JSON schema for Homebridge UI
- Flexible per-server settings
- Default value fallbacks

✅ **TypeScript**
- Full TypeScript implementation
- Type safety and IntelliSense support
- Compiled to JavaScript for runtime

✅ **HomeKit Integration**
- Motion sensors for server status
- Automatic HomeKit notifications on status change
- Compatible with HomeKit automations

✅ **Error Handling**
- Graceful failure handling
- Detailed logging
- Network error recovery 