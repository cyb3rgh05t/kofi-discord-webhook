# Ko-fi to Discord Webhook

A lightweight service that forwards Ko-fi donations, subscriptions, and shop orders to Discord with beautiful, customizable embeds.

![Example of Discord embed](https://storage.ko-fi.com/cdn/brandasset/kofi_s_logo_nolabel.png)

## Features

- 🎨 **Beautiful Embeds**: Attractive Discord notifications with custom colors based on transaction type
- 🌎 **Multilingual Support**: Built-in translations for English, German, and French
- 🛠️ **Customizable**: Change the service name, colors, and appearance
- 🔄 **Automatic Detection**: Identifies donations, subscriptions, and shop orders
- 🔒 **Secure**: Verification token support to ensure authentic requests
- 🧩 **Flexible Configuration**: Use environment variables or config files

## Quick Start

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) and Docker Compose
- A Discord webhook URL (create one in your Discord server's channel settings)
- Your Ko-fi API webhook verification token

### 1. Create a docker-compose.yml file

```yaml
version: "3"
services:
  kofi-discord-webhook:
    container_name: "kofi-discord-webhook"
    image: "ghcr.io/yourusername/kofi-discord-webhook:latest"
    restart: unless-stopped
    ports:
      - "3033:3033" # Expose the port directly
    environment:
      - "PORT=3033"
      - "DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url"
      - "KOFI_VERIFICATION_TOKEN=your-verification-token"
      - "LANGUAGE=en" # Options: en, de, fr
      - "KOFI_NAME=Ko-fi" # Customize the name if desired
    volumes:
      - "./config:/app/config" # Optional: For config file
      - "./logs:/app/logs" # Optional: For logging
```

### 2. Start the service

```bash
docker-compose up -d
```

### 3. Configure Ko-fi Webhook

1. Go to your Ko-fi account → **Settings** → **API**
2. Enable webhooks
3. Set your webhook URL to `http://your-server-ip:3033/webhook`
4. Set/copy your verification token and add it to your environment variables
5. Save your settings

### 4. Test the webhook

Make a test donation on your Ko-fi page or use the included test script:

```bash
# Create test script
cat > test-webhook.js << 'EOF'
const http = require('http');

const payload = JSON.stringify({
  data: JSON.stringify({
    verification_token: "your-token-here",
    type: "Donation",
    from_name: "Test User",
    message: "This is a test!",
    amount: "5.00",
    currency: "USD",
    kofi_transaction_id: "TEST123"
  })
});

const options = {
  hostname: 'localhost',
  port: 3033,
  path: '/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(chunk.toString());
  });
});

req.write(payload);
req.end();
EOF

# Run test
node test-webhook.js
```

## Configuration

### Environment Variables

| Variable                  | Description                             | Default                     |
| ------------------------- | --------------------------------------- | --------------------------- |
| `PORT`                    | Port the server listens on              | 3033                        |
| `DISCORD_WEBHOOK_URL`     | Discord webhook URL (required)          | -                           |
| `KOFI_VERIFICATION_TOKEN` | Ko-fi verification token                | -                           |
| `LANGUAGE`                | Language for notifications (en, de, fr) | en                          |
| `KOFI_NAME`               | Custom name for the service             | Ko-fi                       |
| `KOFI_LOGO`               | URL to logo for embeds                  | Ko-fi logo                  |
| `WEBHOOK_USERNAME`        | Discord webhook username                | [KOFI_NAME] Supporter Alert |

### Configuration File

Alternatively, you can create a `.env` file in the `config` directory:

```
# config/.env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url
KOFI_VERIFICATION_TOKEN=your-verification-token
LANGUAGE=en
KOFI_NAME=Ko-fi
```

## Customization

### Language Support

The service supports multiple languages for notifications:

```yaml
environment:
  - "LANGUAGE=en" # English (default)
  - "LANGUAGE=de" # German
  - "LANGUAGE=fr" # French
```

### Custom Branding

You can customize the name and logo shown in Discord notifications:

```yaml
environment:
  - "KOFI_NAME=MyBrand" # Replace with your brand name
  - "KOFI_LOGO=https://your-site.com/logo.png" # Optional custom logo
```

## Webhook Endpoints

- `GET /health` - Check if the service is running
- `GET /test-discord` - Send a test message to verify Discord webhook
- `POST /webhook` - The main endpoint for Ko-fi to send notifications

## Troubleshooting

### Check if the service is running

```bash
curl http://your-server-ip:3033/health
```

### Test Discord connectivity

Visit `http://your-server-ip:3033/test-discord` in your browser to send a test message to Discord.

### Check logs

```bash
docker-compose logs -f
```

### Common Issues

1. **Webhook not receiving notifications**

   - Verify your server is publicly accessible on port 3033
   - Check that the Ko-fi webhook URL is correct
   - Ensure your verification token matches exactly

2. **Discord not receiving messages**

   - Verify your Discord webhook URL is valid
   - Check the logs for any errors when sending to Discord

3. **404 errors when testing**
   - Make sure you're using the correct endpoint: `/webhook`
   - Verify your server is running with `curl http://your-server-ip:3033/health`

## Advanced Usage

### Custom Discord Webhook Username

```yaml
environment:
  - "WEBHOOK_USERNAME=Ko-fi Notifications"
```

### Debug Mode

For more detailed logs:

```yaml
environment:
  - "NODE_ENV=development"
  - "DEBUG=true"
```

## Security Considerations

- Consider using a reverse proxy with HTTPS for production use
- If using a domain, ensure proper DNS configuration
- Use a strong verification token in Ko-fi settings

## License

MIT
