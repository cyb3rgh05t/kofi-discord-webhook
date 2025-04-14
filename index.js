// Modern Ko-fi to Discord webhook integration
import express from "express";
import { createServer } from "http";
import { Webhook, MessageBuilder } from "discord-webhook-node";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Environment variables with defaults
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const VERIFICATION_TOKEN = process.env.KOFI_VERIFICATION_TOKEN;

// Validate required environment variables
if (!WEBHOOK_URL) {
  console.error("Error: DISCORD_WEBHOOK_URL environment variable is required");
  process.exit(1);
}

// Initialize Discord webhook
const webhook = new Webhook(WEBHOOK_URL);

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root endpoint - DEFINED FIRST to ensure it's not blocked by other routes
app.get("/", (req, res) => {
  console.log("Root endpoint accessed");
  res
    .status(200)
    .json({ message: "Ko-Fi to Discord webhook service is online!" });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({
      status: "OK",
      message: "Ko-Fi to Discord webhook service is running",
    });
});

// Ko-fi webhook endpoint
app.post("/webhook", async (req, res) => {
  try {
    // Extract and parse data from Ko-fi
    const { data } = req.body;

    if (!data) {
      return res
        .status(400)
        .json({ success: false, error: "No data provided" });
    }

    // Parse the Ko-fi data (Ko-fi sends data as a string that needs to be parsed)
    const kofiData = typeof data === "string" ? JSON.parse(data) : data;

    // Verify the token if configured
    if (
      VERIFICATION_TOKEN &&
      kofiData.verification_token !== VERIFICATION_TOKEN
    ) {
      console.warn("Invalid verification token received");
      return res
        .status(401)
        .json({ success: false, error: "Invalid verification token" });
    }

    // Log the transaction
    console.log(
      `New Ko-fi transaction: ${kofiData.kofi_transaction_id || "Unknown ID"}`
    );
    console.log(
      `Type: ${kofiData.type || "Unknown type"}, Amount: ${
        kofiData.amount || "Unknown amount"
      }`
    );

    // Create Discord embed message
    const embed = new MessageBuilder()
      .setTitle("New Ko-Fi Support Received! 🎉")
      .setColor(0x29abe0) // Ko-fi blue color
      .setThumbnail(
        "https://storage.ko-fi.com/cdn/brandasset/kofi_s_logo_nolabel.png"
      )
      .addField("From", kofiData.from_name || "Anonymous", true)
      .addField("Type", kofiData.type || "Donation", true)
      .addField(
        "Amount",
        kofiData.amount
          ? `${kofiData.amount} ${kofiData.currency || ""}`
          : "N/A",
        true
      );

    // Add transaction ID if available
    if (kofiData.kofi_transaction_id) {
      embed.addField("Transaction ID", kofiData.kofi_transaction_id, true);
    }

    // Add message if available
    if (kofiData.message && kofiData.message.trim()) {
      embed.addField("Message", kofiData.message);
    }

    // Add timestamp
    embed.setTimestamp();

    // Send the webhook
    await webhook.send(embed);

    // Return success
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Handle 404s - MUST be after all other routes
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ success: false, error: "Not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

// Start the server
const server = createServer(app);
server.listen(PORT, () => {
  console.log(`Ko-Fi to Discord webhook service listening on port ${PORT}`);
  console.log(`Root endpoint available at http://localhost:${PORT}/`);
  console.log(
    `Health check endpoint available at http://localhost:${PORT}/health`
  );
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});
