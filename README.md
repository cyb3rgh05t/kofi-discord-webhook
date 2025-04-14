# Ko-fi to Discord Webhook Service

This service forwards Ko-fi notifications to a Discord channel using webhooks. When someone supports you on Ko-fi, a beautifully formatted message will appear in your Discord channel.

## Features

- Forwards Ko-fi donations, subscriptions, and shop orders to Discord
- Displays supporter name, amount, message, and transaction details
- Secure verification token support
- Dockerized for easy deployment
- Modern JavaScript with ES modules
- Environment-based configuration

## Setup Instructions

### Prerequisites

- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/) installed
- A Discord webhook URL (create one in your Discord server's channel settings)
- Your Ko-fi webhook settings configured

### Configuration

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/kofi-discord-webhook.git
   cd kofi-discord-webhook
   ```

2. Create a `.env` file from the example:

   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file with your details:
   ```
   PORT=3000
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-url-here
   KOFI_VERIFICATION_TOKEN=your-kofi-verification-token
   ```

### Running with Docker

1. Build and start the container:

   ```bash
   docker-compose up -d
   ```

2. Check logs:

   ```bash
   docker-compose logs -f
   ```

3. Stop the service:
   ```bash
   docker-compose down
   ```

### Ko-fi Webhook Configuration

1. Go to your Ko-fi account and navigate to **Settings** > **API**
2. Enable webhooks
3. Enter your server's URL: `https://your-server-url.com/webhook`
4. Generate a verification token (or use your own) and add it to your `.env` file
5. Save your settings

## Running Without Docker

If you prefer to run without Docker:

1. Install Node.js 18 or later
2. Run the following commands:
   ```bash
   npm install
   npm start
   ```

## API Endpoints

- `GET /`: Service status check
- `GET /health`: Health check for monitoring
- `POST /webhook`: Ko-fi webhook endpoint

## Security Considerations

- Always use the verification token to ensure webhook authenticity
- Consider using HTTPS in production
- The service runs as a non-root user inside Docker for better security

## Troubleshooting

- Check Discord webhook URL is correct
- Ensure Ko-fi webhook settings are pointing to the correct URL
- Verify your verification token matches in both Ko-fi and your `.env` file
- Check the logs for detailed error messages

## License

MIT
